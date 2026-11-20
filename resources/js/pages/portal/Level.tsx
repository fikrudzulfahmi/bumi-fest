import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Megaphone, Ticket, Trophy, Users } from 'lucide-react';

interface Competition {
    id: number;
    name: string;
    slug: string;
    category: string;
    fee: number;
    opens_at: string;
    closes_at: string;
    quota: number | null;
    status: string;
    results_published_at: string | null;
}

interface Announcement {
    id: number;
    title: string;
    body: string;
    published_at: string;
}

interface Level {
    slug: string;
    label: string;
}

interface Props {
    level: Level;
    competitions: Competition[];
    announcements: Announcement[];
}

function tanggal(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const BENTO = ['k--clay', 'k--saf', '', 'k--moss', ''];

export default function Level({ level, competitions, announcements }: Props) {
    const terbuka = competitions.filter((competition) => competition.status === 'Dibuka').length;

    return (
        <AuthenticatedLayout header={<h1>Portal {level.label}</h1>}>
            <Head title={`Portal ${level.label}`} />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Jenjang {level.label}</span>
                            <h2>Cabang lomba tersedia</h2>
                            <p className="muted">
                                {competitions.length > 0
                                    ? `${competitions.length} cabang terdaftar · ${terbuka} sedang dibuka untuk pendaftaran.`
                                    : 'Panitia belum membuka cabang lomba pada jenjang ini.'}
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('portal.index')}>
                            <ArrowLeft size={16} aria-hidden />
                            Pilih jenjang lain
                        </Link>
                    </div>

                    {competitions.length === 0 ? (
                        <EmptyState
                            title="Belum ada cabang lomba"
                            description="Cabang lomba jenjang ini akan tampil di sini begitu panitia membukanya."
                            action={
                                <Link className="btn btn--sm" href={route('portal.index')}>
                                    Kembali ke portal
                                </Link>
                            }
                        />
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gap: 16,
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                marginTop: 4,
                            }}
                        >
                            {competitions.map((comp, i) => {
                                const penuh = comp.status === 'Kuota penuh';
                                const buka = comp.status === 'Dibuka';

                                return (
                                    <div key={comp.id} className={penuh ? 'k k--ink' : `k ${BENTO[i] ?? ''}`.trim()}>
                                        <div className="row-between" style={{ alignItems: 'flex-start' }}>
                                            <span className="n">{String(i + 1).padStart(2, '0')}</span>
                                            <StatusBadge value={comp.status} />
                                        </div>

                                        <h3>{comp.name}</h3>
                                        <p>
                                            <Users size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                            {comp.category === 'individual' ? 'Individu' : 'Tim'}
                                            {comp.quota !== null ? ` · kuota ${comp.quota}` : ''}
                                        </p>

                                        <div className="small" style={{ opacity: 0.9 }}>
                                            <p style={{ margin: 0 }}>
                                                <CalendarDays size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                                {tanggal(comp.opens_at)} – {tanggal(comp.closes_at)}
                                            </p>
                                        </div>

                                        <div className="meta">
                                            <span>
                                                <Ticket size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                                {formatRupiah(comp.fee)}
                                            </span>
                                            {comp.results_published_at && <span className="pill">Hasil terbit</span>}
                                        </div>

                                        <div className="row-gap" style={{ marginTop: 4, gap: 8 }}>
                                            {buka ? (
                                                <Link
                                                    className="btn btn--sm"
                                                    href={route('registrations.create', [level.slug, comp.slug])}
                                                >
                                                    <Trophy size={15} aria-hidden />
                                                    Daftar sekarang
                                                </Link>
                                            ) : (
                                                <span className="small">{penuh ? 'Kuota sudah penuh' : 'Belum dibuka'}</span>
                                            )}

                                            {comp.results_published_at && (
                                                <Link
                                                    className="btn btn--ghost btn--sm"
                                                    href={route('portal.results', [level.slug, comp.slug])}
                                                >
                                                    Lihat hasil
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Informasi panitia</span>
                            <h3>
                                <Megaphone size={18} aria-hidden style={{ verticalAlign: '-3px' }} /> Pengumuman
                            </h3>
                            <p className="muted">Kabar terbaru seputar jadwal, teknis, dan hasil lomba.</p>
                        </div>
                    </div>

                    {announcements.length === 0 ? (
                        <p className="small muted">Belum ada pengumuman untuk jenjang ini.</p>
                    ) : (
                        <div className="stack-sm">
                            {announcements.map((ann, i) => (
                                <div key={ann.id}>
                                    {i > 0 && <div className="divider" />}
                                    <h3 style={{ fontSize: '1.1rem' }}>{ann.title}</h3>
                                    <p className="small muted" style={{ marginTop: 6 }}>
                                        {ann.body}
                                    </p>
                                    <p className="small muted" style={{ marginTop: 8 }}>
                                        <CalendarDays size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                        {tanggal(ann.published_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
