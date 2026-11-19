import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatTanggalWaktu } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

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
    const cards = [
        { label: 'Pendaftar aktif', value: metrics.registrations_total, hint: `${metrics.registrations_verified} terverifikasi` },
        { label: 'Pembayaran masuk', value: rupiah(metrics.payments_received), hint: `${metrics.payments_count} tagihan terbayar` },
        { label: 'Tanpa kode unik', value: rupiah(metrics.payments_received_net), hint: 'subtotal bersih' },
        { label: 'Menunggu verifikasi', value: metrics.awaiting_verification, hint: 'perlu ditinjau' },
        { label: 'Hampir jatuh tempo', value: metrics.invoices_near_due, hint: 'dalam 24 jam' },
        { label: 'Lembaga', value: metrics.institutions_total, hint: `${metrics.users_total} akun terdaftar` },
    ];

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Dasbor Panitia</h1>}>
            <Head title="Dasbor Panitia" />

            <div className="mx-auto max-w-6xl space-y-5 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.label} className="rounded border border-gray-200 bg-white p-4">
                            <p className="text-xs text-gray-500">{card.label}</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-400">{card.hint}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-800">Pendaftar per lomba</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                    <th className="px-4 py-2">Lomba</th>
                                    <th className="px-4 py-2">Jenjang</th>
                                    <th className="px-4 py-2">Pendaftar</th>
                                    <th className="px-4 py-2">Kuota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perCompetition.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                            Belum ada pendaftar.
                                        </td>
                                    </tr>
                                )}
                                {perCompetition.map((row) => (
                                    <tr key={row.id} className="border-t border-gray-100">
                                        <td className="px-4 py-2">{row.name}</td>
                                        <td className="px-4 py-2 uppercase text-gray-600">{row.level}</td>
                                        <td className="px-4 py-2 font-medium">{row.registrations_count}</td>
                                        <td className="px-4 py-2 text-gray-600">{row.quota ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-800">Tagihan hampir jatuh tempo</h2>
                        <Link href={route('admin.payments.index')} className="text-xs text-blue-600 hover:underline">
                            Buka antrean pembayaran
                        </Link>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {nearDueInvoices.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada tagihan mendesak.</li>
                        )}
                        {nearDueInvoices.map((invoice) => (
                            <li key={invoice.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                <div>
                                    <p className="font-medium text-gray-800">{invoice.number}</p>
                                    <p className="text-xs text-gray-500">{invoice.owner ?? '—'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{rupiah(invoice.total)}</p>
                                    <p className="text-xs text-gray-500">
                                        {invoice.due_at ? formatTanggalWaktu(invoice.due_at) : '—'}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-gray-400">Data dihitung {formatTanggalWaktu(generatedAt)}.</p>
            </div>
        </AuthenticatedLayout>
    );
}
