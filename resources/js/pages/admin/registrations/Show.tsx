import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Modal from '@/Components/app/Modal';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah, formatTanggalWaktu } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, PencilLine, Receipt } from 'lucide-react';
import { useState } from 'react';

interface Member {
    id: number;
    position: number;
    participant: {
        id: number;
        name: string;
        grade: number | null;
        level: string | null;
        level_label?: string | null;
        school_name: string | null;
        school_city: string | null;
    } | null;
}

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    status_color: string;
    team_name: string | null;
    fee: number;
    placement: string | null;
    final_score: number | null;
    submitted_at: string | null;
    competition?: { id: number; name: string; level: string; level_label?: string | null };
    owner?: { id: number; name: string; email: string; whatsapp: string | null };
    invoice: { id: number; number: string; status: string; status_label: string; total: number; due_at: string | null } | null;
    documents?: Array<{ id: number; type: string; type_label: string; original_name: string; size: number }>;
    members?: Member[];
}

interface Props {
    registration: Registration;
}

function ukuran(bytes: number): string {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (bytes >= 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${bytes} B`;
}

export default function Show({ registration }: Props) {
    const [editing, setEditing] = useState<Member | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const openEdit = (member: Member) => {
        setEditing(member);
        setName(member.participant?.name ?? '');
        setLocalError(null);
    };

    const submitName = () => {
        if (!editing?.participant) return;

        if (name.trim().length < 3) {
            setLocalError('Nama siswa minimal 3 karakter.');
            return;
        }

        setLocalError(null);
        setBusy(true);
        router.patch(
            route('admin.participants.correct-name', editing.participant.id),
            { name: name.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(null),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Entri {registration.code}</span>
                    <h1>Detail Pendaftaran</h1>
                </div>
            }
        >
            <Head title={`Entri ${registration.code}`} />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    Rincian entri, siswa terdaftar, dokumen, dan tagihan.
                </p>
                <Link href={route('admin.registrations.index')} className="btn btn--ghost btn--sm">
                    <ArrowLeft size={16} aria-hidden />
                    Kembali ke daftar
                </Link>
            </div>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">{registration.code}</span>
                        <h2>{registration.competition?.name ?? '—'}</h2>
                        <p className="muted">
                            Jenjang {registration.competition?.level_label ?? registration.competition?.level ?? '—'}
                            {registration.team_name ? ` · Tim ${registration.team_name}` : ''}
                        </p>
                    </div>
                    <StatusBadge value={registration.status} label={registration.status_label} />
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 18,
                    }}
                >
                    <div>
                        <span className="kicker">Pemilik akun</span>
                        <p className="strong" style={{ marginTop: 4 }}>
                            {registration.owner?.name ?? '—'}
                        </p>
                        <p className="small muted">{registration.owner?.email ?? '—'}</p>
                        <p className="small muted">{registration.owner?.whatsapp ?? '—'}</p>
                    </div>
                    <div>
                        <span className="kicker">Biaya pendaftaran</span>
                        <p className="strong tnum" style={{ marginTop: 4 }}>
                            {formatRupiah(registration.fee)}
                        </p>
                    </div>
                    <div>
                        <span className="kicker">Dikirim</span>
                        <p className="strong" style={{ marginTop: 4 }}>
                            {registration.submitted_at ? formatTanggalWaktu(registration.submitted_at) : '—'}
                        </p>
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Peserta</span>
                        <h3>Siswa terdaftar</h3>
                    </div>
                    <span className="badge badge--neutral">{(registration.members ?? []).length} siswa</span>
                </div>

                {(registration.members ?? []).length === 0 ? (
                    <EmptyState title="Belum ada siswa" description="Entri ini belum memiliki peserta terdaftar." />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Nama siswa</th>
                                    <th>Kelas</th>
                                    <th>Sekolah</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(registration.members ?? []).map((member) => (
                                    <tr key={member.id}>
                                        <td data-label="No." className="num nowrap">
                                            {member.position}
                                        </td>
                                        <td data-label="Nama siswa" className="strong">
                                            {member.participant?.name ?? '—'}
                                        </td>
                                        <td data-label="Kelas">{member.participant?.grade ?? '—'}</td>
                                        <td data-label="Sekolah">
                                            {member.participant?.school_name ?? '—'}
                                            <span className="small muted" style={{ display: 'block' }}>
                                                {member.participant?.school_city ?? ''}
                                            </span>
                                        </td>
                                        <td data-label="Aksi">
                                            {member.participant && (
                                                <button
                                                    type="button"
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => openEdit(member)}
                                                >
                                                    <PencilLine size={15} aria-hidden />
                                                    Koreksi nama
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Berkas</span>
                        <h3>Dokumen pendukung</h3>
                    </div>
                </div>

                {(registration.documents ?? []).length === 0 ? (
                    <EmptyState title="Belum ada dokumen" description="Peserta belum mengunggah berkas pendukung." />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Jenis</th>
                                    <th>Nama berkas</th>
                                    <th>Ukuran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(registration.documents ?? []).map((doc) => (
                                    <tr key={doc.id}>
                                        <td data-label="Jenis" className="strong">
                                            {doc.type_label}
                                        </td>
                                        <td data-label="Nama berkas">{doc.original_name}</td>
                                        <td data-label="Ukuran" className="num nowrap">
                                            {ukuran(doc.size)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="panel">
                <div className="panel__head">
                    <div>
                        <span className="kicker">Keuangan</span>
                        <h3>Tagihan</h3>
                    </div>
                    {registration.invoice && (
                        <Link
                            href={route('invoices.show', registration.invoice.id)}
                            className="btn btn--ghost btn--sm"
                        >
                            <ExternalLink size={15} aria-hidden />
                            Lihat tagihan
                        </Link>
                    )}
                </div>

                {registration.invoice ? (
                    <div className="row-between">
                        <div>
                            <p className="strong tnum">{registration.invoice.number}</p>
                            <StatusBadge
                                value={registration.invoice.status}
                                label={registration.invoice.status_label}
                            />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="strong tnum" style={{ fontSize: 20 }}>
                                {formatRupiah(registration.invoice.total)}
                            </p>
                            <p className="small muted">
                                {registration.invoice.due_at
                                    ? `Jatuh tempo ${formatTanggalWaktu(registration.invoice.due_at)}`
                                    : 'Tanpa jatuh tempo'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="row-gap muted">
                        <Receipt size={18} aria-hidden />
                        <span>Belum ada tagihan untuk entri ini.</span>
                    </div>
                )}
            </section>

            <Modal show={editing !== null} onClose={() => setEditing(null)} title="Koreksi nama siswa">
                <p className="small muted">
                    Perubahan dicatat sebagai koreksi admin. Gunakan hanya untuk perbaikan ejaan.
                </p>

                <div style={{ marginTop: 16 }}>
                    <Field
                        label="Nama siswa"
                        htmlFor="correct-name"
                        error={localError ?? undefined}
                        hint="Minimal 3 karakter."
                        required
                    >
                        <input
                            id="correct-name"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>
                </div>

                <div className="modal__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)} disabled={busy}>
                        Batal
                    </button>
                    <button type="button" className="btn btn--clay" onClick={submitName} disabled={busy}>
                        {busy ? 'Menyimpan…' : 'Simpan koreksi'}
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
