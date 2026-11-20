import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { Eye, Trophy } from 'lucide-react';

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    competition_name: string;
    fee: number;
    team_name: string | null;
    member_names: string[];
}

interface Props {
    registrations: Registration[];
    schoolParticipants: number;
}

export default function SchoolDashboard({ registrations, schoolParticipants }: Props) {
    const totalFee = registrations.reduce((sum, r) => sum + (r.fee ?? 0), 0);

    return (
        <AuthenticatedLayout header={<h1>Dasbor Sekolah</h1>}>
            <Head title="Dasbor Sekolah" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Ringkasan lembaga</span>
                            <h2>Partisipasi sekolah Anda</h2>
                            <p className="muted">Rekap entri lomba dan siswa yang sudah terdata pada akun lembaga ini.</p>
                        </div>
                        <Link className="btn btn--clay btn--sm" href={route('portal.index')}>
                            <Trophy size={18} aria-hidden />
                            Pilih lomba
                        </Link>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <b>{registrations.length}</b>
                            <span>Entri terdaftar</span>
                        </div>
                        <div className="stat">
                            <b>{schoolParticipants}</b>
                            <span>Siswa terdata</span>
                        </div>
                        <div className="stat">
                            <b style={{ fontSize: '1.5rem' }}>{formatRupiah(totalFee)}</b>
                            <span>Total biaya entri</span>
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Entri</span>
                            <h3>Daftar entri sekolah</h3>
                            <p className="muted">
                                {registrations.length > 0
                                    ? 'Buka detail untuk melengkapi dokumen atau mengganti anggota.'
                                    : 'Belum ada entri tercatat.'}
                            </p>
                        </div>
                    </div>

                    {registrations.length === 0 ? (
                        <EmptyState
                            title="Belum ada entri"
                            description="Mulai dari portal lomba: pilih jenjang, lalu pilih cabang yang ingin diikuti siswa sekolah Anda."
                            action={
                                <Link className="btn btn--sm" href={route('portal.index')}>
                                    Buka portal lomba
                                </Link>
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Lomba</th>
                                        <th>Kode</th>
                                        <th>Anggota</th>
                                        <th>Biaya</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg.id}>
                                            <td data-label="Lomba">
                                                <span className="strong">{reg.competition_name}</span>
                                                {reg.team_name && (
                                                    <span className="small muted" style={{ display: 'block' }}>
                                                        Tim {reg.team_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Kode" className="nowrap">
                                                <span className="tnum small">{reg.code || '—'}</span>
                                            </td>
                                            <td data-label="Anggota">
                                                {reg.member_names.length > 0 ? (
                                                    <span className="small">{reg.member_names.join(', ')}</span>
                                                ) : (
                                                    <span className="small muted">—</span>
                                                )}
                                            </td>
                                            <td data-label="Biaya" className="num nowrap">
                                                {formatRupiah(reg.fee)}
                                            </td>
                                            <td data-label="Status">
                                                <StatusBadge value={reg.status} label={reg.status_label} />
                                            </td>
                                            <td data-label="Aksi">
                                                <Link
                                                    className="btn btn--ghost btn--sm"
                                                    href={route('registrations.edit', reg.id)}
                                                >
                                                    <Eye size={16} aria-hidden />
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
