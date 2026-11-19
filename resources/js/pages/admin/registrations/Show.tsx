import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Member {
    id: number;
    position: number;
    participant: {
        id: number;
        name: string;
        grade: number | null;
        level: string | null;
        school_name: string | null;
        school_city: string | null;
    } | null;
}

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    status_color: string;
    team_name: string | null;
    fee: number;
    placement: string | null;
    final_score: number | null;
    submitted_at: string | null;
    competition?: { id: number; name: string; level: string };
    owner?: { id: number; name: string; email: string; whatsapp: string | null };
    invoice: { id: number; number: string; status: string; status_label: string; total: number; due_at: string | null } | null;
    documents?: Array<{ id: number; type: string; type_label: string; original_name: string; size: number }>;
    members?: Member[];
}

interface Props {
    registration: Registration;
}

const badge: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600 ring-gray-200',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Show({ registration }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const [editing, setEditing] = useState<Member | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const openEdit = (member: Member) => {
        setEditing(member);
        setName(member.participant?.name ?? '');
        setLocalError(null);
    };

    const submitName = () => {
        if (!editing?.participant) return;

        if (name.trim().length < 3) {
            setLocalError('Nama siswa minimal 3 karakter.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.patch(
            route('admin.participants.correct-name', editing.participant.id),
            { name: name.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Detail Pendaftaran</h1>}>
            <Head title={`Entri ${registration.code}`} />

            <div className="mx-auto max-w-5xl space-y-4 p-4">
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

                <div className="rounded border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="font-mono text-xs text-gray-500">{registration.code}</p>
                            <h2 className="text-lg font-semibold">{registration.competition?.name ?? '—'}</h2>
                            <p className="text-sm uppercase text-gray-500">{registration.competition?.level}</p>
                            {registration.team_name && (
                                <p className="mt-1 text-sm text-gray-700">Tim: {registration.team_name}</p>
                            )}
                        </div>
                        <span
                            className={`inline-flex rounded px-2 py-1 text-xs ring-1 ${
                                badge[registration.status_color] ?? badge.gray
                            }`}
                        >
                            {registration.status_label}
                        </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-gray-500">Pemilik akun</dt>
                            <dd>{registration.owner?.name ?? '—'}</dd>
                            <dd className="text-xs text-gray-500">{registration.owner?.email}</dd>
                            {registration.owner?.whatsapp && (
                                <dd className="text-xs text-gray-500">{registration.owner.whatsapp}</dd>
                            )}
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Biaya</dt>
                            <dd>{formatRupiah(registration.fee)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Dikirim</dt>
                            <dd>{registration.submitted_at ? formatTanggalWaktu(registration.submitted_at) : '—'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold">Siswa terdaftar</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {(registration.members ?? []).length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">Belum ada siswa.</li>
                        )}
                        {(registration.members ?? []).map((member) => (
                            <li key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <div>
                                    <p className="font-medium">
                                        {member.participant?.name ?? '—'}
                                        <span className="ml-2 text-xs text-gray-400">#{member.position}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Kelas {member.participant?.grade ?? '—'} · {member.participant?.school_name ?? '—'}
                                    </p>
                                </div>
                                {member.participant && (
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 hover:underline"
                                        onClick={() => openEdit(member)}
                                    >
                                        Koreksi nama
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold">Dokumen</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {(registration.documents ?? []).length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">Belum ada dokumen.</li>
                        )}
                        {(registration.documents ?? []).map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                <span>{doc.type_label}</span>
                                <span className="text-xs text-gray-500">{doc.original_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded border border-gray-200 bg-white p-4">
                    <h3 className="text-sm font-semibold">Tagihan</h3>
                    {registration.invoice ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div>
                                <p className="font-mono text-xs">{registration.invoice.number}</p>
                                <p className="text-xs text-gray-500">{registration.invoice.status_label}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{formatRupiah(registration.invoice.total)}</p>
                                <Link
                                    href={route('invoices.show', registration.invoice.id)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Lihat tagihan
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">Belum ada tagihan.</p>
                    )}
                </div>

                <Link href={route('admin.registrations.index')} className="text-sm text-blue-600 hover:underline">
                    ← Kembali ke daftar
                </Link>
            </div>

            <Modal show={editing !== null} onClose={() => setEditing(null)} maxWidth="sm">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Koreksi nama siswa</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Perubahan dicatat sebagai koreksi admin. Gunakan hanya untuk perbaikan ejaan.
                    </p>

                    <label className="mt-4 block text-sm">
                        <span className="block text-xs text-gray-500">Nama siswa</span>
                        <input
                            className="mt-1 w-full rounded border-gray-300 text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>

                    {localError && <p className="mt-2 text-xs text-red-600">{localError}</p>}

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setEditing(null)} disabled={busy}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={submitName} disabled={busy}>
                            {busy ? 'Menyimpan…' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
