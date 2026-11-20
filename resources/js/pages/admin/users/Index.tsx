import ConfirmDialog from '@/Components/app/ConfirmDialog';
import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Pagination from '@/Components/app/Pagination';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
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
    per_page?: number;
}

interface Props {
    users: Paginated;
    filters: { role: string; q: string };
    roles: Array<{ value: string; label: string }>;
}

export default function Index({ users, filters, roles }: Props) {
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
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Data Pengguna</h1>
                </div>
            }
        >
            <Head title="Data Pengguna" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {users.total} akun terdaftar pada Bumifest.
                </p>
            </div>

            <section className="panel panel--flat">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12,
                        alignItems: 'end',
                    }}
                >
                    <Field label="Cari pengguna" htmlFor="user-q">
                        <input
                            id="user-q"
                            className="input"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && apply()}
                            placeholder="nama / email / WhatsApp"
                        />
                    </Field>

                    <Field label="Peran" htmlFor="user-role">
                        <select
                            id="user-role"
                            className="select"
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
                    </Field>

                    <div>
                        <button type="button" className="btn btn--clay btn--sm" onClick={apply}>
                            <Search size={16} aria-hidden />
                            Terapkan
                        </button>
                    </div>
                </div>
            </section>

            {users.data.length === 0 ? (
                <EmptyState
                    title="Tidak ada pengguna yang cocok"
                    description="Ubah kata kunci atau peran untuk melihat akun lain."
                />
            ) : (
                <div className="table-wrap">
                    <table className="data">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kontak</th>
                                <th>Peran</th>
                                <th>Lembaga</th>
                                <th>Entri</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => (
                                <tr key={user.id}>
                                    <td data-label="Nama" className="strong">
                                        {user.name}
                                    </td>
                                    <td data-label="Kontak">
                                        <span className="small">{user.email}</span>
                                        <span className="small muted" style={{ display: 'block' }}>
                                            {user.whatsapp ?? '—'}
                                        </span>
                                    </td>
                                    <td data-label="Peran">
                                        <span className="tag">{user.role_label}</span>
                                    </td>
                                    <td data-label="Lembaga">{user.institution?.name ?? '—'}</td>
                                    <td data-label="Entri" className="num strong">
                                        {user.registrations_count}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge value={user.is_active ? 'active' : 'inactive'} />
                                    </td>
                                    <td data-label="Aksi">
                                        <button
                                            type="button"
                                            className={`btn btn--sm ${user.is_active ? 'btn--danger' : 'btn--moss'}`}
                                            onClick={() => setTarget(user)}
                                        >
                                            {user.is_active ? (
                                                <>
                                                    <ShieldBan size={15} aria-hidden />
                                                    Nonaktifkan
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={15} aria-hidden />
                                                    Aktifkan
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination links={users.links} total={users.total} perPage={users.per_page} />

            <ConfirmDialog
                show={target !== null}
                title={target?.is_active ? 'Nonaktifkan akun ini?' : 'Aktifkan akun ini?'}
                message={
                    <p>
                        {target?.is_active
                            ? `Akun ${target?.name} tidak akan bisa masuk sampai diaktifkan kembali.`
                            : `Akun ${target?.name} akan bisa masuk kembali seperti biasa.`}
                    </p>
                }
                confirmLabel={target?.is_active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
                cancelLabel="Tidak jadi"
                danger={Boolean(target?.is_active)}
                processing={busy}
                onConfirm={toggle}
                onCancel={() => setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
