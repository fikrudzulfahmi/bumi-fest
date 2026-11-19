import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    whatsapp: string | null;
    role: string;
    role_label: string;
    is_active: boolean;
    institution: { id: number; name: string } | null;
    registrations_count: number;
}

interface Paginated {
    data: User[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}

interface Props {
    users: Paginated;
    filters: { role: string; q: string };
    roles: Array<{ value: string; label: string }>;
}

export default function Index({ users, filters, roles }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const [form, setForm] = useState(filters);
    const [target, setTarget] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);

    const apply = () => {
        router.get(route('admin.users.index'), { ...form }, { preserveState: true, replace: true });
    };

    const toggle = () => {
        if (!target) return;

        setBusy(true);
        router.post(
            route('admin.users.toggle-active', target.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setTarget(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Data Pengguna</h1>}>
            <Head title="Data Pengguna" />

            <div className="mx-auto max-w-6xl space-y-4 p-4">
                {flash?.success && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-white p-3">
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Cari</span>
                        <input
                            className="rounded border-gray-300 text-sm"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && apply()}
                            placeholder="nama / email / WhatsApp"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500">Peran</span>
                        <select
                            className="rounded border-gray-300 text-sm"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="">Semua</option>
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <PrimaryButton onClick={apply}>Terapkan</PrimaryButton>
                </div>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <th className="px-3 py-2">Nama</th>
                                <th className="px-3 py-2">Kontak</th>
                                <th className="px-3 py-2">Peran</th>
                                <th className="px-3 py-2">Lembaga</th>
                                <th className="px-3 py-2">Entri</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                                        Tidak ada pengguna yang cocok.
                                    </td>
                                </tr>
                            )}
                            {users.data.map((user) => (
                                <tr key={user.id} className="border-t border-gray-100">
                                    <td className="px-3 py-2 font-medium">{user.name}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">
                                        <p>{user.email}</p>
                                        <p>{user.whatsapp ?? '—'}</p>
                                    </td>
                                    <td className="px-3 py-2">{user.role_label}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">{user.institution?.name ?? '—'}</td>
                                    <td className="px-3 py-2">{user.registrations_count}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`text-xs ${user.is_active ? 'text-emerald-700' : 'text-red-600'}`}
                                        >
                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="text-xs text-blue-600 hover:underline"
                                            onClick={() => setTarget(user)}
                                        >
                                            {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-xs">
                    {users.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                className={`rounded border px-2 py-1 ${
                                    link.active
                                        ? 'border-gray-800 bg-gray-800 text-white'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={index}
                                className="rounded border border-gray-100 px-2 py-1 text-gray-300"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                    <span className="ml-2 text-gray-500">{users.total} pengguna</span>
                </div>
            </div>

            <Modal show={target !== null} onClose={() => setTarget(null)} maxWidth="sm">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">
                        {target?.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {target?.is_active
                            ? `Akun ${target?.name} tidak akan bisa masuk sampai diaktifkan kembali.`
                            : `Akun ${target?.name} akan bisa masuk kembali.`}
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setTarget(null)} disabled={busy}>
                            Batal
                        </SecondaryButton>
                        {target?.is_active ? (
                            <DangerButton type="button" onClick={toggle} disabled={busy}>
                                {busy ? 'Memproses…' : 'Nonaktifkan'}
                            </DangerButton>
                        ) : (
                            <PrimaryButton type="button" onClick={toggle} disabled={busy}>
                                {busy ? 'Memproses…' : 'Aktifkan'}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
