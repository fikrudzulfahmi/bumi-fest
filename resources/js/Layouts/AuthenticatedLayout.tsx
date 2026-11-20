import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    FileText,
    Gavel,
    History,
    LayoutDashboard,
    LogOut,
    Receipt,
    Settings,
    ShieldCheck,
    Trophy,
    UserRound,
    Users,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

interface NavItem {
    href: string;
    label: string;
    active: boolean;
    icon: ReactNode;
}

export default function Authenticated({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const page = usePage();
    const user = page.props.auth.user;
    const current = (pattern: string) => Boolean(route().current(pattern));
    const [open, setOpen] = useState(false);

    const dashHref =
        user.role === 'admin'
            ? route('admin.dashboard')
            : user.role === 'judge'
              ? route('judge.dashboard')
              : route('dashboard');

    const participantNav: NavItem[] = [
        { href: route('dashboard'), label: 'Dasbor', active: current('dashboard'), icon: <LayoutDashboard size={18} /> },
        { href: route('portal.index'), label: 'Portal Lomba', active: current('portal.*'), icon: <Trophy size={18} /> },
        { href: route('registrations.index'), label: 'Pendaftaran Saya', active: current('registrations.*'), icon: <FileText size={18} /> },
        { href: route('invoices.index'), label: 'Tagihan', active: current('invoices.*'), icon: <Receipt size={18} /> },
        { href: '/sertifikat', label: 'Sertifikat', active: current('certificates.*'), icon: <ShieldCheck size={18} /> },
        { href: route('participants.index'), label: 'Data Siswa', active: current('participants.*'), icon: <Users size={18} /> },
    ];

    const adminNav: NavItem[] = [
        { href: route('admin.dashboard'), label: 'Dasbor', active: current('admin.dashboard'), icon: <LayoutDashboard size={18} /> },
        { href: route('admin.registrations.index'), label: 'Pendaftaran', active: current('admin.registrations.*'), icon: <FileText size={18} /> },
        { href: route('admin.payments.index'), label: 'Pembayaran', active: current('admin.payments.*'), icon: <Receipt size={18} /> },
        { href: route('admin.competitions.index'), label: 'Lomba', active: current('admin.competitions.*'), icon: <Trophy size={18} /> },
        { href: route('admin.institutions.index'), label: 'Lembaga', active: current('admin.institutions.*'), icon: <Users size={18} /> },
        { href: route('admin.users.index'), label: 'Pengguna', active: current('admin.users.*'), icon: <UserRound size={18} /> },
        {
            href: route('admin.judges.index'),
            label: 'Juri & Rubrik',
            active: current('admin.judges.*') || current('admin.rubrics.*'),
            icon: <Gavel size={18} />,
        },
        { href: route('admin.logs.index'), label: 'Riwayat', active: current('admin.logs.*'), icon: <History size={18} /> },
        { href: route('admin.settings.edit'), label: 'Pengaturan', active: current('admin.settings.*'), icon: <Settings size={18} /> },
        {
            href: route('admin.announcements.index'),
            label: 'Pengumuman',
            active: current('admin.announcements.*'),
            icon: <CalendarDays size={18} />,
        },
    ];

    const judgeNav: NavItem[] = [
        { href: route('judge.dashboard'), label: 'Dasbor Juri', active: current('judge.*'), icon: <LayoutDashboard size={18} /> },
    ];

    const items = user.role === 'admin' ? adminNav : user.role === 'judge' ? judgeNav : participantNav;

    return (
        <div className="app">
            <a href="#konten" className="skip-link">
                Lewati ke konten
            </a>

            <aside className={`side${open ? ' is-open' : ''}`} aria-label="Navigasi utama">
                <div className="side__brand">
                    <Link href="/" className="logo" style={{ fontSize: 20 }}>
                        <i aria-hidden="true" />
                        bumifest
                    </Link>
                </div>

                <nav className="stack-sm" style={{ gap: 4 }}>
                    {items.map((item) => (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={`side__link${item.active ? ' is-active' : ''}`}
                            aria-current={item.active ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                        >
                            <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none' }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="side__foot">
                    <Link href={route('profile.edit')} className="side__link" style={{ padding: '6px 10px', minHeight: 40 }}>
                        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                            <UserRound size={16} />
                        </span>
                        Profil
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="side__link"
                        style={{ padding: '6px 10px', minHeight: 40, width: '100%', textAlign: 'left' }}
                    >
                        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                            <LogOut size={16} />
                        </span>
                        Keluar
                    </Link>
                </div>
            </aside>

            <div className="main-area">
                <div className="topbar">
                    <div className="row-gap" style={{ gap: 12 }}>
                        <button
                            type="button"
                            className="burger"
                            style={{ display: 'grid' }}
                            aria-expanded={open}
                            aria-controls="side-nav"
                            aria-label="Buka menu"
                            onClick={() => setOpen((v) => !v)}
                        >
                            {open ? '✕' : '☰'}
                        </button>
                        {header ?? <h1>Bumifest</h1>}
                    </div>

                    <div className="row-gap" style={{ gap: 10 }}>
                        <span className="badge badge--neutral">{user.role === 'admin' ? 'Panitia' : user.role === 'judge' ? 'Juri' : 'Peserta'}</span>
                        <span className="small strong">{user.name}</span>
                    </div>
                </div>

                <main id="konten" className="page">
                    {children}
                </main>
            </div>
        </div>
    );
}
