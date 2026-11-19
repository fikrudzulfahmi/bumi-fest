import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';

interface Invoice {
    id: number;
    number: string;
    total: number;
    status: string;
    status_label: string;
    status_color: string;
    has_proof: boolean;
    proof_uploaded_at: string | null;
    due_at: string | null;
    is_overdue: boolean;
    rejection_reason: string | null;
    registrations_count?: number;
    owner?: { id: number; name: string; email: string };
}

interface Filters {
    status: string;
    level: string;
    competition_id: number;
    q: string;
}

interface Props {
    invoices: Invoice[];
    filters: Filters;
    levels: { value: string; label: string }[];
    competitions: { id: number; name: string }[];
    counts: { awaiting: number; paid: number; rejected: number };
}

const badge: Record<string, string> = {
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    gray: 'bg-gray-100 text-gray-600 ring-gray-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Index({ invoices, filters, levels, competitions, counts }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const [preview, setPreview] = useState<Invoice | null>(null);
    const [rejecting, setRejecting] = useState<Invoice | null>(null);
    const [extending, setExtending] = useState<Invoice | null>(null);
    const [reason, setReason] = useState('');
    const [hours, setHours] = useState('24');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const [form, setForm] = useState<Filters>(filters);

    const applyFilters = () => {
        router.get(route('admin.payments.index'), { ...form }, { preserveState: true, replace: true });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== '' && value !== 0) params.set(key, String(value));
        });
        const query = params.toString();

        return route('admin.payments.export') + (query ? `?${query}` : '');
    };

    const verify = (invoice: Invoice) => {
        setBusy(true);
        router.post(
            route('admin.payments.verify', invoice.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };

    const submitReject = () => {
        if (!rejecting) return;

        if (reason.trim().length < 5) {
            setLocalError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.post(
            route('admin.payments.reject', rejecting.id),
            { reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejecting(null);
                    setReason('');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const submitExtend = () => {
        if (!extending) return;

        const value = Number(hours);

        if (!Number.isInteger(value) || value < 1 || value > 720) {
            setLocalError('Durasi 1–720 jam.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.post(
            route('admin.payments.extend', extending.id),
            { hours: value },
            {
                preserveScroll: true,
                onSuccess: () => setExtending(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Verifikasi Pembayaran</h1>}>
            <Head title="Verifikasi Pembayaran" />

            <div className="mx-auto max-w-6xl space-y-4 p-4">
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

                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Menunggu verifikasi</p>
                        <p className="text-xl font-semibold">{counts.awaiting}</p>
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Terbayar</p>
                        <p className="text-xl font-semibold">{counts.paid}</p>
                    </div>
                    <div className="rounded border border-gray-200 p-3">
                        <p className="text-xs text-gray-500">Ditolak</p>
                        <p className="text-xl font-semibold">{counts.rejected}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-3">
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Status</span>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="mt-1 rounded border-gray-300 text-sm"
                        >
                            <option value="">Menunggu verifikasi</option>
                            <option value="unpaid">Belum dibayar</option>
                            <option value="awaiting_verification">Menunggu verifikasi</option>
                            <option value="rejected">Ditolak</option>
                            <option value="paid">Terbayar</option>
                            <option value="expired">Kadaluarsa</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Jenjang</span>
                        <select
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value })}
                            className="mt-1 rounded border-gray-300 text-sm"
                        >
                            <option value="">Semua</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Lomba</span>
                        <select
                            value={form.competition_id}
                            onChange={(e) => setForm({ ...form, competition_id: Number(e.target.value) })}
                            className="mt-1 max-w-xs rounded border-gray-300 text-sm"
                        >
                            <option value={0}>Semua</option>
                            {competitions.map((competition) => (
                                <option key={competition.id} value={competition.id}>
                                    {competition.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Cari</span>
                        <input
                            type="text"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="No. tagihan / nama / total"
                            className="mt-1 rounded border-gray-300 text-sm"
                        />
                    </label>

                    <PrimaryButton type="button" onClick={applyFilters}>
                        Terapkan
                    </PrimaryButton>

                    <a href={exportUrl()}>
                        <SecondaryButton type="button">Ekspor</SecondaryButton>
                    </a>
                </div>

                {invoices.length === 0 && (
                    <p className="rounded border border-gray-200 p-6 text-center text-gray-500">
                        Tidak ada tagihan pada antrean ini.
                    </p>
                )}

                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="rounded border border-gray-200 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono text-sm font-medium">{invoice.number}</span>
                                <span
                                    className={`rounded px-2 py-0.5 text-xs ring-1 ${
                                        badge[invoice.status_color] ?? badge.gray
                                    }`}
                                >
                                    {invoice.status_label}
                                </span>
                                <span className="text-sm text-gray-700">{invoice.owner?.name ?? '-'}</span>
                                <span className="text-xs text-gray-500">{invoice.owner?.email}</span>
                                <span className="ml-auto font-semibold">{formatRupiah(invoice.total)}</span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
                                <span>{invoice.registrations_count ?? 0} entri</span>
                                {invoice.proof_uploaded_at && (
                                    <span>Bukti diunggah {formatTanggalWaktu(invoice.proof_uploaded_at)}</span>
                                )}
                                {invoice.due_at && (
                                    <span className={invoice.is_overdue ? 'font-medium text-red-600' : ''}>
                                        Jatuh tempo {formatTanggalWaktu(invoice.due_at)}
                                    </span>
                                )}
                            </div>

                            {invoice.rejection_reason && (
                                <p className="mt-2 text-xs text-orange-800">
                                    Alasan tolak: {invoice.rejection_reason}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                {invoice.has_proof && (
                                    <SecondaryButton type="button" onClick={() => setPreview(invoice)}>
                                        Pratinjau Bukti
                                    </SecondaryButton>
                                )}
                                {invoice.status === 'awaiting_verification' && invoice.has_proof && (
                                    <>
                                        <PrimaryButton
                                            type="button"
                                            disabled={busy}
                                            onClick={() => verify(invoice)}
                                        >
                                            Terima
                                        </PrimaryButton>
                                        <DangerButton
                                            type="button"
                                            disabled={busy}
                                            onClick={() => {
                                                setLocalError(null);
                                                setRejecting(invoice);
                                            }}
                                        >
                                            Tolak
                                        </DangerButton>
                                    </>
                                )}
                                {['unpaid', 'rejected'].includes(invoice.status) && (
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => {
                                            setLocalError(null);
                                            setExtending(invoice);
                                        }}
                                    >
                                        Perpanjang
                                    </SecondaryButton>
                                )}
                                <Link
                                    href={route('invoices.show', invoice.id)}
                                    className="self-center text-sm text-blue-600 hover:underline"
                                >
                                    Detail
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal show={preview !== null} onClose={() => setPreview(null)} maxWidth="2xl">
                <div className="p-4">
                    <h2 className="font-semibold">Bukti {preview?.number}</h2>
                    {preview && (
                        <img
                            src={route('admin.payments.proof', preview.id)}
                            alt={`Bukti ${preview.number}`}
                            className="mt-3 max-h-[70vh] w-full object-contain"
                        />
                    )}
                    {preview && preview.proof_uploaded_at && (
                        <p className="mt-2 text-xs text-gray-500">
                            Diunggah {formatTanggalWaktu(preview.proof_uploaded_at)}
                        </p>
                    )}
                    <div className="mt-3 flex justify-end">
                        <SecondaryButton type="button" onClick={() => setPreview(null)}>
                            Tutup
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={rejecting !== null} onClose={() => setRejecting(null)} maxWidth="md">
                <div className="space-y-3 p-4">
                    <h2 className="font-semibold">Tolak Pembayaran {rejecting?.number}</h2>
                    <p className="text-sm text-gray-600">
                        Pengguna dapat mengunggah ulang bukti setelah penolakan.
                    </p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Alasan penolakan (wajib)"
                        className="w-full rounded border-gray-300 text-sm"
                    />
                    {localError && <p className="text-sm text-red-600">{localError}</p>}
                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setRejecting(null)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton type="button" disabled={busy} onClick={submitReject}>
                            {busy ? 'Memproses...' : 'Tolak'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <Modal show={extending !== null} onClose={() => setExtending(null)} maxWidth="md">
                <div className="space-y-3 p-4">
                    <h2 className="font-semibold">Perpanjang Jatuh Tempo {extending?.number}</h2>
                    <label className="block text-sm">
                        <span className="text-gray-600">Durasi (jam, 1–720)</span>
                        <input
                            type="number"
                            min={1}
                            max={720}
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 text-sm"
                        />
                    </label>
                    {localError && <p className="text-sm text-red-600">{localError}</p>}
                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setExtending(null)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="button" disabled={busy} onClick={submitExtend}>
                            {busy ? 'Memproses...' : 'Perpanjang'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
