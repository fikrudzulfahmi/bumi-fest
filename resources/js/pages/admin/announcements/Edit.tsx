import Field from '@/Components/app/Field';
import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface Announcement {
    id: number;
    level: string | null;
    title: string;
    body: string;
    published_at: string | null;
}

export default function Edit({
    announcement,
    levels,
}: {
    announcement: Announcement;
    levels: Array<{ value: string; label: string }>;
}) {
    const { data, setData, put, processing, errors } = useForm({
        level: announcement.level ?? '',
        title: announcement.title,
        body: announcement.body,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.announcements.update', announcement.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Edit Pengumuman</h1>
                </div>
            }
        >
            <Head title="Edit Pengumuman" />

            <FlashMessage />

            <form onSubmit={submit} className="stack" style={{ maxWidth: 720 }}>
                <fieldset className="fieldset">
                    <legend>Isi pengumuman</legend>

                    <Field label="Jenjang" htmlFor="level" error={errors.level} hint="Pilih Umum agar tampil di semua jenjang">
                        <select id="level" className="select" value={data.level} onChange={(e) => setData('level', e.target.value)}>
                            <option value="">Umum (semua jenjang)</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Judul" htmlFor="title" error={errors.title} required>
                        <input
                            id="title"
                            type="text"
                            className="input"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            aria-invalid={Boolean(errors.title)}
                        />
                    </Field>

                    <Field label="Isi" htmlFor="body" error={errors.body} required>
                        <textarea
                            id="body"
                            rows={6}
                            className="textarea"
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            aria-invalid={Boolean(errors.body)}
                        />
                    </Field>
                </fieldset>

                <div className="row-gap">
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                    </button>
                    <a href={route('admin.announcements.index')} className="btn btn--ghost">
                        Batal
                    </a>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
