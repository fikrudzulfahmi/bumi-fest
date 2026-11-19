import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    fee: number;
    team_name: string | null;
    competition_name: string;
    level: string;
    slug: string;
}

interface Props {
    registrations: Registration[];
}

export default function Index({ registrations }: Props) {
    const cancel = (id: number) => {
        if (confirm('Batalkan pendaftaran ini?')) {
            router.post(route('registrations.cancel', id));
        }
    };

    const cancellable = ['draft', 'awaiting_payment', 'rejected'];

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Pendaftaran Saya</h1>}>
            <Head title="Pendaftaran Saya" />

            <div className="max-w-5xl mx-auto p-4 space-y-3">
                {registrations.length === 0 && (
                    <p className="text-gray-500">Belum ada pendaftaran.</p>
                )}

                {registrations.map((reg) => (
                    <div key={reg.id} className="border border-gray-200 rounded p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium">{reg.competition_name}</span>
                            {reg.team_name && <span className="text-gray-600">({reg.team_name})</span>}
                            <span className="text-sm text-gray-500">{reg.code}</span>
                            <span className="text-sm text-gray-500">Rp {reg.fee.toLocaleString('id-ID')}</span>
                            <span className="text-sm px-2 py-0.5 rounded bg-gray-100">{reg.status_label}</span>
                        </div>
                        <div className="flex gap-3 mt-3">
                            <Link href={route('registrations.edit', reg.id)} className="text-blue-600 hover:underline text-sm">
                                Detail
                            </Link>
                            {cancellable.includes(reg.status) && (
                                <button onClick={() => cancel(reg.id)} className="text-red-600 hover:underline text-sm">
                                    Batalkan
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
