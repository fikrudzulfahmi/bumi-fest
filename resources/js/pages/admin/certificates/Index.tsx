import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

interface Field {
    x: number;
    y: number;
    size: number;
    color: string;
    align: string;
}

interface TemplateItem {
    id: number;
    type: string;
    type_label: string;
    image_url: string;
    layout: Record<string, Field>;
}

interface Props {
    competition: { id: number; name: string; level_label: string | null; results_published_at: string | null };
    templates: TemplateItem[];
    types: { name: string; value: string }[];
    certificates_count: number;
}

const fieldDefaults = (align = 'center'): Field => ({ x: 50, y: 50, size: 24, color: '#000000', align });

function layoutDefaults() {
    return {
        name: { x: 50, y: 45, size: 32, color: '#000000', align: 'center' },
        competition: { x: 50, y: 30, size: 20, color: '#000000', align: 'center' },
        placement: { x: 50, y: 55, size: 18, color: '#000000', align: 'center' },
        number: { x: 12, y: 90, size: 12, color: '#000000', align: 'left' },
        qr: { x: 88, y: 82, size: 12, color: '#000000', align: 'center' },
    };
}

export default function Index({ competition, templates, types, certificates_count }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;

    const form = useForm<{
        type: string;
        image: File | null;
        layout: Record<string, Field>;
    }>({
        type: 'participation',
        image: null,
        layout: layoutDefaults(),
    });

    const setField = (key: string, patch: Partial<Field>) => {
        form.setData('layout', { ...form.data.layout, [key]: { ...form.data.layout[key], ...patch } });
    };

    const selectType = (type: string) => {
        const existing = templates.find((t) => t.type === type);
        form.setData({
            ...form.data,
            type,
            layout: existing ? existing.layout : layoutDefaults(),
        });
    };

    const submit = () => {
        form.post(route('admin.certificates.template.store', competition.id), { preserveScroll: true });
    };

    const preview = (type: string) => {
        router.get(
            route('admin.certificates.preview', competition.id),
            { type },
            { replace: false },
        );
    };

    const fieldRows: { key: string; label: string; hideAlign?: boolean }[] = [
        { key: 'name', label: 'Nama peserta' },
        { key: 'competition', label: 'Lomba / juara' },
        { key: 'placement', label: 'Posisi juara' },
        { key: 'number', label: 'Nomor', hideAlign: true },
        { key: 'qr', label: 'Kode QR', hideAlign: true },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold">Sertifikat</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Sertifikat ${competition.name}`} />

            <div className="mx-auto max-w-5xl space-y-4 p-4">
                {flash?.success && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>{certificates_count} sertifikat dibuat untuk lomba ini.</span>
                    <Link href={route('admin.competitions.index')} className="text-gray-700 underline">
                        Kembali ke daftar lomba
                    </Link>
                </div>

                {competition.results_published_at && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Hasil sudah diterbitkan. Template tetap bisa diunggah; sertifikat yang sudah ada diregenerasi bila
                        ada koreksi nama.
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="rounded border border-gray-200 bg-white p-4">
                            <h2 className="font-semibold">Template tersimpan</h2>
                            {templates.length === 0 && (
                                <p className="mt-2 text-sm text-gray-500">Belum ada template. Unggah di form sebelah.</p>
                            )}
                            <ul className="mt-2 space-y-2">
                                {templates.map((t) => (
                                    <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                                        <span
                                            className={`rounded px-2 py-1 text-xs ${
                                                t.type === 'winner'
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {t.type_label}
                                        </span>
                                        <a href={t.image_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                                            Lihat gambar
                                        </a>
                                        <button onClick={() => preview(t.type)} className="text-gray-700 underline">
                                            Pratinjau PDF
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded border border-gray-200 bg-white p-4">
                            <h2 className="font-semibold">Unggah template</h2>

                            <div className="mt-3">
                                <label htmlFor="type" className="block text-sm font-medium">
                                    Jenis sertifikat
                                </label>
                                <select
                                    id="type"
                                    value={form.data.type}
                                    onChange={(event) => selectType(event.target.value)}
                                    className="mt-1 min-h-11 w-full rounded border-gray-300 text-sm"
                                >
                                    {types.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.name === 'winner' ? 'Juara' : 'Partisipasi'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-3">
                                <label htmlFor="image" className="block text-sm font-medium">
                                    Gambar template (PNG/JPG, maks 5 MB)
                                </label>
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)}
                                    className="mt-1 block w-full text-sm"
                                />
                                {form.errors.image && <p className="mt-1 text-xs text-red-600">{form.errors.image}</p>}
                            </div>

                            <div className="mt-4">
                                <p className="text-sm font-medium">Posisi elemen (persen, y dari atas)</p>
                                <div className="mt-2 space-y-2">
                                    {fieldRows.map((row) => (
                                        <div key={row.key} className="grid grid-cols-2 gap-2 rounded border border-gray-100 p-2 sm:grid-cols-5">
                                            <span className="col-span-2 text-xs font-medium sm:col-span-1">
                                                {row.label}
                                            </span>
                                            <label className="text-xs text-gray-500">
                                                X%
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={form.data.layout[row.key]?.x ?? 50}
                                                    onChange={(e) => setField(row.key, { x: Number(e.target.value) })}
                                                    className="mt-0.5 w-full rounded border-gray-300 text-sm"
                                                />
                                            </label>
                                            <label className="text-xs text-gray-500">
                                                Y%
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={form.data.layout[row.key]?.y ?? 50}
                                                    onChange={(e) => setField(row.key, { y: Number(e.target.value) })}
                                                    className="mt-0.5 w-full rounded border-gray-300 text-sm"
                                                />
                                            </label>
                                            <label className="text-xs text-gray-500">
                                                Ukuran
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={80}
                                                    value={form.data.layout[row.key]?.size ?? 24}
                                                    onChange={(e) => setField(row.key, { size: Number(e.target.value) })}
                                                    className="mt-0.5 w-full rounded border-gray-300 text-sm"
                                                />
                                            </label>
                                            <label className="text-xs text-gray-500">
                                                Warna
                                                <input
                                                    type="color"
                                                    value={form.data.layout[row.key]?.color ?? '#000000'}
                                                    onChange={(e) => setField(row.key, { color: e.target.value })}
                                                    className="mt-0.5 w-full rounded border-gray-300 text-sm"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <PrimaryButton type="button" onClick={submit} disabled={form.processing || form.data.image === null}>
                                Simpan template
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="rounded border border-gray-200 bg-white p-4">
                        <h2 className="font-semibold">Panduan</h2>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                            <li>Unggah gambar latar sertifikat (PNG/JPG, maks 5 MB).</li>
                            <li>Atur posisi nama, lomba/juara, nomor, dan QR dalam persen terhadap ukuran halaman.</li>
                            <li>Gunakan pratinjau PDF untuk memeriksa tata letak sebelum hasil diterbitkan.</li>
                            <li>Nama panjang otomatis diperkecil agar muat satu baris.</li>
                            <li>QR memuat tautan verifikasi keaslian sertifikat.</li>
                        </ul>

                        <div className="mt-4">
                            <PrimaryButton onClick={() => preview(form.data.type)}>Pratinjau PDF (jenis terpilih)</PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
