<?php

namespace Tests\Feature;

use App\Actions\Payment\ExpireOverdueInvoices;
use App\Actions\Payment\VerifyInvoice;
use App\Enums\InvoiceStatus;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Events\InvoiceExpired;
use App\Events\InvoiceRejected;
use App\Events\InvoiceVerified;
use App\Events\ProofUploaded;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Invoice;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class F07PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
    }

    protected function participantUser(): User
    {
        return User::factory()->create([
            'role' => Role::Participant->value,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function adminUser(): User
    {
        return User::factory()->create([
            'role' => Role::Admin->value,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function judgeUser(): User
    {
        return User::factory()->create([
            'role' => Role::Judge->value,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    /**
     * Tagihan + satu entri milik pengguna tertentu.
     *
     * @return array{0: Invoice, 1: Registration}
     */
    protected function invoiceWithEntry(User $owner, InvoiceStatus $status = InvoiceStatus::Unpaid): array
    {
        $competition = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'fee' => 75000,
            'status' => 'published',
        ]);

        $invoice = Invoice::factory()->create([
            'owner_id' => $owner->id,
            'subtotal' => 75000,
            'unique_code' => 237,
            'total' => 75237,
            'status' => $status,
            'due_at' => now('Asia/Jakarta')->addDays(2),
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $owner->id,
            'invoice_id' => $invoice->id,
            'status' => RegistrationStatus::AwaitingPayment,
            'fee' => 75000,
        ]);

        return [$invoice, $registration];
    }

    protected function proofFile(string $name = 'bukti.png'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 200, 300);
    }

    public function test_ac_f07_01_detail_tagihan_memuat_rekening_dan_total_kode_unik(): void
    {
        $owner = $this->participantUser();
        [$invoice, $registration] = $this->invoiceWithEntry($owner);

        $response = $this->actingAs($owner)->get(route('invoices.show', $invoice->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('invoices/Show')
            ->where('invoice.number', $invoice->number)
            ->where('invoice.subtotal', 75000)
            ->where('invoice.unique_code', 237)
            ->where('invoice.total', 75237)
            ->where('invoice.bank_name', 'BCA')
            ->where('invoice.bank_account_number', '1234567890')
            ->has('entries', 1)
            ->where('entries.0.code', $registration->code));

        $this->assertSame($invoice->subtotal + $invoice->unique_code, $invoice->total);
    }

    public function test_ac_f07_02_hanya_pemilik_dan_admin_bisa_melihat_tagihan_dan_bukti(): void
    {
        $owner = $this->participantUser();
        $other = $this->participantUser();
        $admin = $this->adminUser();
        $judge = $this->judgeUser();

        [$invoice] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill([
            'proof_path' => 'invoices/'.$invoice->id.'/bukti.png',
            'proof_uploaded_at' => now('Asia/Jakarta'),
        ])->save();
        Storage::disk('local')->put($invoice->proof_path, 'x');

        $this->actingAs($owner)->get(route('invoices.show', $invoice->id))->assertOk();
        $this->actingAs($owner)->get(route('invoices.proof', $invoice->id))->assertOk();

        $this->actingAs($other)->get(route('invoices.show', $invoice->id))->assertForbidden();
        $this->actingAs($other)->get(route('invoices.proof', $invoice->id))->assertForbidden();

        $this->actingAs($admin)->get(route('invoices.show', $invoice->id))->assertOk();
        $this->actingAs($admin)->get(route('invoices.proof', $invoice->id))->assertOk();
    }

    public function test_ac_f07_03_unggah_bukti_membuat_tagihan_dan_entri_menunggu_verifikasi(): void
    {
        Event::fake([ProofUploaded::class]);

        $owner = $this->participantUser();
        [$invoice, $registration] = $this->invoiceWithEntry($owner);

        $response = $this->actingAs($owner)->post(route('invoices.upload-proof', $invoice->id), [
            'proof' => $this->proofFile(),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::AwaitingVerification, $invoice->status);
        $this->assertNotNull($invoice->proof_path);
        $this->assertNotNull($invoice->proof_uploaded_at);
        Storage::disk('local')->assertExists($invoice->proof_path);
        $this->assertSame(RegistrationStatus::AwaitingVerification, $registration->fresh()->status);

        Event::assertDispatched(ProofUploaded::class);
    }

    public function test_ac_f07_04_unggah_bukti_ditolak_untuk_status_terkunci(): void
    {
        $owner = $this->participantUser();

        foreach ([InvoiceStatus::Paid, InvoiceStatus::Expired, InvoiceStatus::Cancelled, InvoiceStatus::AwaitingVerification] as $status) {
            [$invoice] = $this->invoiceWithEntry($owner, $status);

            $this->actingAs($owner)
                ->post(route('invoices.upload-proof', $invoice->id), ['proof' => $this->proofFile()])
                ->assertSessionHasErrors('proof');

            $this->assertSame($status, $invoice->fresh()->status);
            $this->assertNull($invoice->fresh()->proof_path);
        }
    }

    public function test_ac_f07_04_berkas_bukan_gambar_atau_pdf_ditolak(): void
    {
        $owner = $this->participantUser();
        [$invoice] = $this->invoiceWithEntry($owner);

        $this->actingAs($owner)->post(route('invoices.upload-proof', $invoice->id), [
            'proof' => UploadedFile::fake()->create('bukti.txt', 20, 'text/plain'),
        ])->assertSessionHasErrors('proof');

        $this->assertNull($invoice->fresh()->proof_path);
    }

    public function test_ac_f07_05_antrean_admin_filter_cari_dan_urutan_tertua(): void
    {
        $admin = $this->adminUser();
        $ownerA = $this->participantUser();
        $ownerB = $this->participantUser();

        [$oldInvoice] = $this->invoiceWithEntry($ownerA, InvoiceStatus::AwaitingVerification);
        $oldInvoice->forceFill([
            'proof_path' => 'invoices/a.png',
            'proof_uploaded_at' => now('Asia/Jakarta')->subHours(5),
        ])->save();

        [$newInvoice] = $this->invoiceWithEntry($ownerB, InvoiceStatus::AwaitingVerification);
        $newInvoice->forceFill([
            'proof_path' => 'invoices/b.png',
            'proof_uploaded_at' => now('Asia/Jakarta')->subHour(),
        ])->save();

        $response = $this->actingAs($admin)->get(route('admin.payments.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/payments/Index')
            ->has('invoices', 2)
            ->where('invoices.0.id', $oldInvoice->id)
            ->where('invoices.1.id', $newInvoice->id));

        // Cari berdasarkan nomor tagihan
        $this->actingAs($admin)
            ->get(route('admin.payments.index', ['q' => $newInvoice->number]))
            ->assertInertia(fn ($page) => $page
                ->has('invoices', 1)
                ->where('invoices.0.number', $newInvoice->number));

        // Filter jenjang: SMP tidak ada isinya
        $this->actingAs($admin)
            ->get(route('admin.payments.index', ['level' => Level::SmpMts->value]))
            ->assertInertia(fn ($page) => $page->has('invoices', 0));
    }

    public function test_ac_f07_05_pratinjau_bukti_admin_lewat_rute_berotorisasi(): void
    {
        $admin = $this->adminUser();
        $owner = $this->participantUser();
        $judge = $this->judgeUser();

        [$invoice] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/x/bukti.png'])->save();
        Storage::disk('local')->put($invoice->proof_path, 'x');

        $this->actingAs($admin)->get(route('admin.payments.proof', $invoice->id))->assertOk();
        $this->actingAs($judge)->get(route('admin.payments.proof', $invoice->id))->assertForbidden();
        $this->actingAs($owner)->get(route('admin.payments.proof', $invoice->id))->assertForbidden();
    }

    public function test_ac_f07_06_terima_pembayaran_mengesahkan_tagihan_dan_entri(): void
    {
        Event::fake([InvoiceVerified::class]);

        $admin = $this->adminUser();
        $owner = $this->participantUser();
        [$invoice, $registration] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/ok.png'])->save();

        $this->actingAs($admin)
            ->post(route('admin.payments.verify', $invoice->id))
            ->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame($admin->id, $invoice->verified_by);
        $this->assertNotNull($invoice->verified_at);
        $this->assertSame(RegistrationStatus::Verified, $registration->fresh()->status);

        Event::assertDispatched(InvoiceVerified::class);
    }

    public function test_ac_f07_07_tolak_wajib_alasan_dan_bisa_unggah_ulang(): void
    {
        Event::fake([InvoiceRejected::class]);

        $admin = $this->adminUser();
        $owner = $this->participantUser();
        [$invoice, $registration] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/reject.png'])->save();

        // Tanpa alasan → ditolak validasi
        $this->actingAs($admin)
            ->post(route('admin.payments.reject', $invoice->id), ['reason' => ''])
            ->assertSessionHasErrors('reason');

        $this->assertSame(InvoiceStatus::AwaitingVerification, $invoice->fresh()->status);

        // Dengan alasan → rejected untuk tagihan dan entri
        $this->actingAs($admin)
            ->post(route('admin.payments.reject', $invoice->id), ['reason' => 'Nominal transfer tidak sesuai'])
            ->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Rejected, $invoice->status);
        $this->assertSame('Nominal transfer tidak sesuai', $invoice->rejection_reason);
        $this->assertSame(RegistrationStatus::Rejected, $registration->fresh()->status);
        Event::assertDispatched(InvoiceRejected::class);

        // Pengguna bisa unggah ulang setelah ditolak
        $this->actingAs($owner)
            ->post(route('invoices.upload-proof', $invoice->id), ['proof' => $this->proofFile('ulang.png')])
            ->assertSessionHasNoErrors();

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::AwaitingVerification, $invoice->status);
        $this->assertNull($invoice->rejection_reason);
    }

    public function test_ac_f07_08_dua_admin_proses_tagihan_sama_yang_kedua_ditolak(): void
    {
        $adminA = $this->adminUser();
        $adminB = $this->adminUser();
        $owner = $this->participantUser();
        [$invoice] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/race.png'])->save();

        $this->actingAs($adminA)
            ->post(route('admin.payments.verify', $invoice->id))
            ->assertSessionHasNoErrors();

        $this->actingAs($adminB)
            ->post(route('admin.payments.verify', $invoice->id))
            ->assertSessionHasErrors('invoice');

        $this->assertSame(InvoiceStatus::Paid, $invoice->fresh()->status);
        $this->assertSame($adminA->id, $invoice->fresh()->verified_by);

        // Action langsung juga menolak
        $this->expectException(BusinessRuleViolation::class);
        (new VerifyInvoice)->handle($adminB, $invoice->fresh());
    }

    public function test_ac_f07_09_expire_hanya_unpaid_rejected_lewat_jatuh_tempo(): void
    {
        Event::fake([InvoiceExpired::class]);

        $owner = $this->participantUser();

        [$overdueUnpaid, $regUnpaid] = $this->invoiceWithEntry($owner, InvoiceStatus::Unpaid);
        $overdueUnpaid->forceFill(['due_at' => now('Asia/Jakarta')->subHours(3)])->save();

        [$overdueRejected, $regRejected] = $this->invoiceWithEntry($owner, InvoiceStatus::Rejected);
        $overdueRejected->forceFill(['due_at' => now('Asia/Jakarta')->subDay()])->save();

        [$overdueAwaiting, $regAwaiting] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $overdueAwaiting->forceFill(['due_at' => now('Asia/Jakarta')->subDay()])->save();
        $regAwaiting->forceFill(['status' => RegistrationStatus::AwaitingVerification])->save();

        [$overduePaid, $regPaid] = $this->invoiceWithEntry($owner, InvoiceStatus::Paid);
        $overduePaid->forceFill(['due_at' => now('Asia/Jakarta')->subDay()])->save();

        [$futureUnpaid, $regFuture] = $this->invoiceWithEntry($owner, InvoiceStatus::Unpaid);
        $futureUnpaid->forceFill(['due_at' => now('Asia/Jakarta')->addDay()])->save();

        $count = (new ExpireOverdueInvoices)->handle();

        $this->assertSame(2, $count);
        $this->assertSame(InvoiceStatus::Expired, $overdueUnpaid->fresh()->status);
        $this->assertSame(InvoiceStatus::Expired, $overdueRejected->fresh()->status);
        $this->assertSame(InvoiceStatus::AwaitingVerification, $overdueAwaiting->fresh()->status);
        $this->assertSame(InvoiceStatus::Paid, $overduePaid->fresh()->status);
        $this->assertSame(InvoiceStatus::Unpaid, $futureUnpaid->fresh()->status);

        // Slot lepas lewat status cancelled
        $this->assertSame(RegistrationStatus::Cancelled, $regUnpaid->fresh()->status);
        $this->assertSame(RegistrationStatus::Cancelled, $regRejected->fresh()->status);
        $this->assertSame(RegistrationStatus::AwaitingVerification, $regAwaiting->fresh()->status);
        $this->assertSame(RegistrationStatus::AwaitingPayment, $regFuture->fresh()->status);

        Event::assertDispatched(InvoiceExpired::class);
    }

    public function test_ac_f07_09_perintah_expire_terjadwal_tiap_jam(): void
    {
        $events = collect(app(Schedule::class)->events());

        $command = $events->first(fn ($event) => str_contains((string) $event->command, 'invoices:expire'));

        $this->assertNotNull($command, 'Perintah invoices:expire tidak terjadwal.');
        $this->assertSame('0 * * * *', $command->expression);
    }

    public function test_ac_f07_10_juri_dan_peserta_tidak_bisa_memverifikasi(): void
    {
        $owner = $this->participantUser();
        $judge = $this->judgeUser();
        [$invoice] = $this->invoiceWithEntry($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/p.png'])->save();

        $this->actingAs($judge)->post(route('admin.payments.verify', $invoice->id))->assertForbidden();
        $this->actingAs($owner)->post(route('admin.payments.verify', $invoice->id))->assertForbidden();
        $this->actingAs($owner)->post(route('admin.payments.reject', $invoice->id), ['reason' => 'coba'])->assertForbidden();

        $this->assertSame(InvoiceStatus::AwaitingVerification, $invoice->fresh()->status);
    }

    public function test_ac_f07_11_perpanjang_jatuh_tempo_menghidupkan_tagihan(): void
    {
        $admin = $this->adminUser();
        $owner = $this->participantUser();

        [$unpaid] = $this->invoiceWithEntry($owner, InvoiceStatus::Unpaid);
        $unpaid->forceFill(['due_at' => now('Asia/Jakarta')->subDay()])->save();

        [$rejected] = $this->invoiceWithEntry($owner, InvoiceStatus::Rejected);
        $rejected->forceFill([
            'due_at' => now('Asia/Jakarta')->subDay(),
            'rejection_reason' => 'Bukti tidak terbaca',
            'verified_by' => $admin->id,
            'verified_at' => now('Asia/Jakarta'),
        ])->save();

        $this->actingAs($admin)
            ->post(route('admin.payments.extend', $unpaid->id), ['hours' => 48])
            ->assertSessionHasNoErrors();

        $unpaid->refresh();
        $this->assertSame(InvoiceStatus::Unpaid, $unpaid->status);
        $this->assertTrue($unpaid->due_at->isFuture());

        $this->actingAs($admin)
            ->post(route('admin.payments.extend', $rejected->id), ['hours' => 24])
            ->assertSessionHasNoErrors();

        $rejected->refresh();
        $this->assertSame(InvoiceStatus::Unpaid, $rejected->status);
        $this->assertNull($rejected->rejection_reason);
        $this->assertNull($rejected->verified_at);
        $this->assertTrue($rejected->due_at->isFuture());

        // Status paid tidak bisa diperpanjang
        $paid = Invoice::factory()->paid()->create(['owner_id' => $owner->id]);

        $this->actingAs($admin)
            ->post(route('admin.payments.extend', $paid->id), ['hours' => 24])
            ->assertSessionHasErrors('invoice');
    }

    public function test_ac_f07_01_daftar_tagihan_hanya_milik_pengguna(): void
    {
        $owner = $this->participantUser();
        $other = $this->participantUser();

        [$mine] = $this->invoiceWithEntry($owner);
        $this->invoiceWithEntry($other);

        $this->actingAs($owner)
            ->get(route('invoices.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('invoices/Index')
                ->has('invoices', 1)
                ->where('invoices.0.id', $mine->id));
    }

    public function test_ac_f07_03_bukti_lama_dihapus_saat_unggah_ulang(): void
    {
        $owner = $this->participantUser();
        [$invoice] = $this->invoiceWithEntry($owner);

        $this->actingAs($owner)
            ->post(route('invoices.upload-proof', $invoice->id), ['proof' => $this->proofFile('pertama.png')]);

        $first = $invoice->fresh()->proof_path;
        $this->assertNotNull($first);
        Storage::disk('local')->assertExists($first);

        $invoice->forceFill(['status' => InvoiceStatus::Rejected])->save();

        $this->actingAs($owner)
            ->post(route('invoices.upload-proof', $invoice->id), ['proof' => $this->proofFile('kedua.png')]);

        $second = $invoice->fresh()->proof_path;
        $this->assertNotNull($second);
        $this->assertNotSame($first, $second);
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($second);
    }
}
