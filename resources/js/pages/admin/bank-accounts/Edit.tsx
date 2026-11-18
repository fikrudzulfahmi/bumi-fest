import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface BankAccount {
    id: number;
    bank_name: string;
}

interface Props {
    account: BankAccount;
}

export default function Edit({ account }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Edit Rekening</h1>}>
            <Head title="Edit Rekening" />

            <div className="max-w-2xl mx-auto p-4">
                <p className="text-gray-600">Form edit untuk {account.bank_name}</p>
            </div>
        </AuthenticatedLayout>
    );
}
