import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';

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

const badge: Record<string, string> = {
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    gray: 'bg-gray-100 text-gray-600 ring-gray-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Index({ invoices }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Tagihan Saya</h1>}>
            <Head title="Tagihan Saya" />

            <div className="mx-auto max-w-5xl space-y-3 p-4">
                {invoices.length === 0 && <p className="text-gray-500">Belum ada tagihan.</p>}

                {invoices.map((invoice) => (
                    <Link
                        key={invoice.id}
                        href={route('invoices.show', invoice.id)}
                        className="block rounded border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-sm font-medium">{invoice.number}</span>
                            <span
                                className={`rounded px-2 py-0.5 text-xs ring-1 ${
                                    badge[invoice.status_color] ?? badge.gray
                                }`}
                            >
                                {invoice.status_label}
                            </span>
                            {invoice.has_proof && (
                                <span className="text-xs text-gray-500">Bukti terunggah</span>
                            )}
                            <span className="ml-auto font-semibold">{formatRupiah(invoice.total)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>{invoice.registrations_count ?? 0} entri</span>
                            {invoice.due_at && (
                                <span className={invoice.is_overdue ? 'font-medium text-red-600' : ''}>
                                    Jatuh tempo {formatTanggalWaktu(invoice.due_at)}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
