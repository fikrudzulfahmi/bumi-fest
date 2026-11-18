import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Props {
    levels?: never[];
}

type FormData = {
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_active: boolean;
    sort: string;
};

export default function Create({ }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        bank_name: '',
        account_number: '',
        account_holder: '',
        is_active: true,
        sort: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.bank-accounts.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Tambah Rekening</h1>}>
            <Head title="Tambah Rekening" />

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="bank_name">Nama Bank</InputLabel>
                        <TextInput
                            id="bank_name"
                            type="text"
                            className="w-full"
                            value={data.bank_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('bank_name', e.target.value)}
                        />
                        <InputError message={errors.bank_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_number">Nomor Rekening</InputLabel>
                        <TextInput
                            id="account_number"
                            type="text"
                            className="w-full"
                            value={data.account_number}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('account_number', e.target.value)}
                        />
                        <InputError message={errors.account_number} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_holder">Atas Nama</InputLabel>
                        <TextInput
                            id="account_holder"
                            type="text"
                            className="w-full"
                            value={data.account_holder}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('account_holder', e.target.value)}
                        />
                        <InputError message={errors.account_holder} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="sort">Urutan</InputLabel>
                        <TextInput
                            id="sort"
                            type="number"
                            className="w-full"
                            value={data.sort}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('sort', e.target.value)}
                        />
                        <InputError message={errors.sort} className="mt-2" />
                    </div>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('is_active', e.target.checked)}
                                className="rounded"
                            />
                            <span>Aktif</span>
                        </label>
                    </div>

                    <PrimaryButton disabled={processing}>Simpan Rekening</PrimaryButton>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
