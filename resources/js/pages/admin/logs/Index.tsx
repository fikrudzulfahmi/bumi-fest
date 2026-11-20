import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Pagination from '@/Components/app/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Activity {
    id: number;
    description: string;
    causer_name: string;
    subject_type: string | null;
    properties: Record<string, unknown>;
    created_at: string | null;
}

interface Props {
    activities: {
        data: Activity[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        per_page?: number;
    };
    filters: { subject: string; description: string; from: string; to: string };
    descriptions: string[];
}

export default function Index({ activities, filters, descriptions }: Props) {
    const [form, setForm] = useState(filters);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.logs.index'), form, { preserveState: true, replace: true });
    };

    const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Riwayat Aktivitas</h1>
                </div>
            }
        >
            <Head title="Riwayat Aktivitas" />

            <FlashMessage />

            <form onSubmit={submit} className="panel">
                <div className="row-gap" style={{ alignItems: 'flex-end', gap: 14 }}>
                    <div style={{ flex: '1 1 220px' }}>
                        <Field label="Cari deskripsi" htmlFor="log-subject">
                            <input
                                id="log-subject"
                                type="text"
                                className="input"
                                value={form.subject}
                                onChange={(e) => set('subject', e.target.value)}
                                placeholder="mis. Tagihan, Nilai"
                            />
                        </Field>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <Field label="Jenis aktivitas" htmlFor="log-desc">
                            <select
                                id="log-desc"
                                className="select"
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                            >
                                <option value="">Semua</option>
                                {descriptions.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                        <Field label="Dari tanggal" htmlFor="log-from">
                            <input
                                id="log-from"
                                type="date"
                                className="input"
                                value={form.from}
                                onChange={(e) => set('from', e.target.value)}
                            />
                        </Field>
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                        <Field label="Sampai tanggal" htmlFor="log-to">
                            <input
                                id="log-to"
                                type="date"
                                className="input"
                                value={form.to}
                                onChange={(e) => set('to', e.target.value)}
                            />
                        </Field>
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                        <button type="submit" className="btn btn--clay">
                            Terapkan filter
                        </button>
                    </div>
                </div>
            </form>

            {activities.data.length === 0 ? (
                <EmptyState title="Belum ada aktivitas" description="Aktivitas panitia akan tercatat otomatis di sini." />
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Pelaku</th>
                                    <th>Aktivitas</th>
                                    <th>Objek</th>
                                    <th>Rincian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.data.map((activity) => (
                                    <tr key={activity.id}>
                                        <td data-label="Waktu" className="small nowrap">
                                            {activity.created_at
                                                ? new Date(activity.created_at).toLocaleString('id-ID')
                                                : '—'}
                                        </td>
                                        <td data-label="Pelaku">{activity.causer_name}</td>
                                        <td data-label="Aktivitas" className="strong">
                                            {activity.description}
                                        </td>
                                        <td data-label="Objek" className="small muted">
                                            {activity.subject_type ?? '—'}
                                        </td>
                                        <td data-label="Rincian" className="small muted">
                                            {JSON.stringify(activity.properties)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={activities.links}
                        total={activities.total}
                        perPage={activities.per_page ?? 30}
                    />
                </>
            )}
        </AuthenticatedLayout>
    );
}
