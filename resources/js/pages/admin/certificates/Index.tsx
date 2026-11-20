import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, FileDown, ImageUp, Info, LayoutTemplate, QrCode, Save, ScanLine } from 'lucide-react';

interface LayoutField {
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
    layout: Record<string, LayoutField>;
}

interface Props {
    competition: { id: number; name: string; level_label: string | null; results_published_at: string | null };
    templates: TemplateItem[];
    types: Array<string | { name?: string; value: string }>;
    certificates_count: number;
}

const fieldDefaults = (align = 'center'): LayoutField => ({ x: 50, y: 50, size: 24, color: '#000000', align });

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
    // Server mengirim daftar enum sebagai string ("winner"/"participation");
    // objek {name,value} tetap didukung bila bentuknya berubah.
    const typeOptions = types.map((t) =>
        typeof t === 'string'
            ? { value: t, label: t === 'winner' ? 'Juara' : 'Partisipasi' }
            : { value: t.value, label: t.name ?? (t.value === 'winner' ? 'Juara' : 'Partisipasi') },
    );

    const form = useForm<{
        type: string;
        image: File | null;
        layout: Record<string, LayoutField>;
    }>({
        type: 'participation',
        image: null,
        layout: layoutDefaults(),
    });

    const setField = (key: string, patch: Partial<LayoutField>) => {
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
        router.get(route('admin.certificates.preview', competition.id), { type }, { replace: false });
    };

    const fieldRows: { key: string; label: string; hideAlign?: boolean }[] = [
        { key: 'name', label: 'Nama peserta' },
        { key: 'competition', label: 'Lomba / juara' },
        { key: 'placement', label: 'Posisi juara' },
        { key: 'number', label: 'Nomor', hideAlign: true },
        { key: 'qr', label: 'Kode QR', hideAlign: true },
    ];

    const guide: { icon: React.ReactNode; text: string }[] = [
        { icon: <ImageUp size={16} aria-hidden />, text: 'Unggah gambar latar sertifikat berformat PNG atau JPG, maksimal 5 MB.' },
        {
            icon: <LayoutTemplate size={16} aria-hidden />,
            text: 'Atur posisi nama, lomba/juara, nomor, dan kode QR dalam persen terhadap ukuran halaman.',
        },
        {
            icon: <ScanLine size={16} aria-hidden />,
            text: 'Gunakan pratinjau PDF untuk memeriksa tata letak sebelum hasil diterbitkan.',
        },
        {
            icon: <Info size={16} aria-hidden />,
            text: 'Nama panjang otomatis diperkecil agar tetap muat dalam satu baris.',
        },
        {
            icon: <QrCode size={16} aria-hidden />,
            text: 'Kode QR memuat tautan verifikasi keaslian sertifikat.',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Sertifikat</h1>
                    <p className="small muted" style={{ marginTop: 4 }}>
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Sertifikat ${competition.name}`} />

            <FlashMessage />

            <div className="stat-grid">
                <div className="stat">
                    <b>{certificates_count}</b>
                    <span>Sertifikat dibuat</span>
                    <small>Untuk lomba ini</small>
                </div>
                <div className="stat">
                    <b>{templates.length}</b>
                    <span>Template tersimpan</span>
                    <small>Juara &amp; partisipasi</small>
                </div>
            </div>

            <div className="row-between">
                <p className="small muted">
                    {certificates_count} sertifikat dibuat untuk lomba ini. Template baru otomatis dipakai saat sertifikat
                    diregenerasi.
                </p>
                <Link href={route('admin.competitions.index')} className="btn btn--ghost btn--sm">
                    <ArrowLeft size={16} aria-hidden />
                    Kembali ke daftar lomba
                </Link>
            </div>

            {competition.results_published_at && (
                <div className="panel panel--flat">
                    <div className="row-gap" style={{ gap: 12, alignItems: 'flex-start' }}>
                        <Info size={18} aria-hidden style={{ color: 'var(--clay)', flex: 'none' }} />
                        <p className="small" style={{ flex: '1 1 300px' }}>
                            Hasil sudah diterbitkan. Template tetap bisa diunggah; sertifikat yang sudah ada diregenerasi bila
                            ada koreksi nama.
                        </p>
                    </div>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gap: 20,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    alignItems: 'start',
                }}
            >
                <form
                    className="panel stack"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    <div className="panel__head">
                        <div>
                            <h2>Unggah template</h2>
                            <p>Gambar latar sertifikat beserta posisi setiap elemen teks.</p>
                        </div>
                    </div>

                    <fieldset className="fieldset">
                        <legend>Jenis &amp; gambar</legend>

                        <Field
                            label="Jenis sertifikat"
                            htmlFor="type"
                            hint="Layout tersimpan dimuat otomatis saat jenis dipilih."
                        >
                            <select
                                id="type"
                                className="select"
                                value={form.data.type}
                                onChange={(event) => selectType(event.target.value)}
                            >
                                {typeOptions.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Gambar template"
                            htmlFor="image"
                            error={form.errors.image}
                            hint="PNG atau JPG, maksimal 5 MB."
                            required
                        >
                            <input
                                id="image"
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)}
                                className="input"
                                aria-invalid={Boolean(form.errors.image)}
                            />
                        </Field>
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend>Posisi elemen</legend>
                        <p className="hint" style={{ marginBottom: 14 }}>
                            Nilai dalam persen terhadap lebar dan tinggi halaman; Y dihitung dari sisi atas.
                        </p>

                        {fieldRows.map((row) => (
                            <div key={row.key} style={{ marginBottom: 10 }}>
                                <p className="strong small" style={{ marginBottom: 6 }}>
                                    {row.label}
                                </p>
                                <div className="row-gap" style={{ gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{ flex: '1 1 84px' }}>
                                        <Field label="X (%)" htmlFor={`${row.key}-x`}>
                                            <input
                                                id={`${row.key}-x`}
                                                type="number"
                                                min={0}
                                                max={100}
                                                className="input"
                                                value={form.data.layout[row.key]?.x ?? 50}
                                                onChange={(e) => setField(row.key, { x: Number(e.target.value) })}
                                            />
                                        </Field>
                                    </div>
                                    <div style={{ flex: '1 1 84px' }}>
                                        <Field label="Y (%)" htmlFor={`${row.key}-y`}>
                                            <input
                                                id={`${row.key}-y`}
                                                type="number"
                                                min={0}
                                                max={100}
                                                className="input"
                                                value={form.data.layout[row.key]?.y ?? 50}
                                                onChange={(e) => setField(row.key, { y: Number(e.target.value) })}
                                            />
                                        </Field>
                                    </div>
                                    <div style={{ flex: '1 1 84px' }}>
                                        <Field label="Ukuran" htmlFor={`${row.key}-size`}>
                                            <input
                                                id={`${row.key}-size`}
                                                type="number"
                                                min={1}
                                                max={80}
                                                className="input"
                                                value={form.data.layout[row.key]?.size ?? 24}
                                                onChange={(e) => setField(row.key, { size: Number(e.target.value) })}
                                            />
                                        </Field>
                                    </div>
                                    <div style={{ flex: '1 1 84px' }}>
                                        <Field label="Warna" htmlFor={`${row.key}-color`}>
                                            <input
                                                id={`${row.key}-color`}
                                                type="color"
                                                className="input"
                                                style={{ padding: 6 }}
                                                value={form.data.layout[row.key]?.color ?? '#000000'}
                                                onChange={(e) => setField(row.key, { color: e.target.value })}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </fieldset>

                    <div className="row-between">
                        <button
                            type="submit"
                            className="btn btn--clay"
                            disabled={form.processing || form.data.image === null}
                        >
                            <Save size={18} aria-hidden />
                            {form.processing ? 'Menyimpan…' : 'Simpan template'}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => preview(form.data.type)}>
                            <FileDown size={16} aria-hidden />
                            Pratinjau PDF
                        </button>
                    </div>
                </form>

                <div className="stack">
                    <div className="panel">
                        <div className="panel__head">
                            <div>
                                <h2>Template tersimpan</h2>
                                <p>Template aktif untuk lomba ini.</p>
                            </div>
                        </div>

                        {templates.length === 0 ? (
                            <EmptyState
                                title="Belum ada template"
                                description="Unggah gambar template pada formulir untuk mulai membuat sertifikat."
                            />
                        ) : (
                            <ul className="stack-sm" style={{ gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                                {templates.map((t) => (
                                    <li key={t.id} className="panel panel--flat">
                                        <div className="row-between" style={{ gap: 12 }}>
                                            <div className="row-gap" style={{ gap: 10 }}>
                                                <StatusBadge value={t.type} label={t.type_label} />
                                                <span className="small muted">
                                                    {Object.keys(t.layout ?? {}).length} elemen diatur
                                                </span>
                                            </div>
                                            <div className="row-gap" style={{ gap: 8 }}>
                                                <a
                                                    href={t.image_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn--ghost btn--sm"
                                                >
                                                    <ExternalLink size={15} aria-hidden />
                                                    Lihat gambar
                                                </a>
                                                <button
                                                    type="button"
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => preview(t.type)}
                                                >
                                                    <FileDown size={15} aria-hidden />
                                                    Pratinjau PDF
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="panel">
                        <div className="panel__head">
                            <div>
                                <h2>Panduan</h2>
                                <p>Langkah singkat menyiapkan sertifikat.</p>
                            </div>
                        </div>

                        <ul className="stack-sm" style={{ gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                            {guide.map((item, index) => (
                                <li key={index} className="row-gap" style={{ gap: 10, alignItems: 'flex-start' }}>
                                    <span aria-hidden style={{ display: 'inline-flex', color: 'var(--clay)', flex: 'none' }}>
                                        {item.icon}
                                    </span>
                                    <span className="small" style={{ flex: '1 1 220px' }}>
                                        {item.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
