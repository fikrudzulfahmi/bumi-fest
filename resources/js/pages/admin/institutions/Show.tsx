import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Participant {
    id: number;
    name: string;
    grade: number | null;
    level: string | null;
    school_name: string | null;
}

interface Institution {
    id: number;
    name: string;
    npsn: string | null;
    city: string | null;
    user: { id: number; name: string; email: string; whatsapp: string | null; is_active: boolean } | null;
    participants_count: number;
}

interface Props {
    institution: Institution;
    participants: Participant[];
}

export default function Show({ institution, participants }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Detail Lembaga</h1>}>
            <Head title={institution.name} />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                <div className="rounded border border-gray-200 bg-white p-4">
                    <h2 className="text-lg font-semibold">{institution.name}</h2>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-gray-500">NPSN</dt>
                            <dd>{institution.npsn ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Kota</dt>
                            <dd>{institution.city ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Akun</dt>
                            <dd>{institution.user?.name ?? '—'}</dd>
                            <dd className="text-xs text-gray-500">{institution.user?.email}</dd>
                            <dd className="text-xs text-gray-500">{institution.user?.whatsapp ?? '—'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold">Siswa ({institution.participants_count})</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {participants.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">Belum ada siswa terdaftar.</li>
                        )}
                        {participants.map((participant) => (
                            <li key={participant.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                <span>{participant.name}</span>
                                <span className="text-xs text-gray-500">
                                    Kelas {participant.grade ?? '—'} · {participant.school_name ?? '—'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <Link href={route('admin.institutions.index')} className="text-sm text-blue-600 hover:underline">
                    ← Kembali ke daftar
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
