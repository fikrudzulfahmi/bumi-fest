import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Pagination from '@/Components/app/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
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
    per_page?: number;
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
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Data Lembaga</h1>
                </div>
            }
        >
            <Head title="Data Lembaga" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {institutions.total} lembaga terdaftar.
                </p>
            </div>

            <section className="panel panel--flat">
                <div className="row-between" style={{ alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 260px', maxWidth: 420 }}>
                        <Field label="Cari lembaga" htmlFor="institution-q" hint="Nama, NPSN, atau kota.">
                            <input
                                id="institution-q"
                                className="input"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && apply()}
                                placeholder="nama / NPSN / kota"
                            />
                        </Field>
                    </div>
                    <button type="button" className="btn btn--clay btn--sm" onClick={apply}>
                        <Search size={16} aria-hidden />
                        Cari
                    </button>
                </div>
            </section>

            {institutions.data.length === 0 ? (
                <EmptyState
                    title="Belum ada lembaga"
                    description="Lembaga akan muncul setelah akun sekolah menyelesaikan pendaftaran."
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Lembaga</th>
                                <th>NPSN</th>
                                <th>Kota</th>
                                <th>Akun</th>
                                <th>Siswa</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {institutions.data.map((item) => (
                                <tr key={item.id}>
                                    <td data-label="Lembaga" className="strong">
                                        {item.name}
                                    </td>
                                    <td data-label="NPSN" className="num nowrap">
                                        {item.npsn ?? '—'}
                                    </td>
                                    <td data-label="Kota">{item.city ?? '—'}</td>
                                    <td data-label="Akun">
                                        <span className="small">{item.user?.name ?? '—'}</span>
                                        <span className="small muted" style={{ display: 'block' }}>
                                            {item.user?.email ?? '—'}
                                        </span>
                                        {item.user && !item.user.is_active && (
                                            <span className="badge badge--bad" style={{ marginTop: 4 }}>
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td data-label="Siswa" className="num strong">
                                        {item.participants_count}
                                    </td>
                                    <td data-label="Aksi">
                                        <Link
                                            href={route('admin.institutions.show', item.id)}
                                            className="btn btn--ghost btn--sm"
                                        >
                                            <Eye size={15} aria-hidden />
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination links={institutions.links} total={institutions.total} perPage={institutions.per_page} />
        </AuthenticatedLayout>
    );
}
