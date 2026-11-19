import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Registration {
    id: number;
    code: string;
    status: string;
    team_name: string | null;
    submission_url: string | null;
    submission_name: string | null;
    requirements_accepted_at: string | null;
    consented_at: string | null;
}

interface Competition {
    id: number;
    slug: string;
    name: string;
    category: string;
    team_min: number | null;
    team_max: number | null;
    required_documents: string[] | null;
    submission_mode: string;
}

interface Participant {
    id: number;
    name: string;
    grade: number;
    school_name: string;
}

interface Member {
    id: number;
    name: string;
    grade: number;
    school_name: string;
    uploaded_documents: string[];
}

interface Props {
    registration: Registration;
    competition: Competition;
    participants: Participant[];
    members: Member[];
    level: string;
}

export default function Edit({ registration, competition, participants, members, level }: Props) {
    const isLocked = registration.status === 'awaiting_verification' || registration.status === 'verified';
    const [memberForDoc, setMemberForDoc] = useState(0);
    const [docType, setDocType] = useState('');

    const uploadDocument = async (memberId: number, file: File) => {
        const data = new FormData();
        data.append('participant_id', String(memberId));
        data.append('document_type', docType);
        data.append('file', file);

        await router.post(route('registrations.upload-document', registration.id), data, {
            headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
            preserveScroll: true,
        });
    };

    const swap = async (outId: number, inId: number) => {
        if (!confirm('Ganti anggota ini?')) return;
        await router.post(
            route('registrations.swap-member', registration.id),
            { out_participant_id: outId, in_participant_id: inId },
            { preserveScroll: true }
        );
    };

    const activeMember = members.find((m) => m.id === memberForDoc) ?? members[0];

    const submit = () => {
        if (confirm('Kirim pendaftaran? Slot akan ditahan dan tagihan dibuat.')) {
            router.post(route('registrations.submit', { level, competition: competition.slug, registration: registration.id }));
        }
    };

    const cancel = () => {
        if (confirm('Batalkan pendaftaran ini?')) {
            router.post(route('registrations.cancel', registration.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Pendaftaran: {competition.name}</h1>}>
            <Head title="Detail Pendaftaran" />

            <div className="max-w-3xl mx-auto p-4 space-y-4">
                <div className="border border-gray-200 rounded p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Kode Registrasi</p>
                        <p className="font-mono">{registration.code || '(belum dibuat)'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p>{registration.status}</p>
                    </div>
                    {registration.team_name && (
                        <div>
                            <p className="text-xs text-gray-500">Nama Tim</p>
                            <p>{registration.team_name}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-gray-500">Persetujuan</p>
                        <p>{registration.consented_at ? '✓ Disetujui' : 'Belum disetujui'}</p>
                    </div>
                </div>

                <div className="border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-500 mb-2">Siswa yang ikut</p>
                    <ul className="list-disc pl-5 text-sm">
                        {participants.map((p) => (
                            <li key={p.id}>{p.name} — Kelas {p.grade}, {p.school_name}</li>
                        ))}
                    </ul>
                </div>

                {competition.required_documents?.length ? (
                    <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs text-gray-500 mb-2">Dokumen wajib</p>
                        <ul className="list-disc pl-5 text-sm text-gray-600 mb-3">
                            {competition.required_documents.map((d) => <li key={d}>{d}</li>)}
                        </ul>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium block mb-1">Siswa</label>
                                <select
                                    value={activeMember?.id ?? 0}
                                    onChange={(e) => setMemberForDoc(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-3 py-2 w-full min-h-[44px]"
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name} — Kelas {m.grade}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Jenis dokumen</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 w-full min-h-[44px]"
                                >
                                    <option value="">Pilih dokumen</option>
                                    {competition.required_documents.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f && activeMember) uploadDocument(activeMember.id, f);
                                    }}
                                    className="text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">jpg/png/pdf, maksimal 5 MB.</p>
                                {activeMember?.uploaded_documents.length ? (
                                    <p className="text-xs text-green-600 mt-1">
                                        Terunggah: {activeMember.uploaded_documents.join(', ')}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                {members.length > 0 && !isLocked && (
                    <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs text-gray-500 mb-2">Ganti anggota (swap)</p>
                        <div className="flex items-center gap-2 text-sm">
                            <select
                                id="swap-out"
                                defaultValue={members[0]?.id ?? 0}
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name} (keluar)</option>
                                ))}
                            </select>
                            <span>→</span>
                            <select
                                id="swap-in"
                                defaultValue=""
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="">Pilih pengganti…</option>
                                {participants
                                    .filter((p) => !members.some((m) => m.id === p.id))
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                            </select>
                            <button
                                onClick={() => {
                                    const out = Number((document.getElementById('swap-out') as HTMLSelectElement)?.value ?? 0);
                                    const inId = Number((document.getElementById('swap-in') as HTMLSelectElement)?.value ?? 0);
                                    if (out && inId) swap(out, inId);
                                }}
                                className="text-blue-600 hover:underline"
                            >
                                Ganti
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Biaya tidak berubah saat mengganti anggota.</p>
                    </div>
                )}

                <div className="flex gap-3 flex-wrap">
                    {!isLocked && registration.status === 'draft' && (
                        <PrimaryButton onClick={submit}>Kirim Pendaftaran</PrimaryButton>
                    )}
                    {!isLocked && ['awaiting_payment', 'rejected'].includes(registration.status) && (
                        <SecondaryButton onClick={cancel}>Batalkan</SecondaryButton>
                    )}
                    <Link href={route('registrations.index')}>
                        <SecondaryButton>Kembali ke Daftar</SecondaryButton>
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
