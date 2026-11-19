import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    competition_name: string;
    fee: number;
    team_name: string | null;
    member_names: string[];
}

interface Props {
    registrations: Registration[];
    schoolParticipants: number;
}

export default function SchoolDashboard({ registrations, schoolParticipants }: Props) {
    const totalFee = registrations.reduce((sum, r) => sum + (r.fee ?? 0), 0);

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Dasbor Sekolah</h1>}>
            <Head title="Dasbor Sekolah" />

            <div className="max-w-5xl mx-auto p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs text-gray-500">Entri terdaftar</p>
                        <p className="text-2xl font-semibold">{registrations.length}</p>
                    </div>
                    <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs text-gray-500">Siswa terdata</p>
                        <p className="text-2xl font-semibold">{schoolParticipants}</p>
                    </div>
                    <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs text-gray-500">Total biaya entri</p>
                        <p className="text-2xl font-semibold">Rp {totalFee.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                {registrations.length === 0 ? (
                    <p className="text-gray-500">Belum ada entri. Mulai dari halaman lomba di portal.</p>
                ) : (
                    <div className="space-y-3">
                        {registrations.map((reg) => (
                            <div key={reg.id} className="border border-gray-200 rounded p-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-medium">{reg.competition_name}</span>
                                    {reg.team_name && (
                                        <span className="text-gray-600">({reg.team_name})</span>
                                    )}
                                    <span className="text-sm text-gray-500">{reg.code}</span>
                                    <span className="text-sm text-gray-500">
                                        Rp {reg.fee.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-sm px-2 py-0.5 rounded bg-gray-100">
                                        {reg.status_label}
                                    </span>
                                </div>

                                {reg.member_names.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Anggota: {reg.member_names.join(', ')}
                                    </p>
                                )}

                                <div className="mt-3">
                                    <Link
                                        href={route('registrations.edit', reg.id)}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Detail
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
