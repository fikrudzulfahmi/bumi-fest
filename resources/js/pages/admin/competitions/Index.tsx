import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { BarChart3, ListChecks, Plus, Settings2 } from 'lucide-react';

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
        meta?: { total: number; per_page: number; current_page: number };
        total?: number;
    };
    filters: Record<string, string | null>;
    levels: Array<{ value: string; label: string }>;
}

export default function Index({ competitions }: Props) {
    const rows = competitions.data ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Kelola Lomba</h1>
                </div>
            }
        >
            <Head title="Kelola Lomba" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {competitions.total ?? rows.length} lomba terdaftar.
                </p>
                <Link href={route('admin.competitions.create')} className="btn btn--clay btn--sm">
                    <Plus size={16} aria-hidden />
                    Buat lomba baru
                </Link>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    title="Belum ada lomba"
                    description="Buat cabang lomba pertama untuk membuka pendaftaran."
                    action={
                        <Link href={route('admin.competitions.create')} className="btn btn--sm">
                            Buat lomba baru
                        </Link>
                    }
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Nama lomba</th>
                                <th>Jenjang</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((comp) => (
                                <tr key={comp.id}>
                                    <td data-label="Nama lomba" className="strong">
                                        {comp.name}
                                    </td>
                                    <td data-label="Jenjang">{comp.level_label}</td>
                                    <td data-label="Status">
                                        <StatusBadge value={comp.status} label={comp.status_label} />
                                    </td>
                                    <td data-label="Aksi">
                                        <div className="row-gap" style={{ gap: 8 }}>
                                            <Link
                                                href={route('admin.competitions.show', comp.id)}
                                                className="btn btn--ghost btn--sm"
                                            >
                                                <Settings2 size={15} aria-hidden />
                                                Detail
                                            </Link>
                                            <Link
                                                href={route('admin.rubrics.edit', comp.id)}
                                                className="btn btn--ghost btn--sm"
                                            >
                                                <ListChecks size={15} aria-hidden />
                                                Rubrik
                                            </Link>
                                            <Link
                                                href={route('admin.results.index', comp.id)}
                                                className="btn btn--ghost btn--sm"
                                            >
                                                <BarChart3 size={15} aria-hidden />
                                                Hasil
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
