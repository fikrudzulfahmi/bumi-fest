# Kelas UI Bumifest (WAJIB dipakai — jangan Tailwind mentah untuk tampilan)

Sumber: `resources/css/bumifest.css`. **Jangan menulis hex/ukuran baru.** Jangan pakai kelas Tailwind
untuk warna/tipografi/border; pakai kelas di bawah. Tailwind hanya untuk layout darurat (mis. `style={{}}`).

## Struktur halaman area login
```tsx
<AuthenticatedLayout header={<h1>Judul Halaman</h1>}>
    <Head title="Judul" />
    <FlashMessage />
    <div className="panel">…</div>
</AuthenticatedLayout>
```

## Panel & header
- `.panel` — kartu putih border 2px tinta + bayangan keras. Varian `.panel--flat` (tanpa bayangan).
- `.panel__head` — baris judul + aksi (flex, wrap). Isi `<h2>`/`<h3>` + `<p>`.
- `.row-between` — flex kiri-kanan. `.row-gap` — flex gap 10px. `.cluster` — sama.
- `.stack` (gap 16) / `.stack-sm` (gap 10).
- `.divider` — garis pemisah.

## Tombol
`.btn` dasar · `.btn--clay` (merah tanah) · `.btn--ghost` (putih) · `.btn--moss` (hijau)
`.btn--danger` · `.btn--sm` · `.btn--block` (lebar penuh)

Gunakan `<button type="button" className="btn btn--ghost">` atau `<Link className="btn btn--clay" href=…>`.

## Form
- Bungkus tiap input dengan `<Field label="…" htmlFor="…" error={errors.x} hint="…" required>`.
  `Field` ada di `@/Components/app/Field`.
- Input pakai className `input`, select `select`, textarea `textarea`.
- Checkbox/radio: `<label className="check"><input type="checkbox" …/><span>Label</span></label>`
- Grup field: `<fieldset className="fieldset"><legend>…</legend>…</fieldset>`
- Pesan bantuan: `.hint`. Error otomatis dari `Field`.

## Tabel
```tsx
<div className="table-wrap">
  <table className="data">
    <thead><tr><th>Kolom</th></tr></thead>
    <tbody>
      <tr><td data-label="Kolom">nilai</td></tr>
    </tbody>
  </table>
</div>
```
**WAJIB** beri `data-label="Nama Kolom"` di setiap `<td>` (untuk tampilan kartu di mobile).
Kelas sel: `.num` (tabular-nums), `.strong` (tebal), `.muted` (redup), `.small`, `.nowrap`.

## Badge status
`import StatusBadge from '@/Components/app/StatusBadge'` → `<StatusBadge value={row.status} />`
Atau `<span className="badge badge--ok|--wait|--bad|--neutral|--info">Teks</span>`.
Label kecil: `<span className="tag">…</span>`, `<span className="pill">…</span>`.

## Modal & konfirmasi
```tsx
import Modal from '@/Components/app/Modal';
import ConfirmDialog from '@/Components/app/ConfirmDialog';

<Modal show={open} onClose={() => setOpen(false)} title="Judul" wide>
   …
</Modal>

<ConfirmDialog
  show={confirm} title="Batalkan pendaftaran?"
  message={<p>Pendaftaran akan dibatalkan permanen.</p>}
  confirmLabel="Ya, batalkan" danger processing={processing}
  onConfirm={…} onCancel={() => setConfirm(false)} />
```
**Aksi destruktif WAJIB lewat ConfirmDialog** — jangan pakai `window.confirm`.

## Flash & kosong
`import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage'`
- `<FlashMessage />` — tampilkan flash sukses/gagal (letakkan paling atas).
- `<EmptyState title="Belum ada data" description="…" action={<Link className="btn btn--sm">…</Link>} />`

## Paginasi
`import Pagination from '@/Components/app/Pagination'`
`<Pagination links={rows.links} total={rows.total} perPage={rows.per_page} />`

## Statistik
```tsx
<div className="stat-grid">
  <div className="stat"><b>12</b><span>Pendaftar</span><small>3 terverifikasi</small></div>
</div>
```

## Tipografi & util
`.kicker` (label kapital kecil) · `.muted` · `.small` · `.strong` · `.tnum` · `.sr-only`
Judul besar: `<h1>`, `<h2>`, `<h3>` sudah otomatis Fraunces.
Angka besar: `<b style={{fontFamily:'var(--D)'}}>`

## Ikon
Pakai `lucide-react` (sudah terpasang). **JANGAN emoji.** Ukuran 16/18/20.
Contoh: `import { Plus } from 'lucide-react'` → `<Plus size={18} aria-hidden />`

## Larangan
- ❌ `bg-white`, `text-gray-700`, `border-gray-200`, `shadow-md`, `rounded-lg` dst. untuk tampilan.
- ❌ hex baru (`#abc123`), ukuran px baru di style kecuali kecil (margin/gap).
- ❌ emoji sebagai ikon.
- ❌ `window.confirm` / `alert`.
- ✅ Semua teks UI Bahasa Indonesia ramah-formal.
- ✅ Target sentuh ≥ 44px (kelas `.btn` sudah 50px, `.btn--sm` 42px).
