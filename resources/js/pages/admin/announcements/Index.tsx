import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';

interface Announcement {
    id: number;
    level: string | null;
    title: string;
    body: string;
    published_at: string | null;
}

interface Props {
    announcements: {
        data: Announcement[];
        meta: { total: number };
    };
}

const LEVEL_LABELS: Record<string, string> = {
    sd_mi: 'SD/MI',
    smp_mts: 'SMP/MTs',
};

export default function Index({ announcements }: Props) {
    const publish = (id: number, unpublish = false) => {
        if (unpublish) {
            router.post(route('admin.announcements.unpublish', id));
        } else {
            router.post(route('admin.announcements.publish', id));
        }
    };

    const remove = (id: number) => {
        if (confirm('Hapus pengumuman ini?')) {
            router.delete(route('admin.announcements.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Kelola Pengumuman</h1>}>
            <Head title="Kelola Pengumuman" />

            <div className="max-w-5xl mx-auto p-4">
                <div className="mb-6">
                    <Link href={route('admin.announcements.create')}>
                        <PrimaryButton>Tambah Pengumuman</PrimaryButton>
                    </Link>
                </div>

                <div className="space-y-3">
                    {announcements.data?.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded p-4">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{item.title}</span>
                                <span className="text-sm text-gray-500">
                                    {item.level ? LEVEL_LABELS[item.level] : 'Umum'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${item.published_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {item.published_at ? 'Terbit' : 'Draf'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                            <div className="flex gap-2 mt-3">
                                {item.published_at ? (
                                    <button onClick={() => publish(item.id, true)} className="text-sm text-gray-600 hover:underline">Tarik</button>
                                ) : (
                                    <button onClick={() => publish(item.id)} className="text-sm text-blue-600 hover:underline">Terbitkan</button>
                                )}
                                <Link href={route('admin.announcements.edit', item.id)}>
                                    <span className="text-sm text-blue-600 hover:underline">Edit</span>
                                </Link>
                                <button onClick={() => remove(item.id)} className="text-sm text-red-600 hover:underline">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
