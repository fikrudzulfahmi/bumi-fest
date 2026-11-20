import { Head, Link } from '@inertiajs/react';
import { ShieldX } from 'lucide-react';

export default function NotFound() {
    return (
        <>
            <Head title="Verifikasi Sertifikat" />

            <div className="auth">
                <div className="auth__panel" style={{ textAlign: 'center' }}>
                    <Link href="/" className="auth__brand">
                        <span className="logo" style={{ fontSize: 24 }}>
                            <i aria-hidden="true" />
                            bumifest
                        </span>
                    </Link>

                    <span
                        aria-hidden="true"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'var(--clay-d)',
                            color: '#fff',
                            border: 'var(--line)',
                        }}
                    >
                        <ShieldX size={24} />
                    </span>

                    <h1 style={{ fontSize: '1.35rem', marginTop: 16 }}>Sertifikat tidak ditemukan</h1>
                    <p className="muted" style={{ marginTop: 10, fontSize: 15 }}>
                        Kode verifikasi tidak cocok dengan sertifikat mana pun. Periksa kembali kode yang
                        tertera pada sertifikat.
                    </p>

                    <div style={{ marginTop: 20 }}>
                        <Link href="/" className="btn btn--ghost btn--sm">
                            Kembali ke beranda
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
