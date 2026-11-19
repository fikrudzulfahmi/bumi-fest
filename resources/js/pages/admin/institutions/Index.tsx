import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Institution {
    id: number;
    name: string;
    npsn: string | null;
    city: string | null;
    user: { id: number; name: string; email: string; whatsapp: string | null; is_active: boolean } | null;
    participants_count: number;
}

interface Paginated {
    data: Institution[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}

interface Props {
    institutions: Paginated;
    filters: { q: string };
}

export default function Index({ institutions, filters }: Props) {
    const [q, setQ] = useState(filters.q);

    const apply = () => {
        router.get(route('admin.institutions.index'), { q }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Data Lembaga</h1>}>
            <Head title="Data Lembaga" />

            <div className="mx-auto max-w-6xl space-y-4 p-4">
                <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-white p-3">
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Cari</span>
                        <input
                            className="rounded border-gray-300 text-sm"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && apply()}
                            placeholder="nama / NPSN / kota"
                        />
                    </label>
                    <PrimaryButton onClick={apply}>Cari</PrimaryButton>
                </div>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <th className="px-3 py-2">Lembaga</th>
                                <th className="px-3 py-2">NPSN</th>
                                <th className="px-3 py-2">Kota</th>
                                <th className="px-3 py-2">Akun</th>
                                <th className="px-3 py-2">Siswa</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {institutions.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                                        Belum ada lembaga.
                                    </td>
                                </tr>
                            )}
                            {institutions.data.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                    <td className="px-3 py-2 font-medium">{item.name}</td>
                                    <td className="px-3 py-2 text-gray-600">{item.npsn ?? '—'}</td>
                                    <td className="px-3 py-2 text-gray-600">{item.city ?? '—'}</td>
                                    <td className="px-3 py-2">
                                        <p className="text-xs">{item.user?.email ?? '—'}</p>
                                        {item.user && !item.user.is_active && (
                                            <span className="text-xs text-red-600">nonaktif</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">{item.participants_count}</td>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={route('admin.institutions.show', item.id)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-xs">
                    {institutions.links.map((link, index) =>
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
                    <span className="ml-2 text-gray-500">{institutions.total} lembaga</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
