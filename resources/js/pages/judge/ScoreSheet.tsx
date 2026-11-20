import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Lock, Save, School } from 'lucide-react';
import { useState } from 'react';

interface Criterion {
    id: number;
    name: string;
    weight: number;
    max_score: number;
}

interface Sheet {
    status: string;
    status_label: string;
    total: number | null;
    note: string | null;
    locked_at: string | null;
    values: Record<string, number>;
}

interface Props {
    competition: {
        id: number;
        name: string;
        level_label: string | null;
        results_published_at: string | null;
    };
    entry: {
        id: number;
        code: string;
        team_name: string | null;
        names: string[];
        school_name: string | null;
        submission_url: string | null;
        submission_name: string | null;
    };
    criteria: Criterion[];
    sheet: Sheet | null;
    rubric: { total_weight: number; criteria_count: number; is_ready: boolean; is_locked: boolean; message: string | null };
}

export default function ScoreSheet({ competition, entry, criteria, sheet, rubric }: Props) {
    const locked = sheet?.status === 'locked';

    const form = useForm<{ scores: { criterion_id: number; value: string }[]; note: string }>({
        scores: criteria.map((criterion) => ({
            criterion_id: criterion.id,
            value: sheet?.values[String(criterion.id)] !== undefined ? String(sheet.values[String(criterion.id)]) : '',
        })),
        note: sheet?.note ?? '',
    });

    const [confirmLock, setConfirmLock] = useState(false);

    const setValue = (index: number, value: string) => {
        const next = [...form.data.scores];
        next[index] = { ...next[index], value };
        form.setData('scores', next);
    };

    const preview = criteria.reduce((sum, criterion, index) => {
        const raw = Number(form.data.scores[index]?.value);
        if (form.data.scores[index]?.value === '' || Number.isNaN(raw)) return sum;
        return sum + (raw / Math.max(1, criterion.max_score)) * criterion.weight;
    }, 0);

    const allFilled = form.data.scores.every((row) => row.value !== '' && !Number.isNaN(Number(row.value)));

    const save = () => {
        form.put(route('judge.scores.update', entry.id), { preserveScroll: true });
    };

    const lock = () => {
        router.post(
            route('judge.scores.lock', entry.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setConfirmLock(false),
            }
        );
    };

    const hasilTerbit = Boolean(competition.results_published_at);

    return (
        <AuthenticatedLayout header={<h1>Lembar Nilai {entry.code}</h1>}>
            <Head title={`Nilai ${entry.code}`} />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">
                                {competition.name} · jenjang {competition.level_label ?? '—'}
                            </span>
                            <h2>{entry.team_name ?? (entry.names.join(', ') || 'Tanpa nama')}</h2>
                            <p className="muted">
                                Kode entri <span className="tnum strong">{entry.code}</span>
                                {entry.school_name && (
                                    <>
                                        {' '}
                                        · <School size={13} aria-hidden style={{ verticalAlign: '-2px' }} />{' '}
                                        {entry.school_name}
                                    </>
                                )}
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('judge.entries', competition.id)}>
                            <ArrowLeft size={16} aria-hidden />
                            Daftar entri
                        </Link>
                    </div>

                    <div className="row-gap" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <StatusBadge value={sheet?.status ?? ''} label={sheet?.status_label ?? 'Belum dinilai'} />
                        {sheet?.total !== null && sheet?.total !== undefined && (
                            <span className="badge badge--ok">Total {sheet.total.toFixed(2)}</span>
                        )}
                        {entry.team_name && entry.names.length > 0 && (
                            <span className="tag">Anggota: {entry.names.join(', ')}</span>
                        )}
                    </div>

                    {(entry.submission_url || entry.submission_name) && (
                        <p className="small" style={{ marginTop: 14 }}>
                            {entry.submission_url ? (
                                <a href={entry.submission_url} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
                                    <ExternalLink size={16} aria-hidden />
                                    Buka karya {entry.submission_name ? `(${entry.submission_name})` : ''}
                                </a>
                            ) : (
                                <span className="muted">Berkas karya: {entry.submission_name}</span>
                            )}
                        </p>
                    )}
                </section>

                {!rubric.is_ready && (
                    <div className="toast toast--warn" role="alert">
                        <div>
                            <p className="strong" style={{ margin: 0 }}>
                                Rubrik belum siap
                            </p>
                            <p className="small" style={{ marginTop: 4 }}>
                                {rubric.message ?? 'Rubrik belum siap.'} Penilaian ditutup sampai admin memperbaiki rubrik.
                            </p>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        save();
                    }}
                    className="stack"
                >
                    <section className="panel">
                        <div className="panel__head">
                            <div>
                                <span className="kicker">Rubrik penilaian</span>
                                <h3>Kriteria ({rubric.criteria_count})</h3>
                                <p className="muted">
                                    Total bobot {rubric.total_weight}. Isi nilai sesuai skala maksimum tiap kriteria.
                                </p>
                            </div>
                        </div>

                        {criteria.map((criterion, index) => (
                            <div key={criterion.id} className="field">
                                <div className="row-between" style={{ gap: 10 }}>
                                    <label className="label" htmlFor={`criterion-${criterion.id}`}>
                                        {criterion.name}
                                    </label>
                                    <span className="small muted">
                                        Bobot {criterion.weight} · maks {criterion.max_score}
                                    </span>
                                </div>

                                <div className="row-gap" style={{ gap: 10 }}>
                                    <input
                                        id={`criterion-${criterion.id}`}
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        max={criterion.max_score}
                                        step="0.01"
                                        disabled={locked || !rubric.is_ready || hasilTerbit}
                                        value={form.data.scores[index]?.value ?? ''}
                                        onChange={(event) => setValue(index, event.target.value)}
                                        className="input"
                                        style={{ maxWidth: 160 }}
                                        required
                                    />
                                    <span className="small muted">/ {criterion.max_score}</span>
                                </div>

                                {form.errors[`scores.${index}.value`] && (
                                    <p className="error" role="alert">
                                        {form.errors[`scores.${index}.value`]}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="field">
                            <label className="label" htmlFor="note">
                                Catatan untuk panitia (opsional)
                            </label>
                            <textarea
                                id="note"
                                className="textarea"
                                rows={3}
                                disabled={locked}
                                value={form.data.note}
                                onChange={(event) => form.setData('note', event.target.value)}
                            />
                        </div>

                        <div className="divider" />

                        <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <span className="kicker">Total sementara</span>
                                <div className="strong" style={{ fontFamily: 'var(--D)', fontSize: '1.6rem' }}>
                                    {preview.toFixed(2)} <span className="small muted">dari 100</span>
                                </div>
                            </div>
                            <p className="small muted" style={{ maxWidth: '38ch', margin: 0 }}>
                                Total dihitung ulang saat lembar dikunci dan menjadi nilai resmi Anda.
                            </p>
                        </div>
                    </section>

                    {!locked && !hasilTerbit && (
                        <section className="panel">
                            <div className="row-gap" style={{ flexWrap: 'wrap' }}>
                                <button
                                    type="submit"
                                    className="btn btn--clay"
                                    disabled={form.processing || !rubric.is_ready}
                                >
                                    <Save size={18} aria-hidden />
                                    {form.processing ? 'Menyimpan…' : 'Simpan draf'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--moss"
                                    disabled={!allFilled || !rubric.is_ready}
                                    onClick={() => setConfirmLock(true)}
                                >
                                    <Lock size={18} aria-hidden />
                                    Simpan &amp; kunci
                                </button>
                                <Link className="btn btn--ghost" href={route('judge.entries', competition.id)}>
                                    Kembali
                                </Link>
                            </div>
                            {!allFilled && (
                                <p className="hint" style={{ marginTop: 10 }}>
                                    Semua kriteria harus terisi sebelum lembar bisa dikunci.
                                </p>
                            )}
                        </section>
                    )}

                    {locked && (
                        <div className="toast toast--ok" role="status">
                            <Lock size={20} aria-hidden />
                            <span>Lembar sudah dikunci. Hubungi panitia bila perlu diperbaiki.</span>
                        </div>
                    )}
                </form>
            </div>

            <ConfirmDialog
                show={confirmLock}
                title="Kunci lembar nilai?"
                message={
                    <p>
                        Setelah dikunci, nilai tidak bisa diubah sendiri. Total{' '}
                        <span className="strong">{preview.toFixed(2)}</span> menjadi nilai resmi Anda untuk entri{' '}
                        <span className="strong">{entry.code}</span>.
                    </p>
                }
                confirmLabel="Ya, kunci"
                cancelLabel="Batal"
                onConfirm={lock}
                onCancel={() => setConfirmLock(false)}
            />
        </AuthenticatedLayout>
    );
}
