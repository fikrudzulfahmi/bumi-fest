import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

interface Competition {
    id: number;
    name: string;
    level_label: string;
    category_label: string;
    status: string;
    status_label: string;
    fee: number;
    opens_at: string;
    closes_at: string;
}

interface Props {
    competition: Competition;
}

export default function Show({ competition }: Props) {
    const act = (action: string, label: string, method: 'post' | 'delete' = 'post') => {
        if (!confirm(`${label} lomba ini?`)) return;

        if (method === 'delete') {
            router.delete(route(`admin.competitions.${action}`, competition.id));
        } else {
            router.post(route(`admin.competitions.${action}`, competition.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">{competition.name}</h1>}>
            <Head title={competition.name} />

            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {competition.status === 'draft' && (
                            <PrimaryButton onClick={() => act('publish', 'Publikasikan')}>Publikasikan</PrimaryButton>
                        )}
                        {competition.status === 'published' && (
                            <SecondaryButton onClick={() => act('archive', 'Arsipkan')}>Arsipkan</SecondaryButton>
                        )}
                        <SecondaryButton onClick={() => act('duplicate', 'Duplikasi')}>Duplikasi</SecondaryButton>
                        <Link href={route('admin.competitions.edit', competition.id)}>
                            <SecondaryButton>Edit</SecondaryButton>
                        </Link>
                        <DangerButton onClick={() => act('destroy', 'Hapus', 'delete')}>Hapus</DangerButton>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Jenjang</p>
                            <p className="font-medium">{competition.level_label}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Kategori</p>
                            <p className="font-medium">{competition.category_label}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className="font-medium">{competition.status_label}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Biaya</p>
                            <p className="font-medium">Rp {competition.fee.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Dibuka</p>
                            <p className="font-medium">{new Date(competition.opens_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ditutup</p>
                            <p className="font-medium">{new Date(competition.closes_at).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
