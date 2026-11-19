import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Entry {
    id: number;
    code: string;
    team_name: string | null;
    names: string[];
    school_name: string | null;
    status: string | null;
    status_label: string | null;
    total: number | null;
}

interface Props {
    competition: { id: number; name: string; level_label: string | null };
    entries: Entry[];
    counts: { total: number; done: number };
}

export default function Entries({ competition, entries, counts }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold">Penilaian</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Penilaian ${competition.name}`} />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-gray-600">
                        {counts.done} dari {counts.total} entri terkunci
                    </p>
                    <Link
                        href={route('judge.dashboard')}
                        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                        Kembali ke dasbor
                    </Link>
                </div>

                {entries.length === 0 && (
                    <div className="rounded border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                        Belum ada entri terverifikasi pada lomba ini.
                    </div>
                )}

                <ul className="space-y-3">
                    {entries.map((entry) => (
                        <li key={entry.id} className="rounded border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-mono text-xs text-gray-500">{entry.code}</p>
                                    <h2 className="text-base font-semibold">
                                        {entry.team_name ?? (entry.names.join(', ') || 'Tanpa nama')}
                                    </h2>
                                    {entry.team_name && entry.names.length > 0 && (
                                        <p className="text-sm text-gray-600">{entry.names.join(', ')}</p>
                                    )}
                                    {entry.school_name && (
                                        <p className="text-xs text-gray-500">{entry.school_name}</p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <span
                                        className={`rounded px-2 py-1 text-xs ${
                                            entry.status === 'locked'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : entry.status === 'draft'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {entry.status_label ?? 'Belum dinilai'}
                                    </span>
                                    {entry.total !== null && (
                                        <span className="text-sm font-semibold">{entry.total.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3">
                                <Link
                                    href={route('judge.scores.edit', entry.id)}
                                    className="inline-block min-h-11 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                                >
                                    {entry.status === null
                                        ? 'Isi nilai'
                                        : entry.status === 'locked'
                                          ? 'Lihat nilai'
                                          : 'Lanjutkan nilai'}
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </AuthenticatedLayout>
    );
}
