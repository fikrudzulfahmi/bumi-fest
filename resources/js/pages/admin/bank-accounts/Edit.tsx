import Field from '@/Components/app/Field';
import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface BankAccount {
    id: number;
    bank_name: string;
    account_number?: string;
    account_holder?: string;
    is_active?: boolean;
    sort?: number | null;
}

interface Props {
    account: BankAccount;
}

export default function Edit({ account }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        bank_name: account.bank_name ?? '',
        account_number: account.account_number ?? '',
        account_holder: account.account_holder ?? '',
        is_active: Boolean(account.is_active),
        sort: account.sort === null || account.sort === undefined ? '' : String(account.sort),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.bank-accounts.update', account.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Edit Rekening</h1>
                    <p className="muted small">{account.bank_name}</p>
                </div>
            }
        >
            <Head title="Edit Rekening" />

            <FlashMessage />

            <form onSubmit={submit} className="panel stack" style={{ maxWidth: 680 }}>
                <fieldset className="fieldset">
                    <legend>Data rekening</legend>

                    <Field label="Nama bank" htmlFor="bank_name" error={errors.bank_name} hint="mis. Bank Syariah Indonesia" required>
                        <input
                            id="bank_name"
                            type="text"
                            className="input"
                            value={data.bank_name}
                            onChange={(e) => setData('bank_name', e.target.value)}
                            aria-invalid={Boolean(errors.bank_name)}
                        />
                    </Field>

                    <Field
                        label="Nomor rekening"
                        htmlFor="account_number"
                        error={errors.account_number}
                        hint="Hanya angka dan tanda hubung"
                        required
                    >
                        <input
                            id="account_number"
                            type="text"
                            inputMode="numeric"
                            className="input"
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value)}
                            aria-invalid={Boolean(errors.account_number)}
                        />
                    </Field>

                    <Field label="Atas nama" htmlFor="account_holder" error={errors.account_holder} required>
                        <input
                            id="account_holder"
                            type="text"
                            className="input"
                            value={data.account_holder}
                            onChange={(e) => setData('account_holder', e.target.value)}
                            aria-invalid={Boolean(errors.account_holder)}
                        />
                    </Field>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Tampilan pada tagihan</legend>

                    <Field label="Urutan tampil" htmlFor="sort" error={errors.sort} hint="Angka kecil tampil lebih dulu (0–999)">
                        <input
                            id="sort"
                            type="number"
                            min={0}
                            max={999}
                            className="input"
                            value={data.sort}
                            onChange={(e) => setData('sort', e.target.value)}
                            aria-invalid={Boolean(errors.sort)}
                        />
                    </Field>

                    <label className="check">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                        />
                        <span>
                            Aktif
                            <span className="hint" style={{ display: 'block' }}>
                                Rekening nonaktif tidak ditampilkan pada tagihan peserta.
                            </span>
                        </span>
                    </label>
                </fieldset>

                <div className="row-gap">
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        <Save size={17} aria-hidden />
                        {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                    </button>
                    <Link href={route('admin.bank-accounts.index')} className="btn btn--ghost">
                        <ArrowLeft size={17} aria-hidden />
                        Kembali
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
