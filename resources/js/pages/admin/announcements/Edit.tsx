import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Props {
    announcement: Record<string, unknown>;
    levels: Array<{ value: string; label: string }>;
}

export default function Edit({ announcement, levels }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Edit Pengumuman</h1>}>
            <Head title="Edit Pengumuman" />

            <div className="max-w-2xl mx-auto p-4">
                <p className="text-gray-600">Form edit untuk {(announcement as { title?: string }).title}</p>
            </div>
        </AuthenticatedLayout>
    );
}
