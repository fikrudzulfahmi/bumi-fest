import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Suspense } from 'react';

interface Props {
    competition: Record<string, unknown>;
    levels: Array<{ value: string; label: string }>;
}

export default function Edit({ competition, levels }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Edit Lomba</h1>}>
            <Head title="Edit Lomba" />

            <div className="max-w-2xl mx-auto p-4">
                <p className="text-gray-600">Edit form untuk {(competition as Record<string, any>).name}</p>
            </div>
        </AuthenticatedLayout>
    );
}
