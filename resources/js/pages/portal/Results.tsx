import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, CalendarDays, Info, School } from 'lucide-react';

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

function tanggal(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Results({ level, competition, winners }: Props) {
    return (
        <AuthenticatedLayout header={<h1>Hasil {competition.name}</h1>}>
            <Head title={`Hasil ${competition.name}`} />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Pengumuman resmi</span>
                            <h2>{competition.name}</h2>
                            <p className="muted">
                                Jenjang {level.label} · diterbitkan {tanggal(competition.results_published_at)}
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('portal.level', level.slug)}>
                            <ArrowLeft size={16} aria-hidden />
                            Kembali ke portal
                        </Link>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <b>{winners.length}</b>
                            <span>Penerima juara</span>
                        </div>
                        <div className="stat">
                            <b style={{ fontSize: '1.3rem' }}>{level.label}</b>
                            <span>Jenjang lomba</span>
                        </div>
                        <div className="stat">
                            <b style={{ fontSize: '1.3rem' }}>
                                <CalendarDays size={16} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                {tanggal(competition.results_published_at)}
                            </b>
                            <span>Tanggal terbit</span>
                        </div>
                    </div>
                </section>

                {winners.length === 0 ? (
                    <div className="panel">
                        <EmptyState
                            title="Juara belum ditetapkan"
                            description="Panitia belum menetapkan juara pada lomba ini. Hasil akan tampil di halaman ini setelah diumumkan."
                            action={
                                <Link className="btn btn--sm" href={route('portal.level', level.slug)}>
                                    Lihat cabang lain
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="stack-sm">
                        {winners.map((winner) => (
                            <section
                                key={winner.id}
                                className="panel"
                                style={
                                    winner.placement === 1
                                        ? { borderColor: 'var(--saffron)', boxShadow: '4px 4px 0 var(--saffron)' }
                                        : undefined
                                }
                            >
                                <div className="row-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="row-gap" style={{ gap: 8 }}>
                                            <span
                                                className={
                                                    winner.placement === 1
                                                        ? 'badge badge--ok'
                                                        : 'badge badge--neutral'
                                                }
                                            >
                                                <Award size={14} aria-hidden /> {medal(winner.placement)}
                                            </span>
                                            <span className="tnum small muted">{winner.code}</span>
                                        </div>

                                        <h3 style={{ marginTop: 10 }}>
                                            {winner.team_name ?? (winner.names.join(', ') || 'Tanpa nama')}
                                        </h3>

                                        {winner.team_name && winner.names.length > 0 && (
                                            <p className="small muted" style={{ marginTop: 4 }}>
                                                {winner.names.join(', ')}
                                            </p>
                                        )}

                                        {winner.school_name && (
                                            <p className="small muted" style={{ marginTop: 4 }}>
                                                <School size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                                {winner.school_name}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className="strong"
                                        style={{ fontFamily: 'var(--D)', fontSize: '1.4rem' }}
                                        aria-hidden="true"
                                    >
                                        #{winner.placement}
                                    </span>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <p className="small muted">
                    <Info size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Peserta yang tidak masuk juara tetap
                    dapat melihat nilai akhirnya di halaman pendaftaran masing-masing.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
