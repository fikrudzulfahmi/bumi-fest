import ConfirmDialog from '@/Components/app/ConfirmDialog';
import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Pagination from '@/Components/app/Pagination';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, SlidersHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
}

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    status_color: string;
    team_name: string | null;
    fee: number;
    competition?: { id: number; name: string; level: string; level_label?: string | null };
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

export default function Index({ registrations, filters, levels, statuses, competitions, institutions }: Props) {
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
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Data Pendaftaran</h1>
                </div>
            }
        >
            <Head title="Data Pendaftaran" />

            <FlashMessage />

            <section className="panel panel--flat">
                <div className="panel__head" style={{ marginBottom: 14 }}>
                    <div>
                        <span className="kicker">Saringan data</span>
                        <h3>Saring pendaftaran</h3>
                    </div>
                    <div className="row-gap">
                        <button type="button" className="btn btn--clay btn--sm" onClick={applyFilters}>
                            <SlidersHorizontal size={16} aria-hidden />
                            Terapkan
                        </button>
                        <a href={exportUrl()} className="btn btn--ghost btn--sm">
                            <Download size={16} aria-hidden />
                            Ekspor
                        </a>
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12,
                    }}
                >
                    <Field label="Cari" htmlFor="filter-q">
                        <input
                            id="filter-q"
                            className="input"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="kode / nama / sekolah"
                        />
                    </Field>

                    <Field label="Jenjang" htmlFor="filter-level">
                        <select
                            id="filter-level"
                            className="select"
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
                    </Field>

                    <Field label="Lomba" htmlFor="filter-competition">
                        <select
                            id="filter-competition"
                            className="select"
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
                    </Field>

                    <Field label="Status" htmlFor="filter-status">
                        <select
                            id="filter-status"
                            className="select"
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
                    </Field>

                    <Field label="Lembaga" htmlFor="filter-institution">
                        <select
                            id="filter-institution"
                            className="select"
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
                    </Field>
                </div>
            </section>

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {registrations.total} entri ditemukan.
                </p>
            </div>

            {registrations.data.length === 0 ? (
                <EmptyState
                    title="Tidak ada entri yang cocok"
                    description="Ubah kata kunci atau saringan di atas untuk melihat pendaftaran lain."
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Lomba</th>
                                <th>Pemilik</th>
                                <th>Status</th>
                                <th>Tagihan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.data.map((item) => (
                                <tr key={item.id}>
                                    <td data-label="Kode" className="nowrap">
                                        <span className="tnum small strong">{item.code}</span>
                                    </td>
                                    <td data-label="Lomba">
                                        <span className="strong">{item.competition?.name ?? '—'}</span>
                                        <span className="small muted" style={{ display: 'block' }}>
                                            {item.competition?.level_label ?? item.competition?.level}
                                            {typeof item.members_count === 'number' ? ` · ${item.members_count} siswa` : ''}
                                        </span>
                                    </td>
                                    <td data-label="Pemilik">
                                        <span>{item.owner?.name ?? '—'}</span>
                                        <span className="small muted" style={{ display: 'block' }}>
                                            {item.owner?.email ?? '—'}
                                        </span>
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge value={item.status} label={item.status_label} />
                                    </td>
                                    <td data-label="Tagihan">
                                        {item.invoice ? (
                                            <>
                                                <span className="tnum small">{item.invoice.number}</span>
                                                <span className="small muted" style={{ display: 'block' }}>
                                                    {item.invoice.status_label}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="small muted">—</span>
                                        )}
                                    </td>
                                    <td data-label="Aksi">
                                        <div className="row-gap" style={{ gap: 8 }}>
                                            <Link
                                                href={route('admin.registrations.show', item.id)}
                                                className="btn btn--ghost btn--sm"
                                            >
                                                <Eye size={15} aria-hidden />
                                                Detail
                                            </Link>
                                            {item.status !== 'cancelled' && (
                                                <button
                                                    type="button"
                                                    className="btn btn--danger btn--sm"
                                                    onClick={() => {
                                                        setLocalError(null);
                                                        setCancelling(item);
                                                    }}
                                                >
                                                    <XCircle size={15} aria-hidden />
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
            )}

            <Pagination
                links={registrations.links}
                total={registrations.total}
                perPage={registrations.per_page}
            />

            <ConfirmDialog
                show={cancelling !== null}
                title="Batalkan entri pendaftaran?"
                message={
                    <div className="stack-sm">
                        <p>
                            Entri <span className="strong tnum">{cancelling?.code}</span> akan dibatalkan dan slotnya
                            dilepas. Tindakan ini tidak dapat diurungkan.
                        </p>
                        <Field
                            label="Alasan pembatalan"
                            htmlFor="cancel-reason"
                            error={localError ?? undefined}
                            hint="Minimal 5 karakter, tercatat pada riwayat."
                            required
                        >
                            <textarea
                                id="cancel-reason"
                                className="textarea"
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </Field>
                    </div>
                }
                confirmLabel="Ya, batalkan entri"
                cancelLabel="Tidak jadi"
                danger
                processing={busy}
                onConfirm={submitCancel}
                onCancel={() => {
                    setCancelling(null);
                    setLocalError(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
