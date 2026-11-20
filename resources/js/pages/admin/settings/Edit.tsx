import Field from '@/Components/app/Field';
import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface SettingsData {
    event_name: string;
    contact_whatsapp: string;
    contact_email: string;
    payment_due_hours: number;
    max_competitions_per_participant: number | null;
    import_max_rows: number;
}

export default function Edit({ settings }: { settings: SettingsData }) {
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
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Pengaturan Acara</h1>
                </div>
            }
        >
            <Head title="Pengaturan" />

            <FlashMessage />

            <form onSubmit={submit} className="panel stack" style={{ maxWidth: 680 }}>
                <fieldset className="fieldset">
                    <legend>Identitas acara</legend>

                    <Field label="Nama acara" htmlFor="event_name" error={errors.event_name} required>
                        <input
                            id="event_name"
                            type="text"
                            className="input"
                            value={data.event_name}
                            onChange={(e) => setData('event_name', e.target.value)}
                            aria-invalid={Boolean(errors.event_name)}
                        />
                    </Field>

                    <Field
                        label="WhatsApp panitia"
                        htmlFor="contact_whatsapp"
                        error={errors.contact_whatsapp}
                        hint="Format: 62xxxxxxxxxx"
                        required
                    >
                        <input
                            id="contact_whatsapp"
                            type="text"
                            className="input"
                            value={data.contact_whatsapp}
                            onChange={(e) => setData('contact_whatsapp', e.target.value)}
                            aria-invalid={Boolean(errors.contact_whatsapp)}
                        />
                    </Field>

                    <Field label="Email panitia" htmlFor="contact_email" error={errors.contact_email} required>
                        <input
                            id="contact_email"
                            type="email"
                            className="input"
                            value={data.contact_email}
                            onChange={(e) => setData('contact_email', e.target.value)}
                            aria-invalid={Boolean(errors.contact_email)}
                        />
                    </Field>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Aturan pendaftaran</legend>

                    <Field
                        label="Batas waktu pembayaran (jam)"
                        htmlFor="payment_due_hours"
                        error={errors.payment_due_hours}
                        hint="1–720 jam sejak tagihan dibuat"
                        required
                    >
                        <input
                            id="payment_due_hours"
                            type="number"
                            className="input"
                            value={data.payment_due_hours}
                            onChange={(e) => setData('payment_due_hours', Number(e.target.value))}
                            aria-invalid={Boolean(errors.payment_due_hours)}
                        />
                    </Field>

                    <Field
                        label="Maksimal lomba per peserta"
                        htmlFor="max_competitions_per_participant"
                        error={errors.max_competitions_per_participant}
                        hint="Kosongkan bila tanpa batas"
                    >
                        <input
                            id="max_competitions_per_participant"
                            type="number"
                            className="input"
                            value={data.max_competitions_per_participant}
                            onChange={(e) => setData('max_competitions_per_participant', e.target.value)}
                            aria-invalid={Boolean(errors.max_competitions_per_participant)}
                        />
                    </Field>

                    <Field
                        label="Maksimal baris impor"
                        htmlFor="import_max_rows"
                        error={errors.import_max_rows}
                        hint="Batas jumlah baris saat pendaftaran kolektif"
                        required
                    >
                        <input
                            id="import_max_rows"
                            type="number"
                            className="input"
                            value={data.import_max_rows}
                            onChange={(e) => setData('import_max_rows', Number(e.target.value))}
                            aria-invalid={Boolean(errors.import_max_rows)}
                        />
                    </Field>
                </fieldset>

                <div>
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan pengaturan'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
