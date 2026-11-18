import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface SettingsData {
    event_name: string;
    contact_whatsapp: string;
    contact_email: string;
    payment_due_hours: number;
    max_competitions_per_participant: number | null;
    import_max_rows: number;
}

interface Props {
    settings: SettingsData;
}

export default function Edit({ settings }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        event_name: settings.event_name,
        contact_whatsapp: settings.contact_whatsapp,
        contact_email: settings.contact_email,
        payment_due_hours: settings.payment_due_hours,
        max_competitions_per_participant: settings.max_competitions_per_participant ?? '',
        import_max_rows: settings.import_max_rows,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Pengaturan</h1>}>
            <Head title="Pengaturan" />

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="event_name">Nama Acara</InputLabel>
                        <TextInput
                            id="event_name"
                            type="text"
                            className="w-full"
                            value={data.event_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('event_name', e.target.value)}
                        />
                        <InputError message={errors.event_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="contact_whatsapp">WhatsApp Panitia</InputLabel>
                        <TextInput
                            id="contact_whatsapp"
                            type="text"
                            className="w-full"
                            value={data.contact_whatsapp}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('contact_whatsapp', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: 62xxxxxxxxxx</p>
                        <InputError message={errors.contact_whatsapp} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="contact_email">Email Panitia</InputLabel>
                        <TextInput
                            id="contact_email"
                            type="email"
                            className="w-full"
                            value={data.contact_email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('contact_email', e.target.value)}
                        />
                        <InputError message={errors.contact_email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="payment_due_hours">Batas Bayar (jam)</InputLabel>
                        <TextInput
                            id="payment_due_hours"
                            type="number"
                            className="w-full"
                            value={data.payment_due_hours}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('payment_due_hours', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">1–720 jam</p>
                        <InputError message={errors.payment_due_hours} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="max_competitions_per_participant">Maks. Lomba per Peserta</InputLabel>
                        <TextInput
                            id="max_competitions_per_participant"
                            type="number"
                            className="w-full"
                            value={data.max_competitions_per_participant}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('max_competitions_per_participant', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Kosongkan untuk tanpa batas</p>
                        <InputError message={errors.max_competitions_per_participant} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="import_max_rows">Maks. Baris Impor</InputLabel>
                        <TextInput
                            id="import_max_rows"
                            type="number"
                            className="w-full"
                            value={data.import_max_rows}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('import_max_rows', Number(e.target.value))}
                        />
                        <InputError message={errors.import_max_rows} className="mt-2" />
                    </div>

                    <PrimaryButton disabled={processing}>Simpan Pengaturan</PrimaryButton>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
