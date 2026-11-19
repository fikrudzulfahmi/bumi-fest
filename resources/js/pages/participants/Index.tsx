import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';

interface Participant {
    id: number;
    name: string;
    grade: number;
    level: string;
    school_name: string;
    school_city: string | null;
    has_active_registration: boolean;
}

interface Props {
    participants: Participant[];
}

export default function Index({ participants }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Hapus siswa ini?')) {
            router.delete(route('participants.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Daftar Siswa</h1>}>
            <Head title="Daftar Siswa" />

            <div className="max-w-4xl mx-auto p-4">
                <div className="mb-6 text-sm text-gray-500">
                    Daftar siswa Anda. Tambah/edit form siswa akan dilengkapi pada sesi form penuh.
                </div>

                <table className="min-w-full border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Nama</th>
                            <th className="px-4 py-2 text-left">Kelas</th>
                            <th className="px-4 py-2 text-left">Sekolah</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p) => (
                            <tr key={p.id} className="border-t">
                                <td className="px-4 py-2">{p.name}</td>
                                <td className="px-4 py-2">{p.grade}</td>
                                <td className="px-4 py-2">{p.school_name}</td>
                                <td className="px-4 py-2">
                                    {p.has_active_registration ? (
                                        <span className="text-green-600">Pendaftaran aktif</span>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <DangerButton onClick={() => handleDelete(p.id)}>Hapus</DangerButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
