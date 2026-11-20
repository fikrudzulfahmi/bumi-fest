import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatTanggalWaktu } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Receipt, Trophy } from 'lucide-react';

interface Metrics {
    registrations_total: number;
    registrations_verified: number;
    payments_received: number;
    payments_received_net: number;
    payments_count: number;
    awaiting_verification: number;
    invoices_near_due: number;
    institutions_total: number;
    users_total: number;
}

interface CompetitionRow {
    id: number;
    name: string;
    level: string;
    level_label?: string | null;
    quota: number | null;
    registrations_count: number;
}

interface NearDueInvoice {
    id: number;
    number: string;
    total: number;
    due_at: string | null;
    owner: string | null;
}

interface Props {
    metrics: Metrics;
    perCompetition: CompetitionRow[];
    nearDueInvoices: NearDueInvoice[];
    generatedAt: string;
}

const rupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export default function Dashboard({ metrics, perCompetition, nearDueInvoices, generatedAt }: Props) {
    const cards: Array<{ label: string; value: string; hint: string; money?: boolean }> = [
        {
            label: 'Pendaftar aktif',
            value: String(metrics.registrations_total),
            hint: `${metrics.registrations_verified} terverifikasi`,
        },
        {
            label: 'Pembayaran masuk',
            value: rupiah(metrics.payments_received),
            hint: `${metrics.payments_count} tagihan terbayar`,
            money: true,
        },
        {
            label: 'Tanpa kode unik',
            value: rupiah(metrics.payments_received_net),
            hint: 'subtotal bersih',
            money: true,
        },
        { label: 'Menunggu verifikasi', value: String(metrics.awaiting_verification), hint: 'perlu ditinjau' },
        { label: 'Hampir jatuh tempo', value: String(metrics.invoices_near_due), hint: 'dalam 24 jam' },
        {
            label: 'Lembaga',
            value: String(metrics.institutions_total),
            hint: `${metrics.users_total} akun terdaftar`,
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Dasbor Panitia</h1>
                </div>
            }
        >
            <Head title="Dasbor Panitia" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    Ringkasan pendaftaran dan pembayaran Bumifest.
                </p>
                <Link href={route('admin.payments.index')} className="btn btn--clay btn--sm">
                    <Receipt size={16} aria-hidden />
                    Antrean pembayaran
                </Link>
            </div>

            <div className="stat-grid">
                {cards.map((card) => (
                    <div className="stat" key={card.label}>
                        <b
                            style={
                                card.money
                                    ? { fontFamily: 'var(--D)', fontSize: 'clamp(1.15rem, 2vw, 1.5rem)', lineHeight: 1.2 }
                                    : undefined
                            }
                        >
                            {card.value}
                        </b>
                        <span>{card.label}</span>
                        <small className="muted">{card.hint}</small>
                    </div>
                ))}
            </div>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Sebaran peserta</span>
                        <h2>Pendaftar per lomba</h2>
                        <p className="muted">Jumlah entri yang masuk pada setiap cabang lomba.</p>
                    </div>
                    <Link href={route('admin.registrations.index')} className="btn btn--ghost btn--sm">
                        <Trophy size={16} aria-hidden />
                        Semua pendaftaran
                    </Link>
                </div>

                {perCompetition.length === 0 ? (
                    <EmptyState
                        title="Belum ada pendaftar"
                        description="Entri peserta akan muncul di sini setelah pendaftaran dibuka."
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Lomba</th>
                                    <th>Jenjang</th>
                                    <th>Pendaftar</th>
                                    <th>Kuota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perCompetition.map((row) => {
                                    const full = row.quota !== null && row.registrations_count >= row.quota;

                                    return (
                                        <tr key={row.id}>
                                            <td data-label="Lomba" className="strong">
                                                {row.name}
                                            </td>
                                            <td data-label="Jenjang">
                                                <span className="tag">{row.level_label ?? row.level}</span>
                                            </td>
                                            <td data-label="Pendaftar" className="num strong">
                                                {row.registrations_count}
                                            </td>
                                            <td data-label="Kuota" className="num">
                                                {row.quota ?? '—'}
                                                {full && (
                                                    <span className="badge badge--bad" style={{ marginLeft: 8 }}>
                                                        Penuh
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Perlu ditindaklanjuti</span>
                        <h2>Tagihan hampir jatuh tempo</h2>
                        <p className="muted">Tagihan yang jatuh tempo dalam 24 jam ke depan.</p>
                    </div>
                    <Link href={route('admin.payments.index')} className="btn btn--ghost btn--sm">
                        Buka antrean
                        <ArrowRight size={16} aria-hidden />
                    </Link>
                </div>

                {nearDueInvoices.length === 0 ? (
                    <EmptyState title="Tidak ada tagihan mendesak" description="Semua tagihan masih dalam batas waktu." />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Tagihan</th>
                                    <th>Pemilik</th>
                                    <th>Jumlah</th>
                                    <th>Jatuh tempo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nearDueInvoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td data-label="Tagihan" className="strong tnum">
                                            {invoice.number}
                                        </td>
                                        <td data-label="Pemilik">{invoice.owner ?? '—'}</td>
                                        <td data-label="Jumlah" className="num nowrap">
                                            {rupiah(invoice.total)}
                                        </td>
                                        <td data-label="Jatuh tempo" className="nowrap">
                                            {invoice.due_at ? formatTanggalWaktu(invoice.due_at) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <p className="small muted">Data dihitung {formatTanggalWaktu(generatedAt)}.</p>
        </AuthenticatedLayout>
    );
}
