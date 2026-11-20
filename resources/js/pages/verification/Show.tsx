import { Head, Link } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';

interface Props {
    name: string | null;
    competition: string | null;
    type: string;
    type_label: string;
    placement: number | null;
    number: string;
    generated_at: string | null;
}

export default function Show({ name, competition, type_label, placement, number, generated_at }: Props) {
    const rows = [
        { label: 'Nama', value: name ?? '—' },
        { label: 'Lomba', value: competition ?? '—' },
        { label: 'Jenis', value: `${type_label}${placement !== null ? ` (Juara ${placement})` : ''}` },
        { label: 'Nomor sertifikat', value: number },
        { label: 'Tanggal terbit', value: generated_at ?? '—' },
    ];

    return (
        <>
            <Head title="Verifikasi Sertifikat" />

            <div className="auth">
                <div className="auth__panel">
                    <Link href="/" className="auth__brand">
                        <span className="logo" style={{ fontSize: 24 }}>
                            <i aria-hidden="true" />
                            bumifest
                        </span>
                    </Link>

                    <div className="row-gap" style={{ gap: 12, marginBottom: 20 }}>
                        <span
                            aria-hidden="true"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'var(--moss)',
                                color: '#fff',
                                border: 'var(--line)',
                                flex: 'none',
                            }}
                        >
                            <BadgeCheck size={22} />
                        </span>
                        <div>
                            <h1 style={{ fontSize: '1.35rem' }}>Sertifikat sah</h1>
                            <p className="small muted">Terverifikasi oleh panitia Bumifest</p>
                        </div>
                    </div>

                    <div className="table-wrap" style={{ boxShadow: 'none' }}>
                        <table className="data" style={{ minWidth: 0 }}>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.label}>
                                        <td data-label="Kolom" className="muted small">
                                            {row.label}
                                        </td>
                                        <td data-label="Nilai" className="strong" style={{ textAlign: 'right' }}>
                                            {row.value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="small muted" style={{ marginTop: 16, textAlign: 'center' }}>
                        Halaman ini menampilkan data minimal untuk memeriksa keaslian sertifikat.
                    </p>
                </div>
            </div>
        </>
    );
}
