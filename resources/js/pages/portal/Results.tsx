import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface Winner {
    id: number;
    code: string;
    team_name: string | null;
    placement: number;
    names: string[];
    school_name: string | null;
}

interface Props {
    level: { slug: string; label: string };
    competition: { id: number; name: string; slug: string; results_published_at: string | null };
    winners: Winner[];
}

const medal = (placement: number) => (placement === 1 ? 'Juara 1' : placement === 2 ? 'Juara 2' : 'Juara 3');

export default function Results({ level, competition, winners }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold">Hasil Lomba</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {level.label}
                    </p>
                </div>
            }
        >
            <Head title={`Hasil ${competition.name}`} />

            <div className="mx-auto max-w-3xl space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-gray-600">
                        Hasil resmi sudah diterbitkan panitia. Sertifikat dikirim ke email pemilik entri.
                    </p>
                    <Link
                        href={route('portal.level', level.slug)}
                        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                        Kembali ke portal
                    </Link>
                </div>

                {winners.length === 0 ? (
                    <div className="rounded border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                        Panitia belum menetapkan juara pada lomba ini.
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {winners.map((winner) => (
                            <li
                                key={winner.id}
                                className={`rounded border bg-white p-4 ${
                                    winner.placement === 1
                                        ? 'border-amber-300 ring-1 ring-amber-200'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <span
                                            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                                                winner.placement === 1
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {medal(winner.placement)}
                                        </span>
                                        <h2 className="mt-2 text-lg font-semibold">
                                            {winner.team_name ?? (winner.names.join(', ') || 'Tanpa nama')}
                                        </h2>
                                        {winner.team_name && winner.names.length > 0 && (
                                            <p className="text-sm text-gray-600">{winner.names.join(', ')}</p>
                                        )}
                                        {winner.school_name && (
                                            <p className="text-xs text-gray-500">{winner.school_name}</p>
                                        )}
                                    </div>
                                    <span className="font-mono text-xs text-gray-400">{winner.code}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="text-xs text-gray-500">
                    Peserta yang tidak masuk juara tetap dapat melihat nilai akhirnya di halaman pendaftaran.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
