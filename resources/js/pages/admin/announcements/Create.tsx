import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Props {
    levels: Array<{ value: string; label: string }>;
}

export default function Create({ levels }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        level: '',
        title: '',
        body: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.announcements.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Tambah Pengumuman</h1>}>
            <Head title="Tambah Pengumuman" />

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="level">Jenjang</InputLabel>
                        <select
                            id="level"
                            value={data.level}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('level', e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full min-h-[44px]"
                        >
                            <option value="">Umum (semua jenjang)</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                        <InputError message={errors.level} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="title">Judul</InputLabel>
                        <TextInput
                            id="title"
                            type="text"
                            className="w-full"
                            value={data.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="body">Isi</InputLabel>
                        <textarea
                            id="body"
                            rows={5}
                            value={data.body}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('body', e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                        <InputError message={errors.body} className="mt-2" />
                    </div>

                    <PrimaryButton disabled={processing}>Simpan Pengumuman</PrimaryButton>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
