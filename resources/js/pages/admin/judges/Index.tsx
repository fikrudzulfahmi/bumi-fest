import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
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

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Juri & Penugasan</h1>}>
            <Head title="Juri" />

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

                <div className="flex flex-wrap items-end justify-between gap-2 rounded border border-gray-200 bg-white p-3">
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="text-sm">
                            <span className="block text-xs text-gray-500">Cari juri</span>
                            <input
                                className="rounded border-gray-300 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                placeholder="nama / email"
                            />
                        </label>
                        <SecondaryButton type="button" onClick={applySearch}>
                            Cari
                        </SecondaryButton>
                    </div>
                    <PrimaryButton type="button" onClick={() => setCreateOpen(true)}>
                        Tambah Juri
                    </PrimaryButton>
                </div>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <th className="px-3 py-2">Nama</th>
                                <th className="px-3 py-2">Kontak</th>
                                <th className="px-3 py-2">Lomba Ditugaskan</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {judges.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                                        Belum ada akun juri.
                                    </td>
                                </tr>
                            )}
                            {judges.data.map((judge) => (
                                <tr key={judge.id} className="border-t border-gray-100 align-top">
                                    <td className="px-3 py-2 font-medium">{judge.name}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">
                                        <p>{judge.email}</p>
                                        <p>{judge.whatsapp ?? '—'}</p>
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                        {judge.assignments && judge.assignments.length > 0 ? (
                                            <ul className="space-y-1">
                                                {judge.assignments.map((assignment) => (
                                                    <li key={assignment.id} className="flex items-center gap-2">
                                                        <span>
                                                            {assignment.competition.name}{' '}
                                                            <span className="text-gray-400">
                                                                ({assignment.competition.level_label})
                                                            </span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-red-600 hover:underline"
                                                            onClick={() => setRemoveTarget({ judge, assignment })}
                                                        >
                                                            hapus
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-400">Belum ada</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`text-xs ${judge.is_active ? 'text-emerald-700' : 'text-red-600'}`}
                                        >
                                            {judge.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="text-xs text-blue-600 hover:underline"
                                            onClick={() => setAssignTarget(judge)}
                                        >
                                            Tugaskan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-xs">
                    {judges.links.map((link, index) =>
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
                    <span className="ml-2 text-gray-500">{judges.total} juri</span>
                </div>

                <p className="text-xs text-gray-500">
                    Rubrik penilaian diatur per lomba pada halaman{' '}
                    <Link href={route('admin.competitions.index')} className="text-blue-600 hover:underline">
                        Lomba
                    </Link>
                    . Juri masuk lewat tautan atur kata sandi yang dikirim ke emailnya.
                </p>
            </div>

            <Modal show={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md">
                <form onSubmit={createJudge} className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold">Tambah akun juri</h2>
                    <p className="text-sm text-gray-600">
                        Tautan atur kata sandi dikirim ke email juri setelah akun dibuat.
                    </p>

                    <label className="block text-sm">
                        <span className="block text-xs text-gray-500">Nama</span>
                        <input
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
                    </label>

                    <label className="block text-sm">
                        <span className="block text-xs text-gray-500">Email</span>
                        <input
                            type="email"
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                        {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
                    </label>

                    <label className="block text-sm">
                        <span className="block text-xs text-gray-500">WhatsApp (opsional)</span>
                        <input
                            className="w-full rounded border-gray-300 text-sm"
                            value={form.whatsapp}
                            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                            placeholder="08123456789"
                        />
                        {errors.whatsapp && <span className="text-xs text-red-600">{errors.whatsapp}</span>}
                    </label>

                    <div className="flex justify-end gap-2 pt-1">
                        <SecondaryButton type="button" onClick={() => setCreateOpen(false)} disabled={creating}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={creating}>
                            {creating ? 'Menyimpan…' : 'Buat akun'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={assignTarget !== null} onClose={() => setAssignTarget(null)} maxWidth="md">
                <div className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold">Tugaskan juri</h2>
                    <p className="text-sm text-gray-600">
                        Pilih lomba untuk <strong>{assignTarget?.name}</strong>.
                    </p>

                    <label className="block text-sm">
                        <span className="block text-xs text-gray-500">Lomba</span>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
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
                    </label>

                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setAssignTarget(null)} disabled={busy}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="button"
                            onClick={assign}
                            disabled={busy || assignCompetition === ''}
                        >
                            {busy ? 'Memproses…' : 'Tugaskan'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={removeTarget !== null} onClose={() => setRemoveTarget(null)} maxWidth="sm">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Hapus penugasan</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {removeTarget?.judge.name} akan dilepas dari lomba{' '}
                        {removeTarget?.assignment.competition.name}. Penugasan yang sudah punya lembar nilai
                        tidak dapat dihapus.
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setRemoveTarget(null)} disabled={busy}>
                            Batal
                        </SecondaryButton>
                        <DangerButton type="button" onClick={unassign} disabled={busy}>
                            {busy ? 'Memproses…' : 'Hapus'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
