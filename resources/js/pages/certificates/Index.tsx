import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Download, FileArchive, Medal, ShieldCheck } from 'lucide-react';

interface CertificateItem {
    id: number;
    number: string;
    type: string;
    type_label: string;
    placement: number | null;
    participant_name: string | null;
    competition_name: string | null;
    generated_at: string | null;
}

interface Props {
    certificates: CertificateItem[];
    can_zip: boolean;
}

function tanggal(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Index({ certificates, can_zip }: Props) {
    const winners = certificates.filter((cert) => cert.type === 'winner').length;

    return (
        <AuthenticatedLayout header={<h1>Sertifikat</h1>}>
            <Head title="Sertifikat" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Piagam digital</span>
                            <h2>Sertifikat Anda</h2>
                            <p className="muted">
                                Sertifikat terbit setelah panitia mengumumkan hasil lomba. Unduh berkas PDF untuk
                                disimpan atau dicetak.
                            </p>
                        </div>
                        {can_zip && (
                            <Link className="btn btn--moss btn--sm" href={route('certificates.download-all')}>
                                <FileArchive size={16} aria-hidden />
                                Unduh semua (ZIP)
                            </Link>
                        )}
                    </div>

                    {certificates.length > 0 && (
                        <div className="stat-grid">
                            <div className="stat">
                                <b>{certificates.length}</b>
                                <span>Sertifikat tersedia</span>
                            </div>
                            <div className="stat">
                                <b>{winners}</b>
                                <span>Sertifikat juara</span>
                                <small>{certificates.length - winners} partisipasi</small>
                            </div>
                        </div>
                    )}
                </section>

                {certificates.length === 0 ? (
                    <div className="panel">
                        <EmptyState
                            title="Belum ada sertifikat"
                            description="Sertifikat dibuat setelah hasil lomba diterbitkan oleh panitia. Pantau halaman hasil pada portal lomba."
                            action={
                                <Link className="btn btn--sm" href={route('portal.index')}>
                                    <ShieldCheck size={16} aria-hidden />
                                    Buka portal lomba
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="stack-sm">
                        {certificates.map((cert) => (
                            <section key={cert.id} className="panel">
                                <div className="row-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="row-gap" style={{ gap: 8 }}>
                                            <StatusBadge
                                                value={cert.type}
                                                label={
                                                    cert.placement !== null
                                                        ? `${cert.type_label} — Juara ${cert.placement}`
                                                        : cert.type_label
                                                }
                                            />
                                            <span className="tnum small muted">{cert.number}</span>
                                        </div>

                                        <h3 style={{ marginTop: 10 }}>
                                            {cert.participant_name ?? '—'}
                                            {cert.placement !== null && (
                                                <span className="tag tag--saffron" style={{ marginLeft: 10 }}>
                                                    <Medal size={14} aria-hidden />
                                                    Peringkat {cert.placement}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="small muted" style={{ marginTop: 4 }}>
                                            {cert.competition_name ?? '—'} · terbit {tanggal(cert.generated_at)}
                                        </p>
                                    </div>

                                    <Link
                                        className="btn btn--clay btn--sm"
                                        href={route('certificates.download', cert.id)}
                                    >
                                        <Download size={16} aria-hidden />
                                        Unduh PDF
                                    </Link>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
