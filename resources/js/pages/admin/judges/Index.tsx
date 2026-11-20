import ConfirmDialog from '@/Components/app/ConfirmDialog';
import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Modal from '@/Components/app/Modal';
import Pagination from '@/Components/app/Pagination';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Gavel, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Assignment {
    id: number;
    competition: { id: number; name: string; level: string; level_label: string | null };
}

interface Judge {
    id: number;
    name: string;
    email: string;
    whatsapp: string | null;
    role: string;
    role_label: string;
    is_active: boolean;
    assignments?: Assignment[];
}

interface Paginated {
    data: Judge[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
    per_page?: number;
}

interface Competition {
    id: number;
    name: string;
    level: string;
    level_label: string | null;
    slug: string;
}

interface Props {
    judges: Paginated;
    filters: { q: string };
    competitions: Competition[];
}

export default function Index({ judges, filters, competitions }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [assignTarget, setAssignTarget] = useState<Judge | null>(null);
    const [assignCompetition, setAssignCompetition] = useState('');
    const [busy, setBusy] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<{ judge: Judge; assignment: Assignment } | null>(null);

    const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });

    const applySearch = () => {
        router.get(route('admin.judges.index'), { q: search }, { preserveState: true, replace: true });
    };

    const createJudge = (event: FormEvent) => {
        event.preventDefault();
        setCreating(true);
        router.post(route('admin.judges.store'), form, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                setForm({ name: '', email: '', whatsapp: '' });
                setErrors({});
            },
            onError: (validationErrors) => setErrors(validationErrors),
            onFinish: () => setCreating(false),
        });
    };

    const assign = () => {
        if (!assignTarget || assignCompetition === '') return;

        setBusy(true);
        router.post(
            route('admin.judges.assign', assignTarget.id),
            { competition_id: Number(assignCompetition) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignTarget(null);
                    setAssignCompetition('');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const unassign = () => {
        if (!removeTarget) return;

        setBusy(true);
        router.delete(route('admin.judges.unassign', removeTarget.assignment.id), {
            preserveScroll: true,
            onSuccess: () => setRemoveTarget(null),
            onFinish: () => setBusy(false),
        });
    };

    const rows = judges.data;
    const searching = (filters.q ?? '').trim() !== '';

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Juri &amp; Penugasan</h1>
                </div>
            }
        >
            <Head title="Juri" />

            <FlashMessage />

            <form
                className="panel"
                onSubmit={(event) => {
                    event.preventDefault();
                    applySearch();
                }}
            >
                <div className="row-gap" style={{ alignItems: 'flex-end', gap: 14 }}>
                    <div style={{ flex: '1 1 260px' }}>
                        <Field label="Cari juri" htmlFor="judge-q" hint="Berdasarkan nama atau email">
                            <input
                                id="judge-q"
                                type="search"
                                className="input"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="nama atau email"
                            />
                        </Field>
                    </div>
                    <div className="row-gap" style={{ gap: 10, paddingBottom: 16 }}>
                        <button type="submit" className="btn btn--ghost">
                            <Search size={16} aria-hidden />
                            Cari
                        </button>
                        <button type="button" className="btn btn--clay" onClick={() => setCreateOpen(true)}>
                            <Plus size={18} aria-hidden />
                            Tambah juri
                        </button>
                    </div>
                </div>
            </form>

            <div className="row-between">
                <p className="muted small">
                    {judges.total} akun juri terdaftar
                    {searching ? ` · filter “${filters.q}”` : ''}
                </p>
                <Link href={route('admin.competitions.index')} className="btn btn--ghost btn--sm">
                    <Gavel size={16} aria-hidden />
                    Atur rubrik per lomba
                </Link>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    title={searching ? 'Juri tidak ditemukan' : 'Belum ada akun juri'}
                    description={
                        searching
                            ? 'Ubah kata kunci pencarian atau tampilkan seluruh daftar juri.'
                            : 'Buat akun juri pertama, lalu tugaskan ke cabang lomba yang dinilai.'
                    }
                    action={
                        searching ? (
                            <button
                                type="button"
                                className="btn btn--sm"
                                onClick={() => {
                                    setSearch('');
                                    router.get(route('admin.judges.index'), { q: '' }, { preserveState: true, replace: true });
                                }}
                            >
                                Tampilkan semua juri
                            </button>
                        ) : (
                            <button type="button" className="btn btn--sm" onClick={() => setCreateOpen(true)}>
                                <UserPlus size={16} aria-hidden />
                                Tambah juri
                            </button>
                        )
                    }
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kontak</th>
                                <th>Lomba ditugaskan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((judge) => (
                                <tr key={judge.id}>
                                    <td data-label="Nama" className="strong">
                                        {judge.name}
                                    </td>
                                    <td data-label="Kontak" className="small muted">
                                        <p>{judge.email}</p>
                                        <p>{judge.whatsapp ?? '—'}</p>
                                    </td>
                                    <td data-label="Lomba ditugaskan">
                                        {judge.assignments && judge.assignments.length > 0 ? (
                                            <ul
                                                className="stack-sm"
                                                style={{ gap: 8, listStyle: 'none', padding: 0, margin: 0, flex: '1 1 auto' }}
                                            >
                                                {judge.assignments.map((assignment) => (
                                                    <li key={assignment.id} className="row-gap" style={{ gap: 8 }}>
                                                        <span className="small strong">{assignment.competition.name}</span>
                                                        {assignment.competition.level_label && (
                                                            <span className="pill">{assignment.competition.level_label}</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn--ghost btn--sm"
                                                            onClick={() => setRemoveTarget({ judge, assignment })}
                                                            aria-label={`Hapus penugasan ${judge.name} pada ${assignment.competition.name}`}
                                                        >
                                                            <Trash2 size={14} aria-hidden />
                                                            Hapus
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="small muted">Belum ada lomba</span>
                                        )}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge value={judge.is_active ? 'active' : 'inactive'} />
                                    </td>
                                    <td data-label="Aksi">
                                        <button
                                            type="button"
                                            className="btn btn--ghost btn--sm"
                                            onClick={() => setAssignTarget(judge)}
                                        >
                                            <UserPlus size={15} aria-hidden />
                                            Tugaskan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination links={judges.links} total={judges.total} perPage={judges.per_page ?? 15} />

            <div className="panel panel--flat">
                <div className="row-gap" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <Gavel size={18} aria-hidden style={{ color: 'var(--clay)', flex: 'none' }} />
                    <p className="small muted" style={{ flex: '1 1 300px' }}>
                        Rubrik penilaian diatur per lomba pada halaman{' '}
                        <Link href={route('admin.competitions.index')} className="strong">
                            Lomba
                        </Link>
                        . Juri masuk lewat tautan atur kata sandi yang dikirim ke emailnya.
                    </p>
                </div>
            </div>

            <Modal show={createOpen} onClose={() => setCreateOpen(false)} title="Tambah akun juri">
                <form onSubmit={createJudge} className="stack">
                    <p className="small muted">Tautan atur kata sandi dikirim ke email juri setelah akun dibuat.</p>

                    <Field label="Nama" htmlFor="judge-name" error={errors.name} required>
                        <input
                            id="judge-name"
                            type="text"
                            className="input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            aria-invalid={Boolean(errors.name)}
                            required
                        />
                    </Field>

                    <Field label="Email" htmlFor="judge-email" error={errors.email} required>
                        <input
                            id="judge-email"
                            type="email"
                            className="input"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            aria-invalid={Boolean(errors.email)}
                            required
                        />
                    </Field>

                    <Field
                        label="WhatsApp"
                        htmlFor="judge-whatsapp"
                        error={errors.whatsapp}
                        hint="Opsional, contoh 08123456789"
                    >
                        <input
                            id="judge-whatsapp"
                            type="tel"
                            className="input"
                            value={form.whatsapp}
                            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                            placeholder="08123456789"
                            aria-invalid={Boolean(errors.whatsapp)}
                        />
                    </Field>

                    <div className="modal__actions" style={{ marginTop: 0 }}>
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => setCreateOpen(false)}
                            disabled={creating}
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn btn--clay" disabled={creating}>
                            {creating ? 'Menyimpan…' : 'Buat akun'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={assignTarget !== null} onClose={() => setAssignTarget(null)} title="Tugaskan juri">
                <div className="stack">
                    <p className="small muted">
                        Pilih lomba untuk <span className="strong">{assignTarget?.name}</span>.
                    </p>

                    <Field label="Lomba" htmlFor="judge-competition" required>
                        <select
                            id="judge-competition"
                            className="select"
                            value={assignCompetition}
                            onChange={(e) => setAssignCompetition(e.target.value)}
                        >
                            <option value="">— pilih lomba —</option>
                            {competitions.map((competition) => (
                                <option key={competition.id} value={competition.id}>
                                    {competition.name} ({competition.level_label})
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="modal__actions" style={{ marginTop: 0 }}>
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => setAssignTarget(null)}
                            disabled={busy}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn btn--clay"
                            onClick={assign}
                            disabled={busy || assignCompetition === ''}
                        >
                            {busy ? 'Memproses…' : 'Tugaskan'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                show={removeTarget !== null}
                title="Hapus penugasan?"
                message={
                    <p className="small">
                        <span className="strong">{removeTarget?.judge.name}</span> akan dilepas dari lomba{' '}
                        <span className="strong">{removeTarget?.assignment.competition.name}</span>. Penugasan yang sudah
                        punya lembar nilai tidak dapat dihapus.
                    </p>
                }
                confirmLabel="Ya, hapus penugasan"
                danger
                processing={busy}
                onConfirm={unassign}
                onCancel={() => setRemoveTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
