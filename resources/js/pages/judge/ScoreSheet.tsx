import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
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
        router.post(route('judge.scores.lock', entry.id), {}, {
            preserveScroll: true,
            onFinish: () => setConfirmLock(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold">Lembar Nilai</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Nilai ${entry.code}`} />

            <div className="mx-auto max-w-3xl space-y-4 p-4">
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

                <div className="rounded border border-gray-200 bg-white p-4">
                    <p className="font-mono text-xs text-gray-500">{entry.code}</p>
                    <h2 className="text-lg font-semibold">
                        {entry.team_name ?? (entry.names.join(', ') || 'Tanpa nama')}
                    </h2>
                    {entry.team_name && entry.names.length > 0 && (
                        <p className="text-sm text-gray-600">{entry.names.join(', ')}</p>
                    )}
                    {entry.school_name && <p className="text-xs text-gray-500">{entry.school_name}</p>}

                    {(entry.submission_url || entry.submission_name) && (
                        <p className="mt-2 text-sm">
                            {entry.submission_url ? (
                                <a
                                    href={entry.submission_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 underline"
                                >
                                    Buka karya {entry.submission_name ? `(${entry.submission_name})` : ''}
                                </a>
                            ) : (
                                <span className="text-gray-600">Berkas karya: {entry.submission_name}</span>
                            )}
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="rounded bg-gray-100 px-2 py-1">
                            Status: {sheet?.status_label ?? 'Belum dinilai'}
                        </span>
                        {sheet?.total !== null && sheet?.total !== undefined && (
                            <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">
                                Total: {sheet.total.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                {!rubric.is_ready && (
                    <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {rubric.message ?? 'Rubrik belum siap.'} Penilaian ditutup sampai admin memperbaiki rubrik.
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        save();
                    }}
                    className="space-y-3"
                >
                    {criteria.map((criterion, index) => (
                        <div key={criterion.id} className="rounded border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <label htmlFor={`criterion-${criterion.id}`} className="font-medium">
                                    {criterion.name}
                                </label>
                                <span className="text-xs text-gray-500">
                                    Bobot {criterion.weight} · maks {criterion.max_score}
                                </span>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    id={`criterion-${criterion.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={criterion.max_score}
                                    step="0.01"
                                    disabled={locked || !rubric.is_ready || !!competition.results_published_at}
                                    value={form.data.scores[index]?.value ?? ''}
                                    onChange={(event) => setValue(index, event.target.value)}
                                    className="min-h-11 w-32 rounded border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                <span className="text-sm text-gray-500">/ {criterion.max_score}</span>
                            </div>

                            {form.errors[`scores.${index}.value`] && (
                                <p className="mt-1 text-xs text-red-600">{form.errors[`scores.${index}.value`]}</p>
                            )}
                        </div>
                    ))}

                    <div className="rounded border border-gray-200 bg-white p-4">
                        <label htmlFor="note" className="font-medium">
                            Catatan untuk panitia (opsional)
                        </label>
                        <textarea
                            id="note"
                            rows={2}
                            disabled={locked}
                            value={form.data.note}
                            onChange={(event) => form.setData('note', event.target.value)}
                            className="mt-2 w-full rounded border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="rounded border border-gray-200 bg-white p-4 text-sm">
                        <p className="text-gray-600">
                            Total sementara: <span className="font-semibold">{preview.toFixed(2)}</span> dari 100
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Total dihitung ulang saat lembar dikunci dan menjadi nilai resmi Anda.
                        </p>
                    </div>

                    {!locked && !competition.results_published_at && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <PrimaryButton type="submit" disabled={form.processing || !rubric.is_ready}>
                                Simpan draf
                            </PrimaryButton>
                            <button
                                type="button"
                                disabled={!allFilled || !rubric.is_ready}
                                onClick={() => setConfirmLock(true)}
                                className="min-h-11 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Simpan & kunci
                            </button>
                            <Link
                                href={route('judge.entries', competition.id)}
                                className="inline-flex min-h-11 items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                                Kembali
                            </Link>
                        </div>
                    )}

                    {locked && (
                        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            Lembar sudah dikunci. Hubungi admin bila perlu diperbaiki.
                        </div>
                    )}
                </form>
            </div>

            <Modal show={confirmLock} onClose={() => setConfirmLock(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold">Kunci lembar nilai?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Setelah dikunci, nilai tidak bisa diubah sendiri. Total {preview.toFixed(2)} menjadi nilai resmi
                        Anda untuk entri {entry.code}.
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton onClick={() => setConfirmLock(false)}>Batal</SecondaryButton>
                        <PrimaryButton onClick={lock}>Ya, kunci</PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
