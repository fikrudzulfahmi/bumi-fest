import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
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
    };
    filters: { subject: string; description: string; from: string; to: string };
    descriptions: string[];
}

export default function Index({ activities, filters, descriptions }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
    const [form, setForm] = useState(filters);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.logs.index'), form, { preserveState: true, replace: true });
    };

    const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Riwayat Aktivitas</h1>}>
            <Head title="Riwayat Aktivitas" />

            <div className="mx-auto max-w-6xl space-y-4 p-4">
                {flash?.success && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Cari deskripsi</span>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => set('subject', e.target.value)}
                            className="min-h-11 w-full rounded border-gray-300 text-sm"
                            placeholder="mis. Tagihan, Nilai"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Jenis aktivitas</span>
                        <select
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            className="min-h-11 w-full rounded border-gray-300 text-sm"
                        >
                            <option value="">Semua</option>
                            {descriptions.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Dari tanggal</span>
                        <input
                            type="date"
                            value={form.from}
                            onChange={(e) => set('from', e.target.value)}
                            className="min-h-11 w-full rounded border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">Sampai tanggal</span>
                        <input
                            type="date"
                            value={form.to}
                            onChange={(e) => set('to', e.target.value)}
                            className="min-h-11 w-full rounded border-gray-300 text-sm"
                        />
                    </label>
                    <div className="flex items-end sm:col-span-4">
                        <button
                            type="submit"
                            className="min-h-11 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                            Terapkan filter
                        </button>
                    </div>
                </form>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-3 py-2">Waktu</th>
                                <th className="px-3 py-2">Pelaku</th>
                                <th className="px-3 py-2">Aktivitas</th>
                                <th className="px-3 py-2">Objek</th>
                                <th className="px-3 py-2">Rincian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activities.data.map((activity) => (
                                <tr key={activity.id}>
                                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                        {activity.created_at
                                            ? new Date(activity.created_at).toLocaleString('id-ID')
                                            : '—'}
                                    </td>
                                    <td className="px-3 py-2">{activity.causer_name}</td>
                                    <td className="px-3 py-2 font-medium">{activity.description}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500">{activity.subject_type ?? '—'}</td>
                                    <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-gray-500">
                                        {JSON.stringify(activity.properties)}
                                    </td>
                                </tr>
                            ))}
                            {activities.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                                        Belum ada aktivitas tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {activities.total > 30 && (
                    <div className="flex flex-wrap gap-1">
                        {activities.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={link.url === null || link.active}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`min-h-11 rounded border px-3 py-2 text-sm ${
                                    link.active
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
