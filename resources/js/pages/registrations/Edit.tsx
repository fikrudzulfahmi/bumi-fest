import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowLeftRight, Check, FileUp, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Registration {
    id: number;
    code: string;
    status: string;
    team_name: string | null;
    submission_url: string | null;
    submission_name: string | null;
    requirements_accepted_at: string | null;
    consented_at: string | null;
}

interface Competition {
    id: number;
    slug: string;
    name: string;
    category: string;
    team_min: number | null;
    team_max: number | null;
    required_documents: string[] | null;
    submission_mode: string;
}

interface Participant {
    id: number;
    name: string;
    grade: number;
    school_name: string;
}

interface Member {
    id: number;
    name: string;
    grade: number;
    school_name: string;
    uploaded_documents: string[];
}

interface Props {
    registration: Registration;
    competition: Competition;
    participants: Participant[];
    members: Member[];
    level: string;
}

interface SwapRequest {
    out: number;
    in: number;
}

export default function Edit({ registration, competition, participants, members, level }: Props) {
    const isLocked = registration.status === 'awaiting_verification' || registration.status === 'verified';
    const [memberForDoc, setMemberForDoc] = useState(0);
    const [docType, setDocType] = useState('');
    const [swapOut, setSwapOut] = useState(members[0]?.id ?? 0);
    const [swapIn, setSwapIn] = useState(0);
    const [confirmSwap, setConfirmSwap] = useState<SwapRequest | null>(null);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const uploadDocument = async (memberId: number, file: File) => {
        const data = new FormData();
        data.append('participant_id', String(memberId));
        data.append('document_type', docType);
        data.append('file', file);

        await router.post(route('registrations.upload-document', registration.id), data, {
            headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
            preserveScroll: true,
        });
    };

    const swap = async (outId: number, inId: number) => {
        await router.post(
            route('registrations.swap-member', registration.id),
            { out_participant_id: outId, in_participant_id: inId },
            { preserveScroll: true, onFinish: () => setConfirmSwap(null) }
        );
    };

    const activeMember = members.find((m) => m.id === memberForDoc) ?? members[0];

    const submit = () => {
        router.post(
            route('registrations.submit', { level, competition: competition.slug, registration: registration.id }),
            {},
            { onFinish: () => setConfirmSubmit(false) }
        );
    };

    const cancel = () => {
        router.post(route('registrations.cancel', registration.id), {}, { onFinish: () => setConfirmCancel(false) });
    };

    const swapTarget = swapIn > 0 ? participants.find((p) => p.id === swapIn) : undefined;
    const swapSource = members.find((m) => m.id === swapOut);

    return (
        <AuthenticatedLayout header={<h1>Pendaftaran: {competition.name}</h1>}>
            <Head title="Detail Pendaftaran" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Ringkasan entri</span>
                            <h2>{registration.team_name ?? competition.name}</h2>
                            <p className="muted">
                                Nomor pendaftaran <span className="tnum strong">{registration.code || '(belum dibuat)'}</span>
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('registrations.index')}>
                            <ArrowLeft size={16} aria-hidden />
                            Daftar pendaftaran
                        </Link>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <span>Status entri</span>
                            <div style={{ marginTop: 8 }}>
                                <StatusBadge value={registration.status} />
                            </div>
                        </div>
                        <div className="stat">
                            <span>Nama tim</span>
                            <b style={{ fontSize: '1.2rem' }}>{registration.team_name ?? '—'}</b>
                        </div>
                        <div className="stat">
                            <span>Persetujuan juknis</span>
                            <b style={{ fontSize: '1.2rem' }}>{registration.consented_at ? 'Disetujui' : 'Belum'}</b>
                            <small>{registration.consented_at ? 'Terverifikasi sistem' : 'Perlu persetujuan peserta'}</small>
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Anggota</span>
                            <h3>Siswa yang ikut</h3>
                            <p className="muted">{members.length} siswa terdaftar pada entri ini.</p>
                        </div>
                    </div>

                    {members.length > 0 ? (
                        <div className="stack-sm">
                            {members.map((m) => (
                                <div key={m.id} className="row-between" style={{ gap: 12 }}>
                                    <div>
                                        <span className="strong">{m.name}</span>
                                        <span className="small muted" style={{ display: 'block' }}>
                                            Kelas {m.grade} · {m.school_name}
                                        </span>
                                    </div>
                                    <div className="row-gap" style={{ gap: 6 }}>
                                        {m.uploaded_documents.length > 0 ? (
                                            m.uploaded_documents.map((doc) => (
                                                <span key={doc} className="tag tag--saffron">
                                                    {doc}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="small muted">Belum ada dokumen</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="small muted">Daftar siswa belum terbentuk. Lengkapi pilihan siswa pada draf.</p>
                    )}
                </section>

                {competition.required_documents?.length ? (
                    <section className="panel">
                        <div className="panel__head">
                            <div>
                                <span className="kicker">Berkas</span>
                                <h3>Dokumen wajib</h3>
                                <p className="muted">Unggah satu dokumen per siswa yang mengikuti lomba.</p>
                            </div>
                        </div>

                        <ul className="small muted" style={{ margin: '0 0 16px 18px' }}>
                            {competition.required_documents.map((d) => (
                                <li key={d}>{d}</li>
                            ))}
                        </ul>

                        <div className="row-gap" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <label className="label" htmlFor="doc-member">
                                    Siswa
                                </label>
                                <select
                                    id="doc-member"
                                    className="select"
                                    value={activeMember?.id ?? 0}
                                    onChange={(e) => setMemberForDoc(Number(e.target.value))}
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} — Kelas {m.grade}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: '1 1 220px' }}>
                                <label className="label" htmlFor="doc-type">
                                    Jenis dokumen
                                </label>
                                <select
                                    id="doc-type"
                                    className="select"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                >
                                    <option value="">Pilih dokumen</option>
                                    {competition.required_documents.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label className="label" htmlFor="doc-file" style={{ display: 'block', marginBottom: 6 }}>
                            Berkas (jpg/png/pdf, maksimal 5 MB)
                        </label>
                        <input
                            id="doc-file"
                            type="file"
                            className="input"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f && activeMember) uploadDocument(activeMember.id, f);
                            }}
                        />

                        {activeMember?.uploaded_documents.length ? (
                            <p className="small" style={{ marginTop: 10, color: 'var(--moss)' }}>
                                <Check size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Terunggah:{' '}
                                {activeMember.uploaded_documents.join(', ')}
                            </p>
                        ) : null}
                    </section>
                ) : null}

                {members.length > 0 && !isLocked && (
                    <section className="panel">
                        <div className="panel__head">
                            <div>
                                <span className="kicker">Perubahan anggota</span>
                                <h3>Ganti anggota</h3>
                                <p className="muted">Biaya pendaftaran tidak berubah saat mengganti anggota.</p>
                            </div>
                        </div>

                        <div className="row-gap" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <label className="label" htmlFor="swap-out">
                                    Anggota keluar
                                </label>
                                <select
                                    id="swap-out"
                                    className="select"
                                    value={swapOut}
                                    onChange={(e) => setSwapOut(Number(e.target.value))}
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} (keluar)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: '1 1 220px' }}>
                                <label className="label" htmlFor="swap-in">
                                    Pengganti
                                </label>
                                <select
                                    id="swap-in"
                                    className="select"
                                    value={swapIn}
                                    onChange={(e) => setSwapIn(Number(e.target.value))}
                                >
                                    <option value={0}>Pilih pengganti…</option>
                                    {participants
                                        .filter((p) => !members.some((m) => m.id === p.id))
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                disabled={!swapOut || !swapIn}
                                onClick={() => setConfirmSwap({ out: swapOut, in: swapIn })}
                            >
                                <ArrowLeftRight size={16} aria-hidden />
                                Ganti
                            </button>
                        </div>
                    </section>
                )}

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Langkah berikutnya</span>
                            <h3>Kirim atau batalkan entri</h3>
                            <p className="muted">
                                Entri yang dikirim akan menahan slot dan menerbitkan tagihan pembayaran.
                            </p>
                        </div>
                    </div>

                    <div className="row-gap" style={{ flexWrap: 'wrap' }}>
                        {!isLocked && registration.status === 'draft' && (
                            <button type="button" className="btn btn--clay" onClick={() => setConfirmSubmit(true)}>
                                <Send size={18} aria-hidden />
                                Kirim Pendaftaran
                            </button>
                        )}
                        {!isLocked && ['awaiting_payment', 'rejected'].includes(registration.status) && (
                            <button type="button" className="btn btn--danger" onClick={() => setConfirmCancel(true)}>
                                <XCircle size={18} aria-hidden />
                                Batalkan
                            </button>
                        )}
                        <Link className="btn btn--ghost" href={route('registrations.index')}>
                            Kembali ke Daftar
                        </Link>
                    </div>
                </section>
            </div>

            <ConfirmDialog
                show={confirmSwap !== null}
                title="Ganti anggota tim?"
                message={
                    <p>
                        <span className="strong">{swapSource?.name ?? 'Anggota'}</span> akan diganti oleh{' '}
                        <span className="strong">{swapTarget?.name ?? 'anggota baru'}</span>. Biaya pendaftaran tidak
                        berubah.
                    </p>
                }
                confirmLabel="Ya, ganti"
                onConfirm={() => {
                    if (confirmSwap) {
                        swap(confirmSwap.out, confirmSwap.in);
                    }
                }}
                onCancel={() => setConfirmSwap(null)}
            />

            <ConfirmDialog
                show={confirmSubmit}
                title="Kirim pendaftaran?"
                message={
                    <p>
                        Slot peserta akan ditahan dan tagihan pembayaran dibuat. Setelah dikirim, daftar anggota tidak
                        bisa diubah sampai panitia memverifikasi.
                    </p>
                }
                confirmLabel="Ya, kirim"
                onConfirm={submit}
                onCancel={() => setConfirmSubmit(false)}
            />

            <ConfirmDialog
                show={confirmCancel}
                title="Batalkan pendaftaran?"
                message={
                    <p>
                        Pendaftaran <span className="strong">{registration.code || competition.name}</span> akan
                        dibatalkan permanen dan slot peserta dilepas.
                    </p>
                }
                confirmLabel="Ya, batalkan"
                cancelLabel="Tidak jadi"
                danger
                onConfirm={cancel}
                onCancel={() => setConfirmCancel(false)}
            />
        </AuthenticatedLayout>
    );
}
