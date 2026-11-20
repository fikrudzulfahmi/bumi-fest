import FlashMessage from '@/Components/app/FlashMessage';
import Modal from '@/Components/app/Modal';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ClipboardCopy, Eye, Landmark, ShieldCheck, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface Invoice {
    id: number;
    number: string;
    subtotal: number;
    unique_code: number;
    discount: number;
    total: number;
    status: string;
    status_label: string;
    status_color: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
    has_proof: boolean;
    proof_uploaded_at: string | null;
    due_at: string | null;
    is_overdue: boolean;
    rejection_reason: string | null;
    verified_at: string | null;
}

interface Entry {
    id: number;
    code: string;
    team_name: string | null;
    status: string;
    status_label: string;
    fee: number;
    competition_name: string | null;
    level: string | null;
    slug: string | null;
}

interface Props {
    invoice: Invoice;
    entries: Entry[];
    canManage: boolean;
}

export default function Show({ invoice, entries, canManage }: Props) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const form = useForm<{ proof: File | null }>({ proof: null });
    const uploadable = ['unpaid', 'rejected'].includes(invoice.status);

    const copyTotal = async () => {
        try {
            await navigator.clipboard.writeText(String(invoice.total));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const submitProof = () => {
        if (!form.data.proof) return;

        form.post(route('invoices.upload-proof', invoice.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1>Tagihan {invoice.number}</h1>}>
            <Head title={`Tagihan ${invoice.number}`} />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Total transfer</span>
                            <h2 style={{ marginTop: 4 }}>{formatRupiah(invoice.total)}</h2>
                            <p className="muted">
                                <StatusBadge value={invoice.status} label={invoice.status_label} />
                                {invoice.due_at && (
                                    <span style={{ marginLeft: 10 }}>
                                        Jatuh tempo {formatTanggalWaktu(invoice.due_at)}
                                        {invoice.is_overdue && (
                                            <span className="badge badge--bad" style={{ marginLeft: 8 }}>
                                                Lewat jatuh tempo
                                            </span>
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="row-gap" style={{ gap: 8 }}>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={copyTotal}>
                                <ClipboardCopy size={16} aria-hidden />
                                {copied ? 'Tersalin' : 'Salin total'}
                            </button>
                            <Link className="btn btn--ghost btn--sm" href={route('invoices.index')}>
                                <ArrowLeft size={16} aria-hidden />
                                Daftar tagihan
                            </Link>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="row-between">
                        <span className="muted">Subtotal</span>
                        <span className="tnum">{formatRupiah(invoice.subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="row-between" style={{ marginTop: 6 }}>
                            <span className="muted">Potongan</span>
                            <span className="tnum">-{formatRupiah(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="row-between" style={{ marginTop: 6 }}>
                        <span className="muted">Kode unik</span>
                        <span className="tnum strong">{invoice.unique_code}</span>
                    </div>
                    <div className="row-between" style={{ marginTop: 10 }}>
                        <span className="strong">Total transfer</span>
                        <span className="tnum strong" style={{ fontFamily: 'var(--D)', fontSize: '1.25rem' }}>
                            {formatRupiah(invoice.total)}
                        </span>
                    </div>
                    <p className="hint" style={{ marginTop: 10 }}>
                        <CheckCircle2 size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Transfer tepat sampai 3
                        digit terakhir kode unik agar tagihan terverifikasi otomatis.
                    </p>
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Tujuan transfer</span>
                            <h3>
                                <Landmark size={18} aria-hidden style={{ verticalAlign: '-3px' }} /> Rekening panitia
                            </h3>
                            <p className="muted">
                                {invoice.bank_name ?? 'Rekening belum tersedia'} · a.n.{' '}
                                {invoice.bank_account_holder ?? '-'}
                            </p>
                        </div>
                    </div>

                    <div className="stat">
                        <span>Nomor rekening</span>
                        <b style={{ fontSize: '1.6rem', letterSpacing: '.04em' }}>
                            {invoice.bank_account_number ?? '—'}
                        </b>
                        <small>{invoice.bank_name ?? 'Bank belum ditentukan panitia'}</small>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Rincian</span>
                            <h3>Entri pada tagihan ini ({entries.length})</h3>
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <p className="small muted">Belum ada entri yang terhubung ke tagihan ini.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Lomba</th>
                                        <th>Status</th>
                                        <th>Biaya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td data-label="Kode" className="nowrap">
                                                <span className="tnum small">{entry.code}</span>
                                            </td>
                                            <td data-label="Lomba">
                                                <span>{entry.competition_name ?? '—'}</span>
                                                {entry.team_name && (
                                                    <span className="small muted" style={{ display: 'block' }}>
                                                        Tim {entry.team_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Status">
                                                <StatusBadge value={entry.status} label={entry.status_label} />
                                            </td>
                                            <td data-label="Biaya" className="num nowrap">
                                                {formatRupiah(entry.fee)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {invoice.rejection_reason && (
                    <div className="toast toast--warn" role="alert">
                        <div>
                            <p className="strong" style={{ margin: 0 }}>
                                Bukti sebelumnya ditolak
                            </p>
                            <p className="small" style={{ marginTop: 4 }}>
                                {invoice.rejection_reason}
                            </p>
                        </div>
                    </div>
                )}

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Bukti pembayaran</span>
                            <h3>Unggah bukti transfer</h3>
                            <p className="muted">
                                {invoice.has_proof
                                    ? `Terunggah ${
                                          invoice.proof_uploaded_at ? formatTanggalWaktu(invoice.proof_uploaded_at) : ''
                                      }`
                                    : 'Belum ada bukti terunggah.'}
                            </p>
                        </div>
                        {invoice.has_proof && (
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPreviewOpen(true)}>
                                <Eye size={16} aria-hidden />
                                Lihat bukti
                            </button>
                        )}
                    </div>

                    {uploadable && (
                        <>
                            <label className="label" htmlFor="proof-file">
                                Berkas bukti (JPG, PNG, atau PDF · maksimal 5 MB)
                            </label>
                            <input
                                id="proof-file"
                                ref={fileInput}
                                type="file"
                                className="input"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={(event) => form.setData('proof', event.target.files?.[0] ?? null)}
                            />
                            {form.errors.proof && (
                                <p className="error" role="alert">
                                    {form.errors.proof}
                                </p>
                            )}
                            <div className="row-gap" style={{ marginTop: 14 }}>
                                <button
                                    type="button"
                                    className="btn btn--clay"
                                    onClick={submitProof}
                                    disabled={!form.data.proof || form.processing}
                                >
                                    <Upload size={18} aria-hidden />
                                    {form.processing ? 'Mengunggah…' : 'Unggah Bukti'}
                                </button>
                                {form.data.proof && !form.processing && (
                                    <span className="small muted">Siap diunggah: {form.data.proof.name}</span>
                                )}
                            </div>
                        </>
                    )}

                    {invoice.status === 'awaiting_verification' && (
                        <p className="hint" style={{ marginTop: 12 }}>
                            <ShieldCheck size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Bukti sedang diperiksa
                            panitia. Anda akan menerima pembaruan status setelah verifikasi.
                        </p>
                    )}

                    {canManage && (
                        <p className="small" style={{ marginTop: 12 }}>
                            <Link href={route('admin.payments.index')}>Buka antrean verifikasi panitia</Link>
                        </p>
                    )}
                </section>
            </div>

            <Modal show={previewOpen} onClose={() => setPreviewOpen(false)} title={`Bukti ${invoice.number}`} wide>
                <img
                    src={route('invoices.proof', invoice.id)}
                    alt={`Bukti pembayaran ${invoice.number}`}
                    style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', marginTop: 4 }}
                />
            </Modal>
        </AuthenticatedLayout>
    );
}
