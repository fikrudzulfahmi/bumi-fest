import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Lock, PencilLine, Trophy } from 'lucide-react';

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
    const totalEntri = assignments.reduce((sum, a) => sum + a.entries_total, 0);
    const totalTerkunci = assignments.reduce((sum, a) => sum + a.entries_locked, 0);

    return (
        <AuthenticatedLayout header={<h1>Dasbor Juri</h1>}>
            <Head title="Dasbor Juri" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Penugasan juri</span>
                            <h2>Lomba yang Anda nilai</h2>
                            <p className="muted">
                                Lembar nilai diisi per entri, lalu dikunci sebagai nilai resmi Anda. Progres dihitung dari
                                entri terverifikasi yang sudah dikunci.
                            </p>
                        </div>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <b>{assignments.length}</b>
                            <span>Cabang ditugaskan</span>
                        </div>
                        <div className="stat">
                            <b>{totalEntri}</b>
                            <span>Entri terverifikasi</span>
                        </div>
                        <div className="stat">
                            <b>{totalTerkunci}</b>
                            <span>Sudah dikunci</span>
                        </div>
                    </div>
                </section>

                {assignments.length === 0 ? (
                    <div className="panel">
                        <EmptyState
                            title="Belum ada penugasan"
                            description="Belum ada lomba yang ditugaskan kepada Anda. Hubungi panitia bila ini keliru."
                        />
                    </div>
                ) : (
                    <div className="stack-sm">
                        {assignments.map((assignment) => (
                            <section key={assignment.id} className="panel">
                                <div className="row-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                                    <div>
                                        <span className="kicker">
                                            <Trophy size={12} aria-hidden style={{ verticalAlign: '-2px' }} /> Jenjang{' '}
                                            {assignment.competition.level_label ?? assignment.competition.level}
                                        </span>
                                        <h3 style={{ marginTop: 6 }}>{assignment.competition.name}</h3>
                                    </div>

                                    <Link
                                        className="btn btn--clay btn--sm"
                                        href={route('judge.entries', assignment.competition.id)}
                                    >
                                        <ClipboardList size={16} aria-hidden />
                                        Isi nilai entri
                                    </Link>
                                </div>

                                <div style={{ marginTop: 14 }}>
                                    <div className="row-between" style={{ marginBottom: 6 }}>
                                        <span className="small muted">Progres penguncian</span>
                                        <span className="small strong tnum">{assignment.progress_percent}%</span>
                                    </div>
                                    <div
                                        style={{
                                            height: 12,
                                            border: '2px solid var(--ink)',
                                            borderRadius: 999,
                                            background: 'var(--sand-2)',
                                            overflow: 'hidden',
                                        }}
                                        role="progressbar"
                                        aria-valuenow={assignment.progress_percent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`Progres ${assignment.competition.name}`}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${assignment.progress_percent}%`,
                                                background: 'var(--moss)',
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="stat-grid" style={{ marginTop: 16 }}>
                                    <div className="stat">
                                        <b>{assignment.entries_total}</b>
                                        <span>Entri terverifikasi</span>
                                    </div>
                                    <div className="stat">
                                        <b>{assignment.entries_locked}</b>
                                        <span>
                                            <Lock size={12} aria-hidden style={{ verticalAlign: '-2px' }} /> Terkunci
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <b>{assignment.entries_drafted}</b>
                                        <span>
                                            <PencilLine size={12} aria-hidden style={{ verticalAlign: '-2px' }} /> Draf
                                        </span>
                                    </div>
                                    <div className="stat">
                                        <b>{assignment.entries_remaining}</b>
                                        <span>Belum dinilai</span>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
