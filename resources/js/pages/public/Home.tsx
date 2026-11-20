import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Competition {
    id: number;
    name: string;
    level: string;
    level_label: string | null;
    category: string;
    fee: number;
    opens_at: string | null;
    closes_at: string | null;
    quota: number | null;
    status: string;
    slug: string;
}

interface Props {
    event_name: string;
    contact_email: string;
    contact_whatsapp: string;
    competitions: Competition[];
    stats: { total_competitions: number; total_registrations: number; levels: number };
    faqs: { q: string; a: string }[];
    can_login: boolean;
}

function rupiah(value: number): string {
    return value === 0
        ? 'Gratis'
        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function tanggal(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const BENTO = ['k--clay', 'k--saf', '', 'k--moss', ''];

export default function Home({ event_name, competitions, stats, faqs, can_login }: Props) {
    const auth = (usePage().props as { auth?: { user?: { name: string } | null } }).auth;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
    }, [open]);

    const tickerBase = competitions.length > 0 ? competitions.map((c) => c.name) : ['Bumifest'];
    // Ulangi sampai cukup lebar agar animasi -50% mulus dan pita tidak kosong.
    const tickerNames: string[] = [];
    while (tickerNames.length < 12) {
        tickerNames.push(...tickerBase);
    }

    return (
        <>
            <Head title={event_name} />

            <a href="#main" className="skip-link">
                Lewati ke konten
            </a>

            <header className="bar">
                <div className="wrap">
                    <Link className="logo" href="/">
                        <i aria-hidden="true" />
                        bumifest
                    </Link>

                    <button
                        className="burger"
                        aria-expanded={open}
                        aria-controls="nav"
                        aria-label="Buka menu"
                        onClick={() => setOpen((v) => !v)}
                    >
                        {open ? '✕' : '☰'}
                    </button>

                    <nav className={open ? 'nav open' : 'nav'} id="nav" aria-label="Navigasi utama">
                        <a href="#lomba" onClick={() => setOpen(false)}>
                            Cabang lomba
                        </a>
                        <a href="#jadwal" onClick={() => setOpen(false)}>
                            Jadwal
                        </a>
                        <a href="#alur" onClick={() => setOpen(false)}>
                            Alur
                        </a>
                        <a href="#faq" onClick={() => setOpen(false)}>
                            FAQ
                        </a>
                        {auth?.user ? (
                            <Link className="btn btn--clay btn--sm" href="/dashboard">
                                Dasbor
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} onClick={() => setOpen(false)}>
                                    Masuk
                                </Link>
                                <Link className="btn btn--clay btn--sm" href={route('register')} onClick={() => setOpen(false)}>
                                    Daftar →
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main id="main">
                <section className="hero" id="top">
                    <div className="wrap">
                        <div>
                            <span className="tag">Pendaftaran dibuka</span>
                            <h1>
                                Berakar di bumi, <em>bertanding</em> sampai langit.
                            </h1>
                            <p className="lead">
                                Festival perlombaan tempat bakat bertemu panggung. Daftar, bertanding, dan pantau hasilnya
                                dalam satu tempat.
                            </p>
                            <div className="row">
                                <Link className="btn" href={route('register')}>
                                    Daftar sekarang →
                                </Link>
                                <a className="btn btn--ghost" href="#lomba">
                                    Lihat cabang lomba
                                </a>
                            </div>
                        </div>

                        <div className="collage" aria-hidden="true">
                            <div className="c-arch" />
                            <div className="c-sun" />
                            <div className="c-leaf" />
                            <div className="c-card">
                                <small>Tiket peserta</small>
                                <b>BUMI 27</b>
                                <span>
                                    <CalendarDays size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Jadwal menyusul
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="tick" aria-hidden="true">
                    <div>
                        {[...tickerNames, ...tickerNames].map((name, i) => (
                            <span key={`${name}-${i}`}>{name}</span>
                        ))}
                    </div>
                </div>

                <div className="wrap">
                    <div className="stats">
                        <div>
                            <b>{stats.total_competitions}</b>
                            <span>Cabang lomba</span>
                        </div>
                        <div>
                            <b>{stats.total_registrations}</b>
                            <span>Pendaftar</span>
                        </div>
                        <div>
                            <b>{stats.levels}</b>
                            <span>Jenjang</span>
                        </div>
                        <div>
                            <b>Gratis</b>
                            <span>Biaya daftar</span>
                        </div>
                    </div>
                </div>

                <section className="sec" id="lomba">
                    <div className="wrap">
                        <span className="kicker">Cabang lomba</span>
                        <h2>Pilih medan kompetisimu.</h2>
                        <p className="sub">
                            {competitions.length > 0
                                ? 'Setiap cabang punya ketentuan sendiri. Buka halaman detail untuk syarat lengkap.'
                                : 'Cabang lomba akan diumumkan di sini begitu panitia membukanya.'}
                        </p>

                        {competitions.length === 0 ? (
                            <div className="empty" style={{ marginTop: 40 }}>
                                <h3>Belum ada cabang dibuka</h3>
                                <p className="muted">Pantau halaman ini atau hubungi panitia untuk info terbaru.</p>
                            </div>
                        ) : (
                            <div className="bento">
                                {competitions.slice(0, 5).map((c, i) => {
                                    const full = c.status === 'Kuota penuh';
                                    const cls = full ? 'k k--ink' : `k ${BENTO[i] ?? ''}`.trim();

                                    return (
                                        <Link key={c.id} className={cls} href="/portal">
                                            <span className="n">{String(i + 1).padStart(2, '0')}</span>
                                            <h3>{c.name}</h3>
                                            <p>{c.category}</p>
                                            <div className="meta">
                                                <span>{c.level_label ?? c.level}</span>
                                                <span className="pill">{full ? 'Penuh' : rupiah(c.fee)}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <section className="sec" id="jadwal" style={{ paddingTop: 0 }}>
                    <div className="wrap">
                        <span className="kicker">Jadwal</span>
                        <h2>Tiga tanggal yang perlu dicatat.</h2>
                        <div className="steps">
                            {competitions.slice(0, 3).map((c) => (
                                <div className="step" key={c.id}>
                                    <small>{c.level_label ?? 'Pendaftaran'}</small>
                                    <h3>{c.name}</h3>
                                    <p>
                                        Buka {tanggal(c.opens_at)} · Tutup {tanggal(c.closes_at)}
                                    </p>
                                </div>
                            ))}
                            {competitions.length === 0 && (
                                <div className="step">
                                    <small>Pendaftaran online</small>
                                    <h3>Segera diumumkan</h3>
                                    <p>Jadwal buka–tutup pendaftaran akan tampil di sini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="sec dark" id="alur">
                    <div className="wrap">
                        <span className="kicker">Alur pendaftaran</span>
                        <h2>Dari akun sampai piagam.</h2>
                        <ol className="flow">
                            <li>
                                <b>01</b>
                                <h3>Buat akun</h3>
                                <p>Daftar dengan email dan lengkapi profil peserta.</p>
                            </li>
                            <li>
                                <b>02</b>
                                <h3>Pilih cabang</h3>
                                <p>Pilih lomba, isi data peserta atau tim sebelum kuota penuh.</p>
                            </li>
                            <li>
                                <b>03</b>
                                <h3>Verifikasi</h3>
                                <p>Panitia memeriksa berkas dan menyetujui pendaftaran.</p>
                            </li>
                            <li>
                                <b>04</b>
                                <h3>Bertanding</h3>
                                <p>Ikuti lomba, lihat nilai dan peringkat, unduh sertifikat.</p>
                            </li>
                        </ol>
                    </div>
                </section>

                <section className="sec" id="faq">
                    <div className="wrap">
                        <span className="kicker">Pertanyaan umum</span>
                        <h2>Sebelum kamu mendaftar.</h2>
                        <div className="faq">
                            {faqs.map((f, i) => (
                                <details key={f.q} open={i === 0}>
                                    <summary>{f.q}</summary>
                                    <p>{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="sec" id="daftar" style={{ paddingTop: 0 }}>
                    <div className="wrap">
                        <div className="cta">
                            <h2>Siap ikut Bumifest?</h2>
                            <p>Buat akun, pilih cabang, dan tunggu konfirmasi panitia.</p>
                            <div className="row">
                                <Link className="btn" href={can_login ? route('register') : '/dashboard'}>
                                    Buat akun peserta →
                                </Link>
                                <a className="btn btn--ghost" href="#lomba">
                                    Tanya cabang dulu
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="wrap">
                    <div className="foot">
                        <div>
                            <Link className="logo" href="/" style={{ color: 'var(--paper)' }}>
                                <i aria-hidden="true" />
                                bumifest
                            </Link>
                            <p style={{ marginTop: 12, maxWidth: '34ch' }}>
                                Aplikasi web perlombaan: pendaftaran, penilaian, dan pengumuman hasil dalam satu tempat.
                            </p>
                        </div>
                        <div>
                            <h3>Jelajahi</h3>
                            <ul>
                                <li>
                                    <a href="#lomba">Cabang lomba</a>
                                </li>
                                <li>
                                    <a href="#jadwal">Jadwal</a>
                                </li>
                                <li>
                                    <a href="#faq">FAQ</a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3>Peserta</h3>
                            <ul>
                                <li>
                                    <Link href={route('login')}>Masuk</Link>
                                </li>
                                <li>
                                    <Link href={route('register')}>Buat akun</Link>
                                </li>
                                <li>
                                    <a href="#alur">Alur pendaftaran</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="big" aria-hidden="true">
                        bumifest
                    </div>
                    <p className="copy">© 2027 {event_name} · by Bumi Production</p>
                </div>
            </footer>
        </>
    );
}
