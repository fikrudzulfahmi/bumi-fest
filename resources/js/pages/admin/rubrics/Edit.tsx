import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, router, usePage } from '@inertiajs/react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
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
                    <h1 className="text-2xl font-bold">Rubrik Penilaian</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Rubrik ${competition.name}`} />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                {flash?.success && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div
                    className={`rounded border px-4 py-3 text-sm ${
                        ready
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                >
                    <p className="font-medium">
                        {ready ? 'Rubrik siap dipakai menilai.' : 'Rubrik belum siap.'}
                    </p>
                    <p className="text-xs">
                        Total bobot {total} dari 100 · {rows.filter((r) => r.name.trim() !== '').length} kriteria
                        {ready ? '' : ' — sesuaikan bobot agar berjumlah 100.'}
                    </p>
                    {rubric.is_locked && (
                        <p className="mt-1 text-xs font-medium text-red-700">
                            Rubrik terkunci: sudah ada lembar nilai pada lomba ini.
                        </p>
                    )}
                </div>

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <th className="px-3 py-2 w-10">#</th>
                                <th className="px-3 py-2">Kriteria</th>
                                <th className="px-3 py-2 w-28">Bobot</th>
                                <th className="px-3 py-2 w-32">Nilai Maks</th>
                                <th className="px-3 py-2 w-40">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index} className="border-t border-gray-100">
                                    <td className="px-3 py-2 text-xs text-gray-500">{index + 1}</td>
                                    <td className="px-3 py-2">
                                        <input
                                            className="w-full rounded border-gray-300 text-sm"
                                            value={row.name}
                                            disabled={rubric.is_locked}
                                            onChange={(e) => updateRow(index, { name: e.target.value })}
                                            placeholder="mis. Teknik vokal"
                                        />
                                        {errors[`criteria.${index}.name`] && (
                                            <span className="text-xs text-red-600">
                                                {errors[`criteria.${index}.name`]}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            className="w-20 rounded border-gray-300 text-sm"
                                            value={row.weight}
                                            disabled={rubric.is_locked}
                                            onChange={(e) => updateRow(index, { weight: e.target.value })}
                                        />
                                        {errors[`criteria.${index}.weight`] && (
                                            <span className="text-xs text-red-600">
                                                {errors[`criteria.${index}.weight`]}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            className="w-24 rounded border-gray-300 text-sm"
                                            value={row.max_score}
                                            disabled={rubric.is_locked}
                                            onChange={(e) => updateRow(index, { max_score: e.target.value })}
                                        />
                                        {errors[`criteria.${index}.max_score`] && (
                                            <span className="text-xs text-red-600">
                                                {errors[`criteria.${index}.max_score`]}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-1 text-xs">
                                            <button
                                                type="button"
                                                className="text-gray-600 hover:underline disabled:text-gray-300"
                                                onClick={() => move(index, -1)}
                                                disabled={rubric.is_locked || index === 0}
                                            >
                                                naik
                                            </button>
                                            <button
                                                type="button"
                                                className="text-gray-600 hover:underline disabled:text-gray-300"
                                                onClick={() => move(index, 1)}
                                                disabled={rubric.is_locked || index === rows.length - 1}
                                            >
                                                turun
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline disabled:text-gray-300"
                                                onClick={() => removeRow(index)}
                                                disabled={rubric.is_locked}
                                            >
                                                hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <SecondaryButton type="button" onClick={addRow} disabled={rubric.is_locked}>
                        Tambah kriteria
                    </SecondaryButton>

                    <div className="flex gap-2">
                        <SecondaryButton type="button" onClick={() => setResetOpen(true)} disabled={rubric.is_locked}>
                            Reset ke nilai tunggal
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={save} disabled={rubric.is_locked || saving !== 0}>
                            {saving === 1 ? 'Menyimpan…' : 'Simpan rubrik'}
                        </PrimaryButton>
                    </div>
                </div>

                <p className="text-xs text-gray-500">
                    Bobot kriteria harus bilangan bulat minimal 1 dan totalnya 100 agar rubrik dianggap siap.
                    Rubrik terkunci setelah juri mulai mengisi lembar nilai.
                </p>
            </div>

            <Modal show={resetOpen} onClose={() => setResetOpen(false)} maxWidth="sm">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Reset rubrik</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Seluruh kriteria diganti satu kriteria &ldquo;Nilai akhir&rdquo; berbobot 100. Tindakan ini
                        menimpa daftar kriteria saat ini.
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setResetOpen(false)} disabled={saving !== 0}>
                            Batal
                        </SecondaryButton>
                        <DangerButton type="button" onClick={reset} disabled={saving !== 0}>
                            {saving === 2 ? 'Memproses…' : 'Reset'}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
