import { Head, Link, router } from '@inertiajs/react';
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

interface Props {
    registration: Registration;
    competition: Competition;
    participants: Participant[];
    level: string;
}

export default function Edit({ registration, competition, participants, level }: Props) {
    const isLocked = registration.status === 'awaiting_verification' || registration.status === 'verified';

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
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                            {competition.required_documents.map((d) => <li key={d}>{d}</li>)}
                        </ul>
                        <p className="text-xs text-gray-400 mt-2">Unggah dokumen dilakukan di F07 (bukti & dokumen).</p>
                    </div>
                ) : null}

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
