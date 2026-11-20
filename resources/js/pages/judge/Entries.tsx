import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, School } from 'lucide-react';

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
    const sisa = Math.max(0, counts.total - counts.done);

    return (
        <AuthenticatedLayout header={<h1>Penilaian {competition.name}</h1>}>
            <Head title={`Penilaian ${competition.name}`} />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Jenjang {competition.level_label ?? '—'}</span>
                            <h2>Daftar entri</h2>
                            <p className="muted">
                                {counts.done} dari {counts.total} entri sudah dikunci · {sisa} entri menunggu penilaian.
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('judge.dashboard')}>
                            <ArrowLeft size={16} aria-hidden />
                            Kembali ke dasbor
                        </Link>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <b>{counts.total}</b>
                            <span>Entri terverifikasi</span>
                        </div>
                        <div className="stat">
                            <b>{counts.done}</b>
                            <span>Terkunci</span>
                            <small>{sisa} belum dikunci</small>
                        </div>
                    </div>
                </section>

                {entries.length === 0 ? (
                    <div className="panel">
                        <EmptyState
                            title="Belum ada entri terverifikasi"
                            description="Entri akan muncul di sini setelah panitia memverifikasi pendaftaran peserta."
                            action={
                                <Link className="btn btn--sm" href={route('judge.dashboard')}>
                                    Kembali ke dasbor
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <section className="panel">
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Peserta</th>
                                        <th>Sekolah</th>
                                        <th>Status</th>
                                        <th>Nilai</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td data-label="Kode" className="nowrap">
                                                <span className="tnum small">{entry.code}</span>
                                            </td>
                                            <td data-label="Peserta">
                                                <span className="strong">
                                                    {entry.team_name ?? (entry.names.join(', ') || 'Tanpa nama')}
                                                </span>
                                                {entry.team_name && entry.names.length > 0 && (
                                                    <span className="small muted" style={{ display: 'block' }}>
                                                        {entry.names.join(', ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Sekolah">
                                                {entry.school_name ? (
                                                    <span className="small">
                                                        <School size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                                        {entry.school_name}
                                                    </span>
                                                ) : (
                                                    <span className="small muted">—</span>
                                                )}
                                            </td>
                                            <td data-label="Status">
                                                {entry.status ? (
                                                    <StatusBadge value={entry.status} label={entry.status_label ?? undefined} />
                                                ) : (
                                                    <span className="badge badge--neutral">Belum dinilai</span>
                                                )}
                                            </td>
                                            <td data-label="Nilai" className="num nowrap">
                                                {entry.total !== null ? (
                                                    <span className="strong">{entry.total.toFixed(2)}</span>
                                                ) : (
                                                    <span className="muted">—</span>
                                                )}
                                            </td>
                                            <td data-label="Aksi">
                                                <Link
                                                    className="btn btn--clay btn--sm"
                                                    href={route('judge.scores.edit', entry.id)}
                                                >
                                                    <ClipboardList size={16} aria-hidden />
                                                    {entry.status === null
                                                        ? 'Isi nilai'
                                                        : entry.status === 'locked'
                                                          ? 'Lihat nilai'
                                                          : 'Lanjutkan nilai'}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
