import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';

interface Competition {
    id: number;
    name: string;
    slug: string;
    level: string;
    level_label: string;
    status: string;
    status_label: string;
}

interface Props {
    competitions: {
        data: Competition[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
        };
    };
    filters: Record<string, string | null>;
    levels: Array<{ value: string; label: string }>;
}

export default function Index({ competitions, filters, levels }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Kelola Lomba</h1>}>
            <Head title="Kelola Lomba" />

            <div className="max-w-7xl mx-auto p-4">
                <div className="mb-6">
                    <Link href={route('admin.competitions.create')}>
                        <PrimaryButton>Buat Lomba Baru</PrimaryButton>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left">Nama</th>
                                <th className="px-4 py-2 text-left">Jenjang</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competitions.data?.map((comp) => (
                                <tr key={comp.id} className="border-t">
                                    <td className="px-4 py-2">{comp.name}</td>
                                    <td className="px-4 py-2">{comp.level_label}</td>
                                    <td className="px-4 py-2">{comp.status_label}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-3">
                                            <Link href={route('admin.competitions.show', comp.id)}>
                                                <button className="text-blue-600 hover:underline">Lihat</button>
                                            </Link>
                                            <Link href={route('admin.rubrics.edit', comp.id)}>
                                                <button className="text-blue-600 hover:underline">Rubrik</button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
