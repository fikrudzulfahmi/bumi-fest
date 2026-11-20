import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { Paperclip, Receipt, Trophy } from 'lucide-react';

interface Invoice {
    id: number;
    number: string;
    total: number;
    status: string;
    status_label: string;
    status_color: string;
    due_at: string | null;
    is_overdue: boolean;
    has_proof: boolean;
    registrations_count?: number;
}

interface Props {
    invoices: Invoice[];
}

export default function Index({ invoices }: Props) {
    const unpaid = invoices.filter((invoice) => invoice.status === 'unpaid').length;

    return (
        <AuthenticatedLayout header={<h1>Tagihan Saya</h1>}>
            <Head title="Tagihan Saya" />

            <FlashMessage />

            <div className="stack">
                <div className="stat-grid">
                    <div className="stat">
                        <b>{invoices.length}</b>
                        <span>Total tagihan</span>
                    </div>
                    <div className="stat">
                        <b>{unpaid}</b>
                        <span>Belum dibayar</span>
                        <small>unggah bukti setelah transfer</small>
                    </div>
                    <div className="stat">
                        <b style={{ fontSize: '1.5rem' }}>
                            {formatRupiah(invoices.reduce((sum, invoice) => sum + invoice.total, 0))}
                        </b>
                        <span>Nilai keseluruhan</span>
                    </div>
                </div>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Pembayaran</span>
                            <h2>Daftar tagihan</h2>
                            <p className="muted">
                                Transfer sesuai total, lalu unggah bukti pada halaman detail agar panitia memverifikasi.
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('registrations.index')}>
                            <Trophy size={16} aria-hidden />
                            Lihat pendaftaran
                        </Link>
                    </div>

                    {invoices.length === 0 ? (
                        <EmptyState
                            title="Belum ada tagihan"
                            description="Tagihan terbit otomatis setelah Anda mengirim pendaftaran lomba."
                            action={
                                <Link className="btn btn--sm" href={route('portal.index')}>
                                    Cari cabang lomba
                                </Link>
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Nomor</th>
                                        <th>Entri</th>
                                        <th>Jatuh tempo</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td data-label="Nomor">
                                                <span className="tnum strong">{invoice.number}</span>
                                                {invoice.has_proof && (
                                                    <span className="small muted" style={{ display: 'block' }}>
                                                        <Paperclip size={12} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                                        Bukti terunggah
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Entri" className="num nowrap">
                                                {invoice.registrations_count ?? 0} entri
                                            </td>
                                            <td data-label="Jatuh tempo" className="nowrap">
                                                {invoice.due_at ? (
                                                    <span className={invoice.is_overdue ? 'small strong' : 'small'}>
                                                        {formatTanggalWaktu(invoice.due_at)}
                                                        {invoice.is_overdue && (
                                                            <span className="badge badge--bad" style={{ marginLeft: 8 }}>
                                                                Lewat
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="muted">—</span>
                                                )}
                                            </td>
                                            <td data-label="Status">
                                                <StatusBadge value={invoice.status} label={invoice.status_label} />
                                            </td>
                                            <td data-label="Total" className="num nowrap strong">
                                                {formatRupiah(invoice.total)}
                                            </td>
                                            <td data-label="Aksi">
                                                <Link
                                                    className="btn btn--clay btn--sm"
                                                    href={route('invoices.show', invoice.id)}
                                                >
                                                    <Receipt size={16} aria-hidden />
                                                    Buka
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
