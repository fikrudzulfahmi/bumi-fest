<?php

namespace Tests\Feature;

use App\Actions\Payment\ExpireOverdueInvoices;
use App\Actions\Payment\RejectInvoice;
use App\Actions\Payment\UploadPaymentProof;
use App\Actions\Payment\VerifyInvoice;
use App\Enums\InvoiceStatus;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Events\InvoiceCreated;
use App\Events\InvoiceExpired;
use App\Events\InvoiceRejected;
use App\Events\InvoiceVerified;
use App\Events\ProofUploaded;
use App\Jobs\SendWhatsappMessage;
use App\Listeners\NotifyAdminsProofUploaded;
use App\Listeners\SendInvoiceCreatedNotification;
use App\Listeners\SendInvoiceExpiredNotification;
use App\Listeners\SendInvoiceRejectedNotification;
use App\Listeners\SendInvoiceVerifiedNotification;
use App\Models\Competition;
use App\Models\Invoice;
use App\Models\Registration;
use App\Models\User;
use App\Notifications\CertificateReadyNotification;
use App\Notifications\InvoiceCreatedNotification;
use App\Notifications\InvoiceExpiredNotification;
use App\Notifications\InvoiceRejectedNotification;
use App\Notifications\InvoiceVerifiedNotification;
use App\Notifications\ProofUploadedNotification;
use App\Notifications\ResultsPublishedNotification;
use App\Services\Notifications\WhatsappNotifier;
use App\Services\Whatsapp\LogWhatsappGateway;
use App\Services\Whatsapp\NullWhatsappGateway;
use App\Services\Whatsapp\PhoneNumber;
use App\Services\Whatsapp\WhatsappGateway;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class F08NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
        config(['services.whatsapp.driver' => 'null']);
    }

    protected function userWithRole(Role $role, ?string $whatsapp = '081234567890'): User
    {
        return User::factory()->create([
            'role' => $role->value,
            'preferred_level' => Level::SdMi->value,
            'whatsapp' => $whatsapp,
            'is_active' => true,
        ]);
    }

    /**
     * @return array{0: Invoice, 1: Registration}
     */
    protected function invoiceFor(User $owner, InvoiceStatus $status = InvoiceStatus::Unpaid): array
    {
        $competition = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'fee' => 75000,
            'status' => 'published',
        ]);

        $invoice = Invoice::factory()->create([
            'owner_id' => $owner->id,
            'subtotal' => 75000,
            'unique_code' => 137,
            'total' => 75137,
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

    public function test_ac_f08_01_tiap_event_mengirim_notifikasi_ke_penerima_yang_benar(): void
    {
        Notification::fake();

        $owner = $this->userWithRole(Role::Participant);
        $admin = $this->userWithRole(Role::Admin);
        [$invoice] = $this->invoiceFor($owner);

        event(new InvoiceCreated($invoice));
        Notification::assertSentTo($owner, InvoiceCreatedNotification::class);
        Notification::assertNotSentTo($admin, InvoiceCreatedNotification::class);

        $invoice->forceFill([
            'status' => InvoiceStatus::AwaitingVerification,
            'proof_path' => 'invoices/a.png',
        ])->save();

        event(new ProofUploaded($invoice->fresh()));
        Notification::assertSentTo($admin, ProofUploadedNotification::class);
        Notification::assertNotSentTo($owner, ProofUploadedNotification::class);

        $invoice->forceFill(['status' => InvoiceStatus::Paid])->save();
        event(new InvoiceVerified($invoice->fresh()));
        Notification::assertSentTo($owner, InvoiceVerifiedNotification::class);

        $invoice->forceFill(['status' => InvoiceStatus::Rejected])->save();
        event(new InvoiceRejected($invoice->fresh(), 'Nominal tidak sesuai'));
        Notification::assertSentTo($owner, InvoiceRejectedNotification::class);

        $invoice->forceFill(['status' => InvoiceStatus::Expired])->save();
        event(new InvoiceExpired($invoice->fresh()));
        Notification::assertSentTo($owner, InvoiceExpiredNotification::class);

        Notification::assertCount(5);
    }

    public function test_ac_f08_02_email_tagihan_memuat_total_rekening_jatuh_tempo_dan_tautan(): void
    {
        $owner = $this->userWithRole(Role::Participant);
        [$invoice] = $this->invoiceFor($owner);

        $mail = (new InvoiceCreatedNotification($invoice))->toMail($owner);
        $rendered = (string) $mail->render();

        $this->assertSame('Tagihan Pendaftaran '.$invoice->number, $mail->subject);
        $this->assertStringContainsString('75.137', $rendered);
        $this->assertStringContainsString('BCA', $rendered);
        $this->assertStringContainsString('1234567890', $rendered);
        $this->assertStringContainsString('Jatuh tempo', $rendered);
        $this->assertStringContainsString(route('invoices.show', $invoice->id), $rendered);
    }

    public function test_ac_f08_03_email_penolakan_memuat_alasan_dan_tautan_unggah_ulang(): void
    {
        $owner = $this->userWithRole(Role::Participant);
        [$invoice] = $this->invoiceFor($owner);

        $mail = (new InvoiceRejectedNotification($invoice, 'Bukti buram, mohon unggah ulang'))->toMail($owner);
        $rendered = (string) $mail->render();

        $this->assertStringContainsString('Bukti buram, mohon unggah ulang', $rendered);
        $this->assertStringContainsString(route('invoices.show', $invoice->id), $rendered);
        $this->assertStringContainsString('Unggah Ulang Bukti', $rendered);
    }

    public function test_ac_f08_04_bukti_unggah_hanya_ke_admin_bukan_juri_atau_peserta(): void
    {
        Notification::fake();

        $owner = $this->userWithRole(Role::Participant);
        $adminA = $this->userWithRole(Role::Admin);
        $adminB = $this->userWithRole(Role::Admin);
        $judge = $this->userWithRole(Role::Judge);
        $other = $this->userWithRole(Role::Participant);

        [$invoice] = $this->invoiceFor($owner, InvoiceStatus::Unpaid);

        (new UploadPaymentProof)->handle($invoice, UploadedFile::fake()->image('bukti.png', 100, 200));

        Notification::assertSentTo($adminA, ProofUploadedNotification::class);
        Notification::assertSentTo($adminB, ProofUploadedNotification::class);
        Notification::assertNotSentTo($judge, ProofUploadedNotification::class);
        Notification::assertNotSentTo($other, ProofUploadedNotification::class);
        Notification::assertNotSentTo($owner, ProofUploadedNotification::class);
    }

    public function test_ac_f08_05_driver_log_menulis_pesan_wa_bernomor_62(): void
    {
        $owner = $this->userWithRole(Role::Participant, '0812-3456-7890');
        [$invoice] = $this->invoiceFor($owner);

        $gateway = new class implements WhatsappGateway
        {
            /** @var list<array{0: string, 1: string}> */
            public array $sent = [];

            public function send(string $to, string $message): void
            {
                $this->sent[] = [$to, $message];
            }
        };

        $this->app->instance(WhatsappGateway::class, $gateway);

        (new SendInvoiceCreatedNotification(new WhatsappNotifier($gateway)))->handle(new InvoiceCreated($invoice));

        $this->assertCount(1, $gateway->sent);
        $this->assertSame('6281234567890', $gateway->sent[0][0]);
        $this->assertStringContainsString($invoice->number, $gateway->sent[0][1]);

        // Driver null tidak melakukan apa pun
        $this->app->instance(WhatsappGateway::class, new NullWhatsappGateway);
        (new SendInvoiceCreatedNotification(new WhatsappNotifier(new NullWhatsappGateway)))->handle(new InvoiceCreated($invoice));

        $this->assertCount(1, $gateway->sent);
        $this->assertSame('6281234567890', PhoneNumber::normalize('0812-3456-7890'));
    }

    public function test_ac_f08_05_driver_null_dan_log_dipilih_dari_config(): void
    {
        config(['services.whatsapp.driver' => 'null']);
        $this->assertInstanceOf(NullWhatsappGateway::class, $this->app->make(WhatsappGateway::class));

        $this->app->forgetInstance(WhatsappGateway::class);
        config(['services.whatsapp.driver' => 'log']);
        $this->assertInstanceOf(LogWhatsappGateway::class, $this->app->make(WhatsappGateway::class));
    }

    public function test_ac_f08_06_gateway_melempar_tidak_menggagalkan_verifikasi(): void
    {
        Notification::fake();

        $admin = $this->userWithRole(Role::Admin);
        $owner = $this->userWithRole(Role::Participant);
        [$invoice, $registration] = $this->invoiceFor($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/x.png'])->save();

        $failing = new class implements WhatsappGateway
        {
            public function send(string $to, string $message): void
            {
                throw new RuntimeException('Gateway WA sedang down');
            }
        };

        $this->app->instance(WhatsappGateway::class, $failing);

        $result = (new VerifyInvoice)->handle($admin, $invoice);

        $this->assertSame(InvoiceStatus::Paid, $result->status);
        $this->assertSame(RegistrationStatus::Verified, $registration->fresh()->status);
        Notification::assertSentTo($owner, InvoiceVerifiedNotification::class);
    }

    public function test_ac_f08_06_job_wa_retry_tiga_kali_dan_tercatat_gagal(): void
    {
        $job = new SendWhatsappMessage('081234567890', 'Pesan uji');

        $this->assertSame(3, $job->tries);
        $this->assertSame([10, 60, 300], $job->backoff);

        $failing = new class implements WhatsappGateway
        {
            public function send(string $to, string $message): void
            {
                throw new RuntimeException('gagal');
            }
        };

        $this->expectException(RuntimeException::class);
        $job->handle($failing);
    }

    public function test_ac_f08_07_semua_notifikasi_berantrean(): void
    {
        $classes = [
            InvoiceCreatedNotification::class,
            ProofUploadedNotification::class,
            InvoiceVerifiedNotification::class,
            InvoiceRejectedNotification::class,
            InvoiceExpiredNotification::class,
            ResultsPublishedNotification::class,
            CertificateReadyNotification::class,
        ];

        foreach ($classes as $class) {
            $this->assertTrue(
                is_subclass_of($class, ShouldQueue::class),
                $class.' harus ShouldQueue (AC-F08-07).',
            );
        }

        $listeners = [
            SendInvoiceCreatedNotification::class,
            NotifyAdminsProofUploaded::class,
            SendInvoiceVerifiedNotification::class,
            SendInvoiceRejectedNotification::class,
            SendInvoiceExpiredNotification::class,
        ];

        foreach ($listeners as $listener) {
            $this->assertTrue(
                is_subclass_of($listener, ShouldQueue::class),
                $listener.' harus listener berantrean.',
            );
        }
    }

    public function test_ac_f08_01_expire_mengirim_notifikasi_per_tagihan(): void
    {
        Notification::fake();

        $owner = $this->userWithRole(Role::Participant);
        [$invoice] = $this->invoiceFor($owner, InvoiceStatus::Unpaid);
        $invoice->forceFill(['due_at' => now('Asia/Jakarta')->subHours(2)])->save();

        (new ExpireOverdueInvoices)->handle();

        Notification::assertSentTo($owner, InvoiceExpiredNotification::class);
    }

    public function test_ac_f08_03_tolak_invoice_mengirim_notifikasi_beralasan(): void
    {
        Notification::fake();

        $admin = $this->userWithRole(Role::Admin);
        $owner = $this->userWithRole(Role::Participant);
        [$invoice] = $this->invoiceFor($owner, InvoiceStatus::AwaitingVerification);
        $invoice->forceFill(['proof_path' => 'invoices/y.png'])->save();

        (new RejectInvoice)->handle($admin, $invoice, 'Nominal transfer kurang');

        Notification::assertSentTo(
            $owner,
            InvoiceRejectedNotification::class,
            fn (InvoiceRejectedNotification $notification) => $notification->reason === 'Nominal transfer kurang',
        );
    }
}
