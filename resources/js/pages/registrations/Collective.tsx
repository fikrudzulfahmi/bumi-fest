import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Send, Upload } from 'lucide-react';
import { useState } from 'react';

interface Competition {
    id: number;
    slug: string;
    name: string;
    category: string;
    team_min: number | null;
    team_max: number | null;
    fee: number;
    quota: number | null;
}

interface PreviewError {
    row: number | null;
    message: string;
}

interface Preview {
    token?: string;
    competition_id?: number;
    entries?: number;
    errors?: PreviewError[];
    rows?: Array<Record<string, string>>;
}

interface Props {
    competition: Competition;
    level: string;
    preview: Preview | null;
}

export default function Collective({ competition, level, preview }: Props) {
    const isTeam = competition.category === 'team';
    const [confirmToken, setConfirmToken] = useState<string | null>(null);

    const activePreview = preview;

    const handlePreview = async (file: File) => {
        const data = new FormData();
        data.append('file', file);

        await router.post(
            route('collective-registrations.preview', { level, competition: competition.slug }),
            data,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                preserveScroll: true,
            }
        );
    };

    const handleCommit = (token: string) => {
        router.post(
            route('collective-registrations.commit', { level, competition: competition.slug }),
            { token },
            {
                preserveScroll: true,
                onFinish: () => setConfirmToken(null),
            }
        );
    };

    return (
        <AuthenticatedLayout header={<h1>Pendaftaran Kolektif: {competition.name}</h1>}>
            <Head title="Daftar Kolektif" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Impor massal</span>
                            <h2>Unggah daftar siswa</h2>
                            <p className="muted">
                                Impor siswa sekolah Anda lewat berkas <span className="strong">Excel (.xlsx)</span> atau{' '}
                                <span className="strong">CSV</span>. Satu berkas menjadi satu tagihan.
                            </p>
                        </div>
                        <a
                            className="btn btn--ghost btn--sm"
                            href={route('collective-registrations.template', { level, competition: competition.slug })}
                        >
                            <Download size={16} aria-hidden />
                            Unduh template CSV
                        </a>
                    </div>

                    <div className="stat-grid">
                        <div className="stat">
                            <b style={{ fontSize: '1.3rem' }}>{formatRupiah(competition.fee)}</b>
                            <span>Biaya per entri</span>
                        </div>
                        <div className="stat">
                            <b style={{ fontSize: '1.3rem' }}>{isTeam ? 'Beregu' : 'Individu'}</b>
                            <span>Kategori lomba</span>
                        </div>
                        <div className="stat">
                            <b style={{ fontSize: '1.3rem' }}>
                                {isTeam ? `${competition.team_min}–${competition.team_max}` : '1'}
                            </b>
                            <span>Anggota per entri</span>
                        </div>
                    </div>

                    <div className="hint" style={{ marginTop: 16 }}>
                        Kolom wajib: <span className="strong">nama_siswa</span>, <span className="strong">kelas</span>
                        {isTeam ? (
                            <>
                                , dan <span className="strong">tim</span>. Baris dengan nama tim sama digabung menjadi satu
                                tim ({competition.team_min}–{competition.team_max} anggota).
                            </>
                        ) : (
                            '. Satu baris mewakili satu peserta.'
                        )}
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Langkah 1</span>
                            <h3>Unggah berkas untuk pratinjau</h3>
                            <p className="muted">Berkas diperiksa lebih dulu. Tidak ada data yang disimpan di tahap ini.</p>
                        </div>
                    </div>

                    <label className="label" htmlFor="collective-file">
                        Berkas daftar siswa (.xlsx, .xls, .csv)
                    </label>
                    <input
                        id="collective-file"
                        type="file"
                        className="input"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePreview(f);
                        }}
                    />
                    <p className="hint">
                        <Upload size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Pratinjau otomatis dijalankan
                        setelah berkas dipilih.
                    </p>
                </section>

                {activePreview ? (
                    <section className="panel">
                        <div className="panel__head">
                            <div>
                                <span className="kicker">Langkah 2</span>
                                <h3>Hasil pratinjau</h3>
                                <p className="muted">
                                    <FileSpreadsheet size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Jumlah
                                    entri: <span className="strong">{activePreview.entries ?? 0}</span>
                                </p>
                            </div>
                        </div>

                        {activePreview.errors?.length ? (
                            <div className="toast toast--error" role="alert" style={{ display: 'block' }}>
                                <p className="strong" style={{ margin: 0 }}>
                                    <AlertTriangle size={16} aria-hidden style={{ verticalAlign: '-3px' }} /> Baris
                                    bermasalah ({activePreview.errors.length})
                                </p>
                                <ul className="small" style={{ margin: '8px 0 0 18px' }}>
                                    {activePreview.errors.map((e, i) => (
                                        <li key={i}>
                                            {e.row ? `Baris ${e.row}: ` : ''}
                                            {e.message}
                                        </li>
                                    ))}
                                </ul>
                                <p className="small" style={{ marginTop: 8 }}>
                                    Perbaiki berkas lalu unggah ulang. Tidak ada data yang disimpan.
                                </p>
                            </div>
                        ) : (
                            <div className="toast toast--ok" role="status">
                                <CheckCircle2 size={20} aria-hidden />
                                <span>
                                    Tidak ada baris bermasalah. {activePreview.entries ?? 0} entri siap dikirim.
                                </span>
                            </div>
                        )}

                        {!activePreview.errors?.length && activePreview.token ? (
                            <div className="row-gap" style={{ marginTop: 18 }}>
                                <button
                                    type="button"
                                    className="btn btn--clay"
                                    onClick={() => setConfirmToken(activePreview.token ?? null)}
                                >
                                    <Send size={18} aria-hidden />
                                    Langkah 3: Kirim &amp; buat tagihan
                                </button>
                            </div>
                        ) : null}
                    </section>
                ) : null}
            </div>

            <ConfirmDialog
                show={confirmToken !== null}
                title="Kirim pendaftaran kolektif?"
                message={
                    <p>
                        {activePreview?.entries ?? 0} entri akan dibuat dan satu tagihan diterbitkan untuk dibayar.
                        Periksa kembali hasil pratinjau sebelum melanjutkan.
                    </p>
                }
                confirmLabel="Ya, kirim"
                onConfirm={() => {
                    if (confirmToken) {
                        handleCommit(confirmToken);
                    }
                }}
                onCancel={() => setConfirmToken(null)}
            />
        </AuthenticatedLayout>
    );
}
