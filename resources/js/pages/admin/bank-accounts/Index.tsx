import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';

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
    const handleDelete = (id: number) => {
        if (confirm('Hapus rekening ini?')) {
            router.delete(route('admin.bank-accounts.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Kelola Rekening</h1>}>
            <Head title="Kelola Rekening" />

            <div className="max-w-4xl mx-auto p-4">
                <div className="mb-6">
                    <Link href={route('admin.bank-accounts.create')}>
                        <PrimaryButton>Tambah Rekening</PrimaryButton>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left">Bank</th>
                                <th className="px-4 py-2 text-left">Nomor Rekening</th>
                                <th className="px-4 py-2 text-left">Atas Nama</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.id} className="border-t">
                                    <td className="px-4 py-2">{account.bank_name}</td>
                                    <td className="px-4 py-2">{account.account_number}</td>
                                    <td className="px-4 py-2">{account.account_holder}</td>
                                    <td className="px-4 py-2">
                                        {account.is_active ? 'Aktif' : 'Nonaktif'}
                                    </td>
                                    <td className="px-4 py-2 space-x-2">
                                        <Link href={route('admin.bank-accounts.edit', account.id)} className="text-blue-600 hover:underline">
                                            Edit
                                        </Link>
                                        <DangerButton onClick={() => handleDelete(account.id)}>Hapus</DangerButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
