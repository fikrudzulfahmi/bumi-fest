import Field from '@/Components/app/Field';
import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface Level {
    value: string;
    label: string;
}

type FormData = {
    level: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    fee: number;
    quota: string;
    team_min: string;
    team_max: string;
    opens_at: string;
    closes_at: string;
    submission_mode: string;
};

export default function Create({ levels }: { levels: Level[] }) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        level: '',
        name: '',
        slug: '',
        description: '',
        category: 'individual',
        fee: 0,
        quota: '',
        team_min: '',
        team_max: '',
        opens_at: '',
        closes_at: '',
        submission_mode: 'none',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.competitions.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Buat Lomba Baru</h1>
                </div>
            }
        >
            <Head title="Buat Lomba" />

            <FlashMessage />

            <form onSubmit={submit} className="stack" style={{ maxWidth: 760 }}>
                <fieldset className="fieldset">
                    <legend>Identitas lomba</legend>

                    <Field label="Jenjang" htmlFor="level" error={errors.level} required>
                        <select
                            id="level"
                            className="select"
                            value={data.level}
                            onChange={(e) => setData('level', e.target.value)}
                            aria-invalid={Boolean(errors.level)}
                        >
                            <option value="">Pilih jenjang</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Nama lomba" htmlFor="name" error={errors.name} required>
                        <input
                            id="name"
                            type="text"
                            className="input"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            aria-invalid={Boolean(errors.name)}
                        />
                    </Field>

                    <Field label="Slug" htmlFor="slug" error={errors.slug} hint="Dipakai di URL, huruf kecil dan tanda hubung" required>
                        <input
                            id="slug"
                            type="text"
                            className="input"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            aria-invalid={Boolean(errors.slug)}
                        />
                    </Field>

                    <Field label="Deskripsi" htmlFor="description" error={errors.description}>
                        <textarea
                            id="description"
                            rows={4}
                            className="textarea"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            aria-invalid={Boolean(errors.description)}
                        />
                    </Field>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Ketentuan peserta</legend>

                    <Field label="Kategori" htmlFor="category" error={errors.category} required>
                        <select
                            id="category"
                            className="select"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                        >
                            <option value="individual">Individu</option>
                            <option value="team">Tim</option>
                        </select>
                    </Field>

                    <Field label="Biaya pendaftaran (Rp)" htmlFor="fee" error={errors.fee} hint="Isi 0 bila gratis">
                        <input
                            id="fee"
                            type="number"
                            className="input"
                            value={data.fee}
                            onChange={(e) => setData('fee', Number(e.target.value))}
                            aria-invalid={Boolean(errors.fee)}
                        />
                    </Field>
                </fieldset>

                <fieldset className="fieldset">
                    <legend>Jadwal</legend>

                    <div className="row-gap" style={{ gap: 16 }}>
                        <div style={{ flex: '1 1 240px' }}>
                            <Field label="Dibuka" htmlFor="opens_at" error={errors.opens_at} required>
                                <input
                                    id="opens_at"
                                    type="datetime-local"
                                    className="input"
                                    value={data.opens_at}
                                    onChange={(e) => setData('opens_at', e.target.value)}
                                    aria-invalid={Boolean(errors.opens_at)}
                                />
                            </Field>
                        </div>
                        <div style={{ flex: '1 1 240px' }}>
                            <Field label="Ditutup" htmlFor="closes_at" error={errors.closes_at} required>
                                <input
                                    id="closes_at"
                                    type="datetime-local"
                                    className="input"
                                    value={data.closes_at}
                                    onChange={(e) => setData('closes_at', e.target.value)}
                                    aria-invalid={Boolean(errors.closes_at)}
                                />
                            </Field>
                        </div>
                    </div>
                </fieldset>

                <div className="row-gap">
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Buat lomba'}
                    </button>
                    <a href={route('admin.competitions.index')} className="btn btn--ghost">
                        Batal
                    </a>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
