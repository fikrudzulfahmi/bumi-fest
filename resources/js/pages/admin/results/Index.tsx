import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Calculator, Lock, LockOpen, Save, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Row {
    id: number;
    code: string;
    team_name: string | null;
    names: string[];
    school_name: string | null;
    sheets_locked: number;
    sheets_total: number;
    final_score: number | null;
    placement: number | null;
    is_complete: boolean;
    rank: number | null;
    is_tie: boolean;
}

interface SheetRow {
    id: number;
    judge_name: string | null;
    registration_code: string | null;
    status: string;
    status_label: string;
    total: number | null;
    locked_at: string | null;
}

interface Props {
    competition: {
        id: number;
        name: string;
        slug: string;
        level_label: string | null;
        results_published_at: string | null;
    };
    rows: Row[];
    suggestions: Row[];
    rubric: { total_weight: number; criteria_count: number; is_ready: boolean; is_locked: boolean; message: string | null };
    judges: { id: number | null; name: string | null }[];
    sheets: SheetRow[];
}

export default function Index({ competition, rows, suggestions, rubric, judges, sheets }: Props) {
    const published = competition.results_published_at !== null;

    const [placements, setPlacements] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        rows.forEach((row) => {
            if (row.placement !== null) initial[String(row.id)] = String(row.placement);
        });
        return initial;
    });

    const [confirm, setConfirm] = useState<null | 'publish' | 'compute' | 'unlock-all'>(null);
    const [unlocking, setUnlocking] = useState<SheetRow | null>(null);
    const [allowIncomplete, setAllowIncomplete] = useState(false);
    const [busy, setBusy] = useState(false);

    const assigned = useMemo(() => Object.values(placements).filter((v) => v !== ''), [placements]);
    const duplicatePlacement = useMemo(() => {
        const seen = new Set<string>();
        for (const value of assigned) {
            if (seen.has(value) && value !== '2' && value !== '3') return true;
            seen.add(value);
        }
        return false;
    }, [assigned]);

    const setPlacement = (id: number, value: string) => {
        setPlacements((current) => ({ ...current, [String(id)]: value }));
    };

    const savePlacements = () => {
        const payload: Record<string, number> = {};
        Object.entries(placements).forEach(([id, value]) => {
            if (value !== '') payload[id] = Number(value);
        });
        router.post(route('admin.results.placements', competition.id), { placements: payload }, { preserveScroll: true });
    };

    const doCompute = () => {
        setBusy(true);
        router.post(route('admin.results.compute', competition.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const doPublish = () => {
        setBusy(true);
        router.post(
            route('admin.results.publish', competition.id),
            { allow_incomplete: allowIncomplete },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    setConfirm(null);
                },
            },
        );
    };

    const doUnlockAll = () => {
        setBusy(true);
        router.post(route('admin.results.unlock-all', competition.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const doUnlock = () => {
        if (!unlocking) return;
        setBusy(true);
        router.post(route('admin.results.unlock', unlocking.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                setUnlocking(null);
            },
        });
    };

    const incompleteCount = rows.filter((row) => !row.is_complete).length;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Hasil Lomba</h1>
                    <p className="muted small">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Hasil ${competition.name}`} />

            <FlashMessage />

            <div className="stat-grid">
                <div className="stat">
                    <b>{rows.length}</b>
                    <span>Entri terverifikasi</span>
                </div>
                <div className="stat">
                    <b>{judges.length}</b>
                    <span>Juri ditugaskan</span>
                </div>
                <div className="stat">
                    <b>{rubric.total_weight}</b>
                    <span>Total bobot rubrik</span>
                    <small className="muted">{rubric.criteria_count} kriteria penilaian</small>
                </div>
                <div className="stat">
                    <b>{incompleteCount}</b>
                    <span>Entri belum lengkap</span>
                    <small className="muted">Semua juri belum mengunci</small>
                </div>
            </div>

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <h2>Tindakan hasil</h2>
                        <p className="muted">
                            Hitung nilai akhir, tetapkan juara, lalu terbitkan hasil ke portal peserta.
                        </p>
                        <div className="row-gap" style={{ marginTop: 10 }}>
                            <span className="badge badge--neutral">{rows.length} entri</span>
                            <span className="badge badge--neutral">{judges.length} juri</span>
                            {rubric.is_ready ? (
                                <span className="badge badge--ok">Rubrik siap</span>
                            ) : (
                                <span className="badge badge--wait">Rubrik belum siap</span>
                            )}
                            {published ? (
                                <span className="badge badge--ok">Hasil sudah terbit</span>
                            ) : (
                                <span className="badge badge--info">Belum terbit</span>
                            )}
                        </div>
                    </div>

                    <div className="row-gap">
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setConfirm('compute')}
                            disabled={published}
                        >
                            <Calculator size={16} aria-hidden />
                            Hitung ulang
                        </button>
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setConfirm('unlock-all')}
                            disabled={published}
                        >
                            <LockOpen size={16} aria-hidden />
                            Buka semua kunci
                        </button>
                        <button
                            type="button"
                            className="btn btn--clay btn--sm"
                            onClick={() => setConfirm('publish')}
                            disabled={published}
                        >
                            <Send size={16} aria-hidden />
                            {published ? 'Sudah terbit' : 'Terbitkan hasil'}
                        </button>
                    </div>
                </div>
            </div>

            {!rubric.is_ready && (
                <div className="toast toast--warn" role="alert">
                    <AlertTriangle size={20} aria-hidden />
                    <span>
                        {rubric.message ?? 'Rubrik belum siap.'}{' '}
                        <Link href={route('admin.rubrics.edit', competition.id)} className="strong">
                            Perbaiki rubrik
                        </Link>
                    </span>
                </div>
            )}

            {incompleteCount > 0 && (
                <div className="toast toast--warn" role="alert">
                    <AlertTriangle size={20} aria-hidden />
                    <span>{incompleteCount} entri belum punya nilai lengkap (semua juri terkunci).</span>
                </div>
            )}

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <h2>Peringkat &amp; nilai akhir</h2>
                        <p className="muted">
                            Peringkat dihitung dari rata-rata lembar nilai terkunci seluruh juri.
                        </p>
                    </div>
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title="Belum ada entri terverifikasi"
                        description="Entri akan muncul di sini setelah pendaftaran diverifikasi panitia."
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Peringkat</th>
                                    <th>Kode</th>
                                    <th>Peserta</th>
                                    <th>Sekolah</th>
                                    <th>Lembar</th>
                                    <th>Nilai akhir</th>
                                    <th>Juara</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Peringkat" className="num strong">
                                            {row.rank ?? '—'}
                                        </td>
                                        <td data-label="Kode" className="small nowrap">
                                            {row.code}
                                        </td>
                                        <td data-label="Peserta">
                                            <p className="strong">
                                                {row.team_name ?? (row.names.join(', ') || 'Tanpa nama')}
                                            </p>
                                            {row.team_name && row.names.length > 0 && (
                                                <p className="small muted">{row.names.join(', ')}</p>
                                            )}
                                        </td>
                                        <td data-label="Sekolah" className="small muted">
                                            {row.school_name ?? '—'}
                                        </td>
                                        <td data-label="Lembar" className="num small">
                                            {row.sheets_locked}/{row.sheets_total}
                                        </td>
                                        <td data-label="Nilai akhir" className="num strong">
                                            <span className="row-gap" style={{ gap: 8 }}>
                                                {row.final_score !== null ? row.final_score.toFixed(2) : '—'}
                                                {row.is_tie && <span className="badge badge--wait">Seri</span>}
                                            </span>
                                        </td>
                                        <td data-label="Juara">
                                            <select
                                                aria-label={`Juara entri ${row.code}`}
                                                value={placements[String(row.id)] ?? ''}
                                                disabled={published || !row.is_complete}
                                                onChange={(event) => setPlacement(row.id, event.target.value)}
                                                className="select"
                                                style={{ maxWidth: 110 }}
                                            >
                                                <option value="">—</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!published && (
                <div className="panel">
                    <div className="panel__head">
                        <div>
                            <h2>Tetapkan juara</h2>
                            <p className="muted">
                                Saran dari peringkat: {suggestions.length} entri
                                {suggestions.length > 0 && ` (${suggestions.map((row) => `#${row.rank}`).join(', ')})`}.
                                Peringkat boleh dipakai bersama bila seri.
                            </p>
                        </div>
                        <button type="button" className="btn btn--clay btn--sm" onClick={savePlacements} disabled={duplicatePlacement}>
                            <Save size={16} aria-hidden />
                            Simpan juara
                        </button>
                    </div>
                    {duplicatePlacement && (
                        <p className="error" role="alert">
                            Peringkat 1 hanya boleh satu entri. Peringkat 2 dan 3 boleh dipakai bersama bila seri.
                        </p>
                    )}
                </div>
            )}

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <h2>Lembar nilai</h2>
                        <p className="muted">
                            Buka kunci hanya bila hasil belum diterbitkan. Setelah dibuka, juri wajib mengunci ulang.
                        </p>
                    </div>
                    <span className="badge badge--neutral">{sheets.length} lembar</span>
                </div>

                {sheets.length === 0 ? (
                    <EmptyState title="Belum ada nilai tersimpan" description="Lembar nilai muncul setelah juri menyimpan penilaian." />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>Juri</th>
                                    <th>Entri</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sheets.map((sheet) => (
                                    <tr key={sheet.id}>
                                        <td data-label="Juri" className="strong">
                                            {sheet.judge_name ?? 'Juri'}
                                        </td>
                                        <td data-label="Entri" className="small nowrap">
                                            {sheet.registration_code ?? '—'}
                                        </td>
                                        <td data-label="Status">
                                            <StatusBadge value={sheet.status} label={sheet.status_label} />
                                        </td>
                                        <td data-label="Total" className="num">
                                            {sheet.total !== null ? sheet.total.toFixed(2) : '—'}
                                        </td>
                                        <td data-label="Aksi">
                                            {sheet.status === 'locked' ? (
                                                <button
                                                    type="button"
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => setUnlocking(sheet)}
                                                    disabled={published}
                                                >
                                                    <LockOpen size={15} aria-hidden />
                                                    Buka kunci
                                                </button>
                                            ) : (
                                                <span className="small muted nowrap">
                                                    <Lock size={14} aria-hidden /> Menunggu kunci juri
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                show={confirm === 'compute'}
                title="Hitung ulang nilai akhir?"
                message={
                    <p>
                        Nilai akhir dihitung dari rata-rata lembar terkunci semua juri. Entri yang belum lengkap tetap tanpa
                        nilai.
                    </p>
                }
                confirmLabel="Ya, hitung ulang"
                processing={busy}
                onConfirm={doCompute}
                onCancel={() => setConfirm(null)}
            />

            <ConfirmDialog
                show={confirm === 'unlock-all'}
                danger
                title="Buka semua kunci?"
                message={
                    <p>
                        Semua lembar nilai kembali menjadi draf dan totalnya dikosongkan. Juri harus mengunci ulang sebelum
                        hasil bisa diterbitkan.
                    </p>
                }
                confirmLabel="Ya, buka semua kunci"
                processing={busy}
                onConfirm={doUnlockAll}
                onCancel={() => setConfirm(null)}
            />

            <ConfirmDialog
                show={confirm === 'publish'}
                title="Terbitkan hasil lomba?"
                message={
                    <>
                        <p>
                            Juara tampil di portal dan peserta menerima notifikasi. Sertifikat mulai dibuat di antrean.
                            Tindakan ini tidak bisa dibatalkan.
                        </p>
                        {incompleteCount > 0 && (
                            <label className="check">
                                <input
                                    type="checkbox"
                                    checked={allowIncomplete}
                                    onChange={(event) => setAllowIncomplete(event.target.checked)}
                                />
                                <span>
                                    Terbitkan walau {incompleteCount} entri belum lengkap (entri itu tanpa peringkat).
                                </span>
                            </label>
                        )}
                    </>
                }
                confirmLabel="Ya, terbitkan"
                processing={busy}
                onConfirm={doPublish}
                onCancel={() => setConfirm(null)}
            />

            <ConfirmDialog
                show={unlocking !== null}
                danger
                title="Buka kunci lembar ini?"
                message={
                    <p>
                        Lembar {unlocking?.judge_name ?? 'juri'} untuk entri {unlocking?.registration_code ?? '—'} kembali
                        menjadi draf dan totalnya dikosongkan.
                    </p>
                }
                confirmLabel="Buka kunci"
                processing={busy}
                onConfirm={doUnlock}
                onCancel={() => setUnlocking(null)}
            />
        </AuthenticatedLayout>
    );
}
