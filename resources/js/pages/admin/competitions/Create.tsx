import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Level {
    value: string;
    label: string;
}

interface Props {
    levels: Level[];
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

export default function Create({ levels }: Props) {
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

    const text = (key: keyof FormData) => ({
        value: String(data[key]),
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setData(key, e.target.value),
    });

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Buat Lomba Baru</h1>}>
            <Head title="Buat Lomba" />

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="level">Jenjang</InputLabel>
                        <select
                            id="level"
                            {...text('level')}
                            className="border border-gray-300 rounded px-3 py-2 w-full min-h-[44px]"
                        >
                            <option value="">Pilih Jenjang</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.level} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="name">Nama Lomba</InputLabel>
                        <TextInput id="name" type="text" className="w-full" {...text('name')} />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="slug">Slug</InputLabel>
                        <TextInput id="slug" type="text" className="w-full" {...text('slug')} />
                        <InputError message={errors.slug} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="description">Deskripsi</InputLabel>
                        <textarea
                            id="description"
                            rows={4}
                            {...text('description')}
                            className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="category">Kategori</InputLabel>
                        <select
                            id="category"
                            {...text('category')}
                            className="border border-gray-300 rounded px-3 py-2 w-full min-h-[44px]"
                        >
                            <option value="individual">Individu</option>
                            <option value="team">Tim</option>
                        </select>
                        <InputError message={errors.category} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="fee">Biaya Pendaftaran (Rp)</InputLabel>
                        <TextInput
                            id="fee"
                            type="number"
                            className="w-full"
                            value={data.fee}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('fee', Number(e.target.value))}
                        />
                        <InputError message={errors.fee} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="opens_at">Dibuka</InputLabel>
                            <TextInput id="opens_at" type="datetime-local" className="w-full" {...text('opens_at')} />
                            <InputError message={errors.opens_at} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="closes_at">Ditutup</InputLabel>
                            <TextInput id="closes_at" type="datetime-local" className="w-full" {...text('closes_at')} />
                            <InputError message={errors.closes_at} className="mt-2" />
                        </div>
                    </div>

                    <PrimaryButton disabled={processing}>Buat Lomba</PrimaryButton>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
