import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';

interface Invoice {
    id: number;
    number: string;
    subtotal: number;
    unique_code: number;
    discount: number;
    total: number;
    status: string;
    status_label: string;
    status_color: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
    has_proof: boolean;
    proof_uploaded_at: string | null;
    due_at: string | null;
    is_overdue: boolean;
    rejection_reason: string | null;
    verified_at: string | null;
}

interface Entry {
    id: number;
    code: string;
    team_name: string | null;
    status: string;
    status_label: string;
    fee: number;
    competition_name: string | null;
    level: string | null;
    slug: string | null;
}

interface Props {
    invoice: Invoice;
    entries: Entry[];
    canManage: boolean;
}

const badge: Record<string, string> = {
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    gray: 'bg-gray-100 text-gray-600 ring-gray-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Show({ invoice, entries, canManage }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const fileInput = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const form = useForm<{ proof: File | null }>({ proof: null });
    const uploadable = ['unpaid', 'rejected'].includes(invoice.status);

    const copyTotal = async () => {
        try {
            await navigator.clipboard.writeText(String(invoice.total));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const submitProof = () => {
        if (!form.data.proof) return;

        form.post(route('invoices.upload-proof', invoice.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Tagihan {invoice.number}</h1>}>
            <Head title={`Tagihan ${invoice.number}`} />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                {flash?.success && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="rounded border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`rounded px-2 py-0.5 text-xs ring-1 ${
                                badge[invoice.status_color] ?? badge.gray
                            }`}
                        >
                            {invoice.status_label}
                        </span>
                        {invoice.due_at && (
                            <span
                                className={`text-sm ${
                                    invoice.is_overdue ? 'font-medium text-red-600' : 'text-gray-600'
                                }`}
                            >
                                Jatuh tempo {formatTanggalWaktu(invoice.due_at)}
                            </span>
                        )}
                    </div>

                    <dl className="mt-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Subtotal</dt>
                            <dd>{formatRupiah(invoice.subtotal)}</dd>
                        </div>
                        {invoice.discount > 0 && (
                            <div className="flex justify-between">
                                <dt className="text-gray-600">Potongan</dt>
                                <dd>-{formatRupiah(invoice.discount)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Kode unik</dt>
                            <dd className="font-mono">{invoice.unique_code}</dd>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                            <dt>Total transfer</dt>
                            <dd className="flex items-center gap-2">
                                <span>{formatRupiah(invoice.total)}</span>
                                <button
                                    type="button"
                                    onClick={copyTotal}
                                    className="rounded border border-gray-300 px-2 py-0.5 text-xs font-normal text-gray-700 hover:bg-gray-50"
                                >
                                    {copied ? 'Tersalin' : 'Salin'}
                                </button>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded border border-gray-200 p-4">
                    <h2 className="font-semibold">Rekening Tujuan</h2>
                    <p className="mt-2 text-sm">
                        {invoice.bank_name ?? 'Rekening belum tersedia'} &middot;{' '}
                        <span className="font-mono">{invoice.bank_account_number ?? '-'}</span>
                    </p>
                    <p className="text-sm text-gray-600">a.n. {invoice.bank_account_holder ?? '-'}</p>
                    <p className="mt-2 text-xs text-gray-500">
                        Transfer tepat sampai 3 digit terakhir kode unik agar terverifikasi otomatis.
                    </p>
                </div>

                <div className="rounded border border-gray-200 p-4">
                    <h2 className="font-semibold">Entri Pendaftaran ({entries.length})</h2>
                    <ul className="mt-2 divide-y divide-gray-100 text-sm">
                        {entries.map((entry) => (
                            <li key={entry.id} className="flex flex-wrap items-center gap-2 py-2">
                                <span className="font-mono text-xs text-gray-500">{entry.code}</span>
                                <span>{entry.competition_name ?? '-'}</span>
                                {entry.team_name && <span className="text-gray-600">({entry.team_name})</span>}
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{entry.status_label}</span>
                                <span className="ml-auto">{formatRupiah(entry.fee)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {invoice.rejection_reason && (
                    <div className="rounded border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                        <p className="font-semibold">Bukti sebelumnya ditolak</p>
                        <p className="mt-1">{invoice.rejection_reason}</p>
                    </div>
                )}

                <div className="rounded border border-gray-200 p-4">
                    <h2 className="font-semibold">Bukti Pembayaran</h2>

                    {invoice.has_proof ? (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-700">
                                Terunggah {invoice.proof_uploaded_at ? formatTanggalWaktu(invoice.proof_uploaded_at) : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="text-blue-600 hover:underline"
                            >
                                Lihat bukti
                            </button>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-gray-600">Belum ada bukti terunggah.</p>
                    )}

                    {uploadable && (
                        <div className="mt-3 space-y-2">
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={(event) =>
                                    form.setData('proof', event.target.files?.[0] ?? null)
                                }
                                className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm"
                            />
                            <p className="text-xs text-gray-500">JPG, PNG, atau PDF. Maksimal 5 MB.</p>
                            {form.errors.proof && (
                                <p className="text-sm text-red-600">{form.errors.proof}</p>
                            )}
                            <PrimaryButton
                                type="button"
                                onClick={submitProof}
                                disabled={!form.data.proof || form.processing}
                            >
                                {form.processing ? 'Mengunggah...' : 'Unggah Bukti'}
                            </PrimaryButton>
                        </div>
                    )}

                    {invoice.status === 'awaiting_verification' && (
                        <p className="mt-3 text-sm text-blue-700">Menunggu verifikasi admin.</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Link href={route('invoices.index')} className="text-sm text-blue-600 hover:underline">
                        Kembali ke daftar tagihan
                    </Link>
                    {canManage && (
                        <Link href={route('admin.payments.index')} className="text-sm text-blue-600 hover:underline">
                            Antrean verifikasi
                        </Link>
                    )}
                </div>
            </div>

            <Modal show={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="2xl">
                <div className="p-4">
                    <h2 className="font-semibold">Bukti Pembayaran</h2>
                    <img
                        src={route('invoices.proof', invoice.id)}
                        alt={`Bukti pembayaran ${invoice.number}`}
                        className="mt-3 max-h-[70vh] w-full object-contain"
                    />
                    <div className="mt-3 flex justify-end">
                        <SecondaryButton type="button" onClick={() => setPreviewOpen(false)}>
                            Tutup
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
