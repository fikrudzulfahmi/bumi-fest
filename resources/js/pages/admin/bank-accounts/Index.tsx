import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_active: boolean;
    sort: number;
}

interface Props {
    accounts: BankAccount[];
}

export default function Index({ accounts }: Props) {
    const [deleting, setDeleting] = useState<BankAccount | null>(null);
    const [busy, setBusy] = useState(false);

    const handleDelete = () => {
        if (!deleting) return;
        setBusy(true);
        router.delete(route('admin.bank-accounts.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                setDeleting(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Kelola Rekening</h1>
                    <p className="muted small">Rekening tujuan transfer yang tampil pada tagihan peserta.</p>
                </div>
            }
        >
            <Head title="Kelola Rekening" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {accounts.length} rekening terdaftar · {accounts.filter((a) => a.is_active).length} aktif
                </p>
                <Link href={route('admin.bank-accounts.create')} className="btn btn--clay btn--sm">
                    <Plus size={16} aria-hidden />
                    Tambah rekening
                </Link>
            </div>

            {accounts.length === 0 ? (
                <EmptyState
                    title="Belum ada rekening"
                    description="Tambahkan rekening agar peserta tahu ke mana harus mentransfer."
                    action={
                        <Link href={route('admin.bank-accounts.create')} className="btn btn--sm">
                            Tambah rekening
                        </Link>
                    }
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Bank</th>
                                <th>Nomor rekening</th>
                                <th>Atas nama</th>
                                <th>Urutan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.id}>
                                    <td data-label="Bank" className="strong">
                                        <span className="row-gap" style={{ gap: 8 }}>
                                            <Landmark size={15} aria-hidden />
                                            {account.bank_name}
                                        </span>
                                    </td>
                                    <td data-label="Nomor rekening" className="num nowrap">
                                        {account.account_number}
                                    </td>
                                    <td data-label="Atas nama">{account.account_holder}</td>
                                    <td data-label="Urutan" className="num small">
                                        {account.sort}
                                    </td>
                                    <td data-label="Status">
                                        {account.is_active ? (
                                            <span className="badge badge--ok">Aktif</span>
                                        ) : (
                                            <span className="badge badge--neutral">Nonaktif</span>
                                        )}
                                    </td>
                                    <td data-label="Aksi">
                                        <div className="row-gap" style={{ gap: 8 }}>
                                            <Link
                                                href={route('admin.bank-accounts.edit', account.id)}
                                                className="btn btn--ghost btn--sm"
                                            >
                                                <Pencil size={15} aria-hidden />
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn btn--danger btn--sm"
                                                onClick={() => setDeleting(account)}
                                            >
                                                <Trash2 size={15} aria-hidden />
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                show={deleting !== null}
                danger
                title="Hapus rekening?"
                message={
                    <p>
                        Rekening {deleting?.bank_name ?? ''} {deleting?.account_number ?? ''} atas nama{' '}
                        {deleting?.account_holder ?? ''} akan dihapus permanen dan tidak lagi tampil pada tagihan peserta.
                    </p>
                }
                confirmLabel="Ya, hapus"
                processing={busy}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </AuthenticatedLayout>
    );
}
