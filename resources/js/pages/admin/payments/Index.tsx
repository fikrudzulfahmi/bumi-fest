import ConfirmDialog from '@/Components/app/ConfirmDialog';
import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Modal from '@/Components/app/Modal';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, Check, Download, ExternalLink, Image as ImageIcon, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

interface Invoice {
    id: number;
    number: string;
    total: number;
    status: string;
    status_label: string;
    status_color: string;
    has_proof: boolean;
    proof_uploaded_at: string | null;
    due_at: string | null;
    is_overdue: boolean;
    rejection_reason: string | null;
    registrations_count?: number;
    owner?: { id: number; name: string; email: string };
}

interface Filters {
    status: string;
    level: string;
    competition_id: number;
    q: string;
}

interface Props {
    invoices: Invoice[];
    filters: Filters;
    levels: { value: string; label: string }[];
    competitions: { id: number; name: string }[];
    counts: { awaiting: number; paid: number; rejected: number };
}

export default function Index({ invoices, filters, levels, competitions, counts }: Props) {
    const [preview, setPreview] = useState<Invoice | null>(null);
    const [rejecting, setRejecting] = useState<Invoice | null>(null);
    const [extending, setExtending] = useState<Invoice | null>(null);
    const [accepting, setAccepting] = useState<Invoice | null>(null);
    const [reason, setReason] = useState('');
    const [hours, setHours] = useState('24');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const [form, setForm] = useState<Filters>(filters);

    const applyFilters = () => {
        router.get(route('admin.payments.index'), { ...form }, { preserveState: true, replace: true });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== '' && value !== 0) params.set(key, String(value));
        });
        const query = params.toString();

        return route('admin.payments.export') + (query ? `?${query}` : '');
    };

    const verify = (invoice: Invoice) => {
        setBusy(true);
        router.post(
            route('admin.payments.verify', invoice.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setAccepting(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    const submitReject = () => {
        if (!rejecting) return;

        if (reason.trim().length < 5) {
            setLocalError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.post(
            route('admin.payments.reject', rejecting.id),
            { reason: reason.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejecting(null);
                    setReason('');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const submitExtend = () => {
        if (!extending) return;

        const value = Number(hours);

        if (!Number.isInteger(value) || value < 1 || value > 720) {
            setLocalError('Durasi 1–720 jam.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.post(
            route('admin.payments.extend', extending.id),
            { hours: value },
            {
                preserveScroll: true,
                onSuccess: () => setExtending(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Verifikasi Pembayaran</h1>
                </div>
            }
        >
            <Head title="Verifikasi Pembayaran" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    Periksa bukti transfer, lalu terima atau tolak tagihan peserta.
                </p>
                <a href={exportUrl()} className="btn btn--ghost btn--sm">
                    <Download size={16} aria-hidden />
                    Ekspor
                </a>
            </div>

            <div className="stat-grid">
                <div className="stat">
                    <b>{counts.awaiting}</b>
                    <span>Menunggu verifikasi</span>
                    <small className="muted">perlu ditinjau</small>
                </div>
                <div className="stat">
                    <b>{counts.paid}</b>
                    <span>Terbayar</span>
                    <small className="muted">sudah diterima</small>
                </div>
                <div className="stat">
                    <b>{counts.rejected}</b>
                    <span>Ditolak</span>
                    <small className="muted">menunggu unggah ulang</small>
                </div>
            </div>

            <section className="panel panel--flat">
                <div className="panel__head" style={{ marginBottom: 14 }}>
                    <div>
                        <span className="kicker">Antrean</span>
                        <h3>Saring tagihan</h3>
                    </div>
                    <button type="button" className="btn btn--clay btn--sm" onClick={applyFilters}>
                        <SlidersHorizontal size={16} aria-hidden />
                        Terapkan
                    </button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12,
                    }}
                >
                    <Field label="Status" htmlFor="pay-status">
                        <select
                            id="pay-status"
                            className="select"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="">Menunggu verifikasi</option>
                            <option value="unpaid">Belum dibayar</option>
                            <option value="awaiting_verification">Menunggu verifikasi</option>
                            <option value="rejected">Ditolak</option>
                            <option value="paid">Terbayar</option>
                            <option value="expired">Kadaluarsa</option>
                        </select>
                    </Field>

                    <Field label="Jenjang" htmlFor="pay-level">
                        <select
                            id="pay-level"
                            className="select"
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value })}
                        >
                            <option value="">Semua</option>
                            {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Lomba" htmlFor="pay-competition">
                        <select
                            id="pay-competition"
                            className="select"
                            value={form.competition_id}
                            onChange={(e) => setForm({ ...form, competition_id: Number(e.target.value) })}
                        >
                            <option value={0}>Semua</option>
                            {competitions.map((competition) => (
                                <option key={competition.id} value={competition.id}>
                                    {competition.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Cari" htmlFor="pay-q">
                        <input
                            id="pay-q"
                            type="text"
                            className="input"
                            value={form.q}
                            onChange={(e) => setForm({ ...form, q: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="No. tagihan / nama / total"
                        />
                    </Field>
                </div>
            </section>

            {invoices.length === 0 ? (
                <EmptyState
                    title="Antrean kosong"
                    description="Tidak ada tagihan pada saringan ini. Ubah status atau kata kunci untuk melihat tagihan lain."
                />
            ) : (
                <div className="stack">
                    {invoices.map((invoice) => (
                        <article className="panel" key={invoice.id}>
                            <div className="row-between">
                                <div>
                                    <span className="kicker">Tagihan</span>
                                    <h3 className="tnum">{invoice.number}</h3>
                                    <p className="small muted">
                                        {invoice.owner?.name ?? '—'}
                                        {invoice.owner?.email ? ` · ${invoice.owner.email}` : ''}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p className="strong tnum" style={{ fontSize: 22 }}>
                                        {formatRupiah(invoice.total)}
                                    </p>
                                    <StatusBadge value={invoice.status} label={invoice.status_label} />
                                </div>
                            </div>

                            <div className="row-gap" style={{ marginTop: 14 }}>
                                <span className="tag">{invoice.registrations_count ?? 0} entri</span>
                                {invoice.proof_uploaded_at && (
                                    <span className="tag">Bukti diunggah {formatTanggalWaktu(invoice.proof_uploaded_at)}</span>
                                )}
                                {invoice.due_at && (
                                    <span className={invoice.is_overdue ? 'tag tag--clay' : 'tag'}>
                                        Jatuh tempo {formatTanggalWaktu(invoice.due_at)}
                                    </span>
                                )}
                            </div>

                            {invoice.rejection_reason && (
                                <p className="small" style={{ marginTop: 10, fontWeight: 600, color: 'var(--clay-d)' }}>
                                    Alasan tolak: {invoice.rejection_reason}
                                </p>
                            )}

                            <div className="row-gap" style={{ marginTop: 16 }}>
                                {invoice.has_proof && (
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPreview(invoice)}>
                                        <ImageIcon size={15} aria-hidden />
                                        Pratinjau bukti
                                    </button>
                                )}
                                {invoice.status === 'awaiting_verification' && invoice.has_proof && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn--moss btn--sm"
                                            disabled={busy}
                                            onClick={() => setAccepting(invoice)}
                                        >
                                            <Check size={15} aria-hidden />
                                            Terima
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn--danger btn--sm"
                                            disabled={busy}
                                            onClick={() => {
                                                setLocalError(null);
                                                setRejecting(invoice);
                                            }}
                                        >
                                            <X size={15} aria-hidden />
                                            Tolak
                                        </button>
                                    </>
                                )}
                                {['unpaid', 'rejected'].includes(invoice.status) && (
                                    <button
                                        type="button"
                                        className="btn btn--ghost btn--sm"
                                        onClick={() => {
                                            setLocalError(null);
                                            setExtending(invoice);
                                        }}
                                    >
                                        <CalendarClock size={15} aria-hidden />
                                        Perpanjang
                                    </button>
                                )}
                                <Link href={route('invoices.show', invoice.id)} className="btn btn--ghost btn--sm">
                                    <ExternalLink size={15} aria-hidden />
                                    Detail tagihan
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Modal show={preview !== null} onClose={() => setPreview(null)} title={`Bukti ${preview?.number ?? ''}`} wide>
                {preview && (
                    <img
                        src={route('admin.payments.proof', preview.id)}
                        alt={`Bukti pembayaran ${preview.number}`}
                        style={{ marginTop: 8, width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    />
                )}
                {preview?.proof_uploaded_at && (
                    <p className="small muted">Diunggah {formatTanggalWaktu(preview.proof_uploaded_at)}</p>
                )}
            </Modal>

            <ConfirmDialog
                show={accepting !== null}
                title="Terima pembayaran ini?"
                message={
                    <p>
                        Tagihan <span className="strong tnum">{accepting?.number}</span> sebesar{' '}
                        <span className="strong">{accepting ? formatRupiah(accepting.total) : '—'}</span> akan ditandai
                        lunas dan pendaftaran terkait diverifikasi.
                    </p>
                }
                confirmLabel="Ya, terima"
                cancelLabel="Tidak jadi"
                processing={busy}
                onConfirm={() => accepting && verify(accepting)}
                onCancel={() => setAccepting(null)}
            />

            <ConfirmDialog
                show={rejecting !== null}
                title={`Tolak pembayaran ${rejecting?.number ?? ''}?`}
                message={
                    <div className="stack-sm">
                        <p>Pengguna dapat mengunggah ulang bukti setelah penolakan.</p>
                        <Field
                            label="Alasan penolakan"
                            htmlFor="reject-reason"
                            error={localError ?? undefined}
                            hint="Minimal 5 karakter, dikirim ke peserta."
                            required
                        >
                            <textarea
                                id="reject-reason"
                                className="textarea"
                                rows={4}
                                placeholder="Contoh: nominal transfer tidak sesuai tagihan."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </Field>
                    </div>
                }
                confirmLabel="Ya, tolak"
                cancelLabel="Tidak jadi"
                danger
                processing={busy}
                onConfirm={submitReject}
                onCancel={() => {
                    setRejecting(null);
                    setLocalError(null);
                }}
            />

            <Modal show={extending !== null} onClose={() => setExtending(null)} title="Perpanjang jatuh tempo">
                <p className="small muted">
                    Tagihan <span className="strong tnum">{extending?.number ?? ''}</span> akan diberi tambahan waktu
                    pembayaran.
                </p>

                <div style={{ marginTop: 16 }}>
                    <Field
                        label="Durasi (jam)"
                        htmlFor="extend-hours"
                        error={localError ?? undefined}
                        hint="Isi 1 sampai 720 jam."
                        required
                    >
                        <input
                            id="extend-hours"
                            type="number"
                            min={1}
                            max={720}
                            className="input"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                    </Field>
                </div>

                <div className="modal__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setExtending(null)} disabled={busy}>
                        Batal
                    </button>
                    <button type="button" className="btn btn--clay" onClick={submitExtend} disabled={busy}>
                        {busy ? 'Memproses…' : 'Perpanjang'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
