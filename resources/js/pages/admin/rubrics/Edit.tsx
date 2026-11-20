import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Info, Lock, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Criterion {
    id?: number;
    name: string;
    weight: number;
    max_score: number;
}

interface RubricSummary {
    total_weight: number;
    criteria_count: number;
    is_ready: boolean;
    is_locked: boolean;
    message: string | null;
}

interface Props {
    competition: { id: number; name: string; level: string; level_label: string | null };
    criteria: Criterion[];
    rubric: RubricSummary;
}

type Row = { name: string; weight: string; max_score: string };

const emptyRow = (): Row => ({ name: '', weight: '', max_score: '100' });

export default function Edit({ competition, criteria, rubric }: Props) {
    const [rows, setRows] = useState<Row[]>(
        criteria.length > 0
            ? criteria.map((c) => ({ name: c.name, weight: String(c.weight), max_score: String(c.max_score) }))
            : [emptyRow()],
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<number>(0);
    const [resetOpen, setResetOpen] = useState(false);

    const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
    const ready = rows.length > 0 && total === 100;

    const updateRow = (index: number, patch: Partial<Row>) => {
        setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    };

    const addRow = () => setRows([...rows, emptyRow()]);

    const removeRow = (index: number) => {
        const next = rows.filter((_, i) => i !== index);
        setRows(next.length > 0 ? next : [emptyRow()]);
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) return;

        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        setRows(next);
    };

    const save = () => {
        setSaving(1);
        router.put(
            route('admin.rubrics.update', competition.id),
            {
                criteria: rows
                    .filter((row) => row.name.trim() !== '')
                    .map((row) => ({
                        name: row.name.trim(),
                        weight: Number(row.weight) || 0,
                        max_score: Number(row.max_score) || 0,
                    })),
            },
            {
                preserveScroll: true,
                onSuccess: () => setErrors({}),
                onError: (validationErrors) => setErrors(validationErrors),
                onFinish: () => setSaving(0),
            },
        );
    };

    const reset = () => {
        setSaving(2);
        router.put(
            route('admin.rubrics.update', competition.id),
            { criteria: [{ name: 'Nilai akhir', weight: 100, max_score: 100 }] },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResetOpen(false);
                    setRows([{ name: 'Nilai akhir', weight: '100', max_score: '100' }]);
                },
                onFinish: () => setSaving(0),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Rubrik Penilaian</h1>
                    <p className="muted small">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Rubrik ${competition.name}`} />

            <FlashMessage />

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <h2>Status rubrik</h2>
                        <p className="muted">
                            Total bobot {total} dari 100 · {rows.filter((r) => r.name.trim() !== '').length} kriteria
                            {ready ? '' : ' — sesuaikan bobot agar berjumlah 100.'}
                        </p>
                    </div>
                    <div className="row-gap">
                        {ready ? (
                            <span className="badge badge--ok">Siap dipakai menilai</span>
                        ) : (
                            <span className="badge badge--wait">Belum siap</span>
                        )}
                        {rubric.is_locked && (
                            <span className="badge badge--bad">
                                <Lock size={13} aria-hidden />
                                Terkunci
                            </span>
                        )}
                    </div>
                </div>

                {rubric.is_locked && (
                    <div className="toast toast--error" role="alert">
                        <Lock size={20} aria-hidden />
                        <span>Rubrik terkunci: sudah ada lembar nilai pada lomba ini. Kriteria tidak dapat diubah.</span>
                    </div>
                )}
            </div>

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <h2>Kriteria penilaian</h2>
                        <p className="muted">Susun kriteria dan bobotnya. Urutan kriteria menentukan tampilan lembar nilai juri.</p>
                    </div>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={addRow} disabled={rubric.is_locked}>
                        <Plus size={16} aria-hidden />
                        Tambah kriteria
                    </button>
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title="Belum ada kriteria"
                        description="Tambahkan minimal satu kriteria dengan total bobot 100."
                        action={
                            <button type="button" className="btn btn--sm" onClick={addRow} disabled={rubric.is_locked}>
                                Tambah kriteria
                            </button>
                        }
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kriteria</th>
                                    <th>Bobot</th>
                                    <th>Nilai maks</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td data-label="No" className="num strong">
                                            {index + 1}
                                        </td>
                                        <td data-label="Kriteria">
                                            <input
                                                className="input"
                                                value={row.name}
                                                disabled={rubric.is_locked}
                                                onChange={(e) => updateRow(index, { name: e.target.value })}
                                                placeholder="mis. Teknik vokal"
                                                aria-label={`Nama kriteria ${index + 1}`}
                                            />
                                            {errors[`criteria.${index}.name`] && (
                                                <span className="error" role="alert">
                                                    {errors[`criteria.${index}.name`]}
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Bobot">
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                className="input"
                                                style={{ maxWidth: 110 }}
                                                value={row.weight}
                                                disabled={rubric.is_locked}
                                                onChange={(e) => updateRow(index, { weight: e.target.value })}
                                                aria-label={`Bobot kriteria ${index + 1}`}
                                            />
                                            {errors[`criteria.${index}.weight`] && (
                                                <span className="error" role="alert">
                                                    {errors[`criteria.${index}.weight`]}
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Nilai maks">
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                className="input"
                                                style={{ maxWidth: 110 }}
                                                value={row.max_score}
                                                disabled={rubric.is_locked}
                                                onChange={(e) => updateRow(index, { max_score: e.target.value })}
                                                aria-label={`Nilai maksimal kriteria ${index + 1}`}
                                            />
                                            {errors[`criteria.${index}.max_score`] && (
                                                <span className="error" role="alert">
                                                    {errors[`criteria.${index}.max_score`]}
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Aksi">
                                            <div className="row-gap" style={{ gap: 8 }}>
                                                <button
                                                    type="button"
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => move(index, -1)}
                                                    disabled={rubric.is_locked || index === 0}
                                                    aria-label={`Naikkan kriteria ${index + 1}`}
                                                    title="Naikkan"
                                                >
                                                    <ArrowUp size={15} aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => move(index, 1)}
                                                    disabled={rubric.is_locked || index === rows.length - 1}
                                                    aria-label={`Turunkan kriteria ${index + 1}`}
                                                    title="Turunkan"
                                                >
                                                    <ArrowDown size={15} aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--danger btn--sm"
                                                    onClick={() => removeRow(index)}
                                                    disabled={rubric.is_locked}
                                                    aria-label={`Hapus kriteria ${index + 1}`}
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={15} aria-hidden />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="row-between" style={{ marginTop: 18 }}>
                    <p className="hint">
                        <Info size={14} aria-hidden /> Bobot kriteria harus bilangan bulat minimal 1 dan totalnya 100 agar
                        rubrik dianggap siap. Rubrik terkunci setelah juri mulai mengisi lembar nilai.
                    </p>

                    <div className="row-gap">
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setResetOpen(true)}
                            disabled={rubric.is_locked}
                        >
                            <RotateCcw size={16} aria-hidden />
                            Reset ke nilai tunggal
                        </button>
                        <button
                            type="button"
                            className="btn btn--clay btn--sm"
                            onClick={save}
                            disabled={rubric.is_locked || saving !== 0}
                        >
                            <Save size={16} aria-hidden />
                            {saving === 1 ? 'Menyimpan…' : 'Simpan rubrik'}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                show={resetOpen}
                danger
                title="Reset rubrik"
                message={
                    <p>
                        Seluruh kriteria diganti satu kriteria &ldquo;Nilai akhir&rdquo; berbobot 100. Tindakan ini menimpa
                        daftar kriteria saat ini.
                    </p>
                }
                confirmLabel="Ya, reset"
                processing={saving === 2}
                onConfirm={reset}
                onCancel={() => setResetOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
