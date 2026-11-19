import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Link, router, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    status_color: string;
    team_name: string | null;
    fee: number;
    competition?: { id: number; name: string; level: string };
    owner?: { id: number; name: string; email: string; whatsapp: string | null };
    invoice: { id: number; number: string; status: string; status_label: string; total: number } | null;
    members_count?: number;
}

interface Filters {
    level: string;
    status: string;
    competition_id: number | 0;
    institution_id: number | 0;
    q: string;
}

interface Props {
    registrations: Paginated<Registration>;
    filters: Filters;
    levels: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
    competitions: Array<{ id: number; name: string }>;
    institutions: Array<{ id: number; name: string }>;
}

const badge: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600 ring-gray-200',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Index({
    registrations,
    filters,
    levels,
    statuses,
    competitions,
    institutions,
}: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const [form, setForm] = useState<Filters>(filters);
    const [cancelling, setCancelling] = useState<Registration | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const applyFilters = () => {
        router.get(route('admin.registrations.index'), { ...form }, { preserveState: true, replace: true });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== '' && value !== 0 && value !== null) params.set(key, String(value));
        });
        const query = params.toString();

        return route('admin.registrations.export') + (query ? `?${query}` : '');
    };

    const submitCancel = () => {
        if (!cancelling) return;

        if (reason.trim().length < 5) {
            setLocalError('Alasan pembatalan minimal 5 karakter.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.post(
            route('admin.registrations.cancel', cancelling.id),
            { reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCancelling(null);
                    setReason('');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Data Pendaftaran</h1>}>
            <Head title="Data Pendaftaran" />

            <div className="mx-auto max-w-7xl space-y-4 p-4">
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

                <div className="grid gap-2 rounded border border-gray-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Cari</span>
                        <input
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="kode / nama / sekolah"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Jenjang</span>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value })}
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
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.competition_id}
                            onChange={(e) => setForm({ ...form, competition_id: Number(e.target.value) })}
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
                        <span className="block text-xs text-gray-500">Status</span>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="">Semua</option>
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Lembaga</span>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.institution_id}
                            onChange={(e) => setForm({ ...form, institution_id: Number(e.target.value) })}
                        >
                            <option value={0}>Semua</option>
                            {institutions.map((institution) => (
                                <option key={institution.id} value={institution.id}>
                                    {institution.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex items-end gap-2">
                        <PrimaryButton onClick={applyFilters}>Terapkan</PrimaryButton>
                        <a href={exportUrl()}>
                            <SecondaryButton type="button">Ekspor</SecondaryButton>
                        </a>
                    </div>
                </div>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <th className="px-3 py-2">Kode</th>
                                <th className="px-3 py-2">Lomba</th>
                                <th className="px-3 py-2">Pemilik</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Tagihan</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                                        Tidak ada entri yang cocok.
                                    </td>
                                </tr>
                            )}
                            {registrations.data.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                    <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                                    <td className="px-3 py-2">
                                        <p>{item.competition?.name ?? '—'}</p>
                                        <p className="text-xs uppercase text-gray-500">{item.competition?.level}</p>
                                    </td>
                                    <td className="px-3 py-2">
                                        <p>{item.owner?.name ?? '—'}</p>
                                        <p className="text-xs text-gray-500">{item.owner?.email}</p>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex rounded px-2 py-1 text-xs ring-1 ${
                                                badge[item.status_color] ?? badge.gray
                                            }`}
                                        >
                                            {item.status_label}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.invoice ? (
                                            <>
                                                <p className="font-mono text-xs">{item.invoice.number}</p>
                                                <p className="text-xs text-gray-500">{item.invoice.status_label}</p>
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-2 text-xs">
                                            <Link
                                                href={route('admin.registrations.show', item.id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Detail
                                            </Link>
                                            {item.status !== 'cancelled' && (
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:underline"
                                                    onClick={() => setCancelling(item)}
                                                >
                                                    Batalkan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-xs">
                    {registrations.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                className={`rounded border px-2 py-1 ${
                                    link.active
                                        ? 'border-gray-800 bg-gray-800 text-white'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={index}
                                className="rounded border border-gray-100 px-2 py-1 text-gray-300"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                    <span className="ml-2 text-gray-500">{registrations.total} entri</span>
                </div>
            </div>

            <Modal show={cancelling !== null} onClose={() => setCancelling(null)} maxWidth="md">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Batalkan entri</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Entri <span className="font-mono">{cancelling?.code}</span> akan dibatalkan dan slotnya dilepas.
                        Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <label className="mt-4 block text-sm">
                        <span className="block text-xs text-gray-500">Alasan (wajib)</span>
                        <textarea
                            className="mt-1 w-full rounded border-gray-300 text-sm"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </label>

                    {localError && <p className="mt-2 text-xs text-red-600">{localError}</p>}

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setCancelling(null)} disabled={busy}>
                            Batal
                        </SecondaryButton>
                        <DangerButton type="button" onClick={submitCancel} disabled={busy}>
                            {busy ? 'Memproses…' : 'Batalkan entri'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
