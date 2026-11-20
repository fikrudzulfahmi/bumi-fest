import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';

interface Level {
    slug: string;
    label: string;
}

interface Props {
    levels: Level[];
}

const LEVEL_DESCRIPTION: Record<string, string> = {
    'sd-mi': 'Sekolah Dasar / Madrasah Ibtidaiyah',
    'smp-mts': 'Sekolah Menengah Pertama / Madrasah Tsanawiyah',
};

const BENTO = ['k--clay', 'k--moss', '', 'k--saf'];

export default function Index({ levels }: Props) {
    return (
        <AuthenticatedLayout header={<h1>Portal Bumifest</h1>}>
            <Head title="Portal Jenjang" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <span className="kicker">Jenjang pendidikan</span>
                    <h2 style={{ marginTop: 10 }}>Pilih jenjang, temukan cabang lombanya.</h2>
                    <p className="muted" style={{ marginTop: 8, maxWidth: '62ch' }}>
                        Setiap jenjang punya daftar cabang lomba, jadwal, dan pengumuman tersendiri. Pilih salah satu untuk
                        melihat detail dan mulai mendaftar.
                    </p>
                </section>

                <div className="bento" style={{ marginTop: 0 }}>
                    {levels.map((level, i) => (
                        <Link key={level.slug} className={`k ${BENTO[i] ?? ''}`.trim()} href={`/portal/${level.slug}`}>
                            <span className="n">{String(i + 1).padStart(2, '0')}</span>
                            <h3>{level.label}</h3>
                            <p>
                                {level.slug === 'sd-mi' ? (
                                    <GraduationCap size={16} aria-hidden style={{ verticalAlign: '-2px' }} />
                                ) : (
                                    <BookOpen size={16} aria-hidden style={{ verticalAlign: '-2px' }} />
                                )}{' '}
                                {LEVEL_DESCRIPTION[level.slug] ?? 'Jenjang pendidikan'}
                            </p>
                            <div className="meta">
                                <span>Lihat cabang lomba</span>
                                <span className="pill">
                                    Buka <ArrowRight size={13} aria-hidden style={{ verticalAlign: '-2px' }} />
                                </span>
                            </div>
                        </Link>
                    ))}

                    {levels.length === 0 && (
                        <div className="empty" style={{ gridColumn: '1 / -1' }}>
                            <h3>Belum ada jenjang dibuka</h3>
                            <p className="muted">Panitia belum membuka jenjang lomba. Silakan periksa kembali nanti.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
