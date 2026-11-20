import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Participant {
    id: number;
    name: string;
    grade: number | null;
    level: string | null;
    school_name: string | null;
}

interface Institution {
    id: number;
    name: string;
    npsn: string | null;
    city: string | null;
    user: { id: number; name: string; email: string; whatsapp: string | null; is_active: boolean } | null;
    participants_count: number;
}

interface Props {
    institution: Institution;
    participants: Participant[];
}

export default function Show({ institution, participants }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Lembaga</span>
                    <h1>{institution.name}</h1>
                </div>
            }
        >
            <Head title={institution.name} />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    Profil lembaga, akun penanggung jawab, dan daftar siswa.
                </p>
                <Link href={route('admin.institutions.index')} className="btn btn--ghost btn--sm">
                    <ArrowLeft size={16} aria-hidden />
                    Kembali ke daftar
                </Link>
            </div>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Profil lembaga</span>
                        <h2>{institution.name}</h2>
                        <p className="muted">
                            NPSN {institution.npsn ?? '—'} · {institution.city ?? 'Kota belum diisi'}
                        </p>
                    </div>
                    <span className={`badge ${institution.user?.is_active ? 'badge--ok' : 'badge--bad'}`}>
                        {institution.user?.is_active ? 'Akun aktif' : 'Akun nonaktif'}
                    </span>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 18,
                    }}
                >
                    <div>
                        <span className="kicker">NPSN</span>
                        <p className="strong tnum" style={{ marginTop: 4 }}>
                            {institution.npsn ?? '—'}
                        </p>
                    </div>
                    <div>
                        <span className="kicker">Kota</span>
                        <p className="strong" style={{ marginTop: 4 }}>
                            {institution.city ?? '—'}
                        </p>
                    </div>
                    <div>
                        <span className="kicker">Penanggung jawab</span>
                        <p className="strong" style={{ marginTop: 4 }}>
                            {institution.user?.name ?? '—'}
                        </p>
                        <p className="small muted">{institution.user?.email ?? '—'}</p>
                        <p className="small muted">{institution.user?.whatsapp ?? '—'}</p>
                    </div>
                    <div>
                        <span className="kicker">Siswa terdaftar</span>
                        <p className="strong tnum" style={{ marginTop: 4, fontSize: 22 }}>
                            {institution.participants_count}
                        </p>
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Peserta</span>
                        <h3>Daftar siswa</h3>
                    </div>
                    <span className="badge badge--neutral">{participants.length} siswa</span>
                </div>

                {participants.length === 0 ? (
                    <EmptyState
                        title="Belum ada siswa terdaftar"
                        description="Siswa yang didaftarkan oleh lembaga ini akan tampil di sini."
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Nama siswa</th>
                                    <th>Kelas</th>
                                    <th>Jenjang</th>
                                    <th>Sekolah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((participant) => (
                                    <tr key={participant.id}>
                                        <td data-label="Nama siswa" className="strong">
                                            {participant.name}
                                        </td>
                                        <td data-label="Kelas" className="num">
                                            {participant.grade ?? '—'}
                                        </td>
                                        <td data-label="Jenjang">
                                            <span className="tag">{participant.level?.toUpperCase() ?? '—'}</span>
                                        </td>
                                        <td data-label="Sekolah">{participant.school_name ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
