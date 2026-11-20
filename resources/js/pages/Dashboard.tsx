import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { FileText, Receipt, ShieldCheck, Trophy, UserRound, Users } from 'lucide-react';
import { ReactNode } from 'react';

interface Shortcut {
    href: string;
    label: string;
    description: string;
    icon: ReactNode;
}

export default function Dashboard() {
    const user = (usePage().props as { auth?: { user?: { name: string } | null } }).auth?.user;

    const shortcuts: Shortcut[] = [
        {
            href: route('portal.index'),
            label: 'Portal lomba',
            description: 'Lihat cabang lomba yang dibuka pada jenjang Anda.',
            icon: <Trophy size={20} aria-hidden />,
        },
        {
            href: route('registrations.index'),
            label: 'Pendaftaran saya',
            description: 'Pantau status entri, dokumen, dan kode pendaftaran.',
            icon: <FileText size={20} aria-hidden />,
        },
        {
            href: route('invoices.index'),
            label: 'Tagihan',
            description: 'Bayar biaya pendaftaran dan unggah bukti transfer.',
            icon: <Receipt size={20} aria-hidden />,
        },
        {
            href: route('participants.index'),
            label: 'Data siswa',
            description: 'Kelola daftar siswa yang akan diikutkan lomba.',
            icon: <Users size={20} aria-hidden />,
        },
        {
            href: '/sertifikat',
            label: 'Sertifikat',
            description: 'Unduh piagam partisipasi atau juara dalam bentuk PDF.',
            icon: <ShieldCheck size={20} aria-hidden />,
        },
        {
            href: route('profile.edit'),
            label: 'Profil akun',
            description: 'Perbarui nama, email, dan kata sandi akun Anda.',
            icon: <UserRound size={20} aria-hidden />,
        },
    ];

    return (
        <AuthenticatedLayout header={<h1>Dasbor Peserta</h1>}>
            <Head title="Dasbor" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <span className="tag">Selamat datang</span>
                    <h2 style={{ marginTop: 12 }}>Halo, {user?.name ?? 'Peserta'}.</h2>
                    <p className="muted" style={{ marginTop: 8, maxWidth: '60ch' }}>
                        Semua urusan lomba ada di satu tempat: pilih cabang, lengkapi data siswa, bayar tagihan, lalu
                        pantau hasil dan sertifikat Anda.
                    </p>
                    <div className="row-gap" style={{ marginTop: 18 }}>
                        <Link className="btn btn--clay" href={route('portal.index')}>
                            Buka portal lomba
                        </Link>
                        <Link className="btn btn--ghost" href={route('registrations.index')}>
                            Cek pendaftaran
                        </Link>
                    </div>
                </section>

                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {shortcuts.map((shortcut) => (
                        <Link key={shortcut.href} className="panel" href={shortcut.href}>
                            <span style={{ display: 'inline-flex', color: 'var(--clay)' }} aria-hidden="true">
                                {shortcut.icon}
                            </span>
                            <h3 style={{ marginTop: 10, fontSize: '1.15rem' }}>{shortcut.label}</h3>
                            <p className="small muted" style={{ marginTop: 6 }}>
                                {shortcut.description}
                            </p>
                        </Link>
                    ))}
                </div>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Alur peserta</span>
                            <h3>Empat langkah sampai piagam.</h3>
                        </div>
                    </div>

                    <div className="steps" style={{ marginTop: 8 }}>
                        <div className="step">
                            <small>Langkah 01</small>
                            <h3>Lengkapi data siswa</h3>
                            <p>Tambahkan nama, kelas, dan sekolah sebelum mendaftarkan cabang lomba.</p>
                        </div>
                        <div className="step">
                            <small>Langkah 02</small>
                            <h3>Daftar cabang lomba</h3>
                            <p>Pilih cabang dari portal, tentukan anggota tim bila lombanya beregu.</p>
                        </div>
                        <div className="step">
                            <small>Langkah 03</small>
                            <h3>Bayar &amp; unggah bukti</h3>
                            <p>Transfer sesuai total tagihan, lalu unggah bukti agar panitia memverifikasi.</p>
                        </div>
                        <div className="step">
                            <small>Langkah 04</small>
                            <h3>Bertanding &amp; unduh piagam</h3>
                            <p>Ikuti lomba, lihat pengumuman juara, dan unduh sertifikat dari menu sertifikat.</p>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
