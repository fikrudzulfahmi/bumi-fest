import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface Assignment {
    id: number;
    competition: { id: number; name: string; level: string; level_label: string | null; slug: string };
    entries_total: number;
    entries_locked: number;
    entries_drafted: number;
    entries_remaining: number;
    progress_percent: number;
}

interface Props {
    assignments: Assignment[];
}

export default function Dashboard({ assignments }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Dasbor Juri</h1>}>
            <Head title="Dasbor Juri" />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                {assignments.length === 0 && (
                    <div className="rounded border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                        Belum ada lomba yang ditugaskan kepada Anda. Hubungi admin bila ini keliru.
                    </div>
                )}

                {assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded border border-gray-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-semibold">{assignment.competition.name}</h2>
                                <p className="text-xs text-gray-500">
                                    Jenjang {assignment.competition.level_label}
                                </p>
                            </div>
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                {assignment.progress_percent}% terkunci
                            </span>
                        </div>

                        <div className="mt-3 h-2 w-full overflow-hidden rounded bg-gray-100">
                            <div
                                className="h-2 rounded bg-emerald-500"
                                style={{ width: `${assignment.progress_percent}%` }}
                            />
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                            <div>
                                <dt className="text-xs text-gray-500">Entri terverifikasi</dt>
                                <dd className="font-medium">{assignment.entries_total}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Terkunci</dt>
                                <dd className="font-medium text-emerald-700">{assignment.entries_locked}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Draf</dt>
                                <dd className="font-medium text-amber-700">{assignment.entries_drafted}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Belum dinilai</dt>
                                <dd className="font-medium text-gray-700">{assignment.entries_remaining}</dd>
                            </div>
                        </dl>
                    </div>
                ))}

                <p className="text-xs text-gray-500">
                    Lembar nilai diisi dari menu penilaian setiap entri. Progres dihitung dari entri terverifikasi
                    yang sudah dikunci.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
