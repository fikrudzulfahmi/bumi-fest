import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash;
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
        router.post(route('admin.results.compute', competition.id), {}, {
            preserveScroll: true,
            onFinish: () => setConfirm(null),
        });
    };

    const doPublish = () => {
        router.post(
            route('admin.results.publish', competition.id),
            { allow_incomplete: allowIncomplete },
            { preserveScroll: true, onFinish: () => setConfirm(null) },
        );
    };

    const doUnlockAll = () => {
        router.post(route('admin.results.unlock-all', competition.id), {}, {
            preserveScroll: true,
            onFinish: () => setConfirm(null),
        });
    };

    const doUnlock = () => {
        if (!unlocking) return;
        router.post(route('admin.results.unlock', unlocking.id), {}, {
            preserveScroll: true,
            onFinish: () => setUnlocking(null),
        });
    };

    const incompleteCount = rows.filter((row) => !row.is_complete).length;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold">Hasil Lomba</h1>
                    <p className="text-sm text-gray-500">
                        {competition.name} — jenjang {competition.level_label}
                    </p>
                </div>
            }
        >
            <Head title={`Hasil ${competition.name}`} />

            <div className="mx-auto max-w-6xl space-y-4 p-4">
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

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">
                            {rows.length} entri terverifikasi
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">
                            {judges.length} juri ditugaskan
                        </span>
                        <span
                            className={`rounded px-2 py-1 ${
                                rubric.is_ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}
                        >
                            Rubrik: {rubric.criteria_count} kriteria, bobot {rubric.total_weight}
                        </span>
                        {published && (
                            <span className="rounded bg-emerald-600 px-2 py-1 text-white">Hasil sudah terbit</span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <SecondaryButton onClick={() => setConfirm('compute')} disabled={published}>
                            Hitung ulang
                        </SecondaryButton>
                        <SecondaryButton onClick={() => setConfirm('unlock-all')} disabled={published}>
                            Buka semua kunci
                        </SecondaryButton>
                        <PrimaryButton onClick={() => setConfirm('publish')} disabled={published}>
                            {published ? 'Sudah terbit' : 'Terbitkan hasil'}
                        </PrimaryButton>
                    </div>
                </div>

                {!rubric.is_ready && (
                    <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {rubric.message ?? 'Rubrik belum siap.'}{' '}
                        <Link href={route('admin.rubrics.edit', competition.id)} className="underline">
                            Perbaiki rubrik
                        </Link>
                    </div>
                )}

                {incompleteCount > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {incompleteCount} entri belum punya nilai lengkap (semua juri terkunci).
                    </div>
                )}

                <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">Kode</th>
                                <th className="px-3 py-2">Peserta</th>
                                <th className="px-3 py-2">Sekolah</th>
                                <th className="px-3 py-2">Lembar</th>
                                <th className="px-3 py-2">Nilai akhir</th>
                                <th className="px-3 py-2">Juara</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.id} className={row.is_tie ? 'bg-amber-50/50' : undefined}>
                                    <td className="px-3 py-2 font-semibold">{row.rank ?? '—'}</td>
                                    <td className="px-3 py-2 font-mono text-xs text-gray-600">{row.code}</td>
                                    <td className="px-3 py-2">
                                        <p className="font-medium">
                                            {row.team_name ?? (row.names.join(', ') || 'Tanpa nama')}
                                        </p>
                                        {row.team_name && row.names.length > 0 && (
                                            <p className="text-xs text-gray-500">{row.names.join(', ')}</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600">{row.school_name ?? '—'}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">
                                        {row.sheets_locked}/{row.sheets_total}
                                    </td>
                                    <td className="px-3 py-2 font-semibold">
                                        {row.final_score !== null ? row.final_score.toFixed(2) : '—'}
                                        {row.is_tie && (
                                            <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-900">
                                                SERI
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            aria-label={`Juara entri ${row.code}`}
                                            value={placements[String(row.id)] ?? ''}
                                            disabled={published || !row.is_complete}
                                            onChange={(event) => setPlacement(row.id, event.target.value)}
                                            className="min-h-11 rounded border-gray-300 text-sm disabled:bg-gray-100"
                                        >
                                            <option value="">—</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                                        Belum ada entri terverifikasi pada lomba ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!published && (
                    <div className="rounded border border-gray-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="font-semibold">Tetapkan juara</h2>
                                <p className="text-xs text-gray-500">
                                    Saran dari peringkat: {suggestions.length} entri
                                    {suggestions.length > 0 &&
                                        ` (${suggestions.map((row) => `#${row.rank}`).join(', ')})`}
                                    . Peringkat boleh dipakai bersama bila seri.
                                </p>
                            </div>
                            <PrimaryButton onClick={savePlacements} disabled={duplicatePlacement}>
                                Simpan juara
                            </PrimaryButton>
                        </div>
                        {duplicatePlacement && (
                            <p className="mt-2 text-xs text-red-600">
                                Peringkat 1 hanya boleh satu entri. Peringkat 2 dan 3 boleh dipakai bersama bila seri.
                            </p>
                        )}
                    </div>
                )}

                <div className="rounded border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold">Lembar nilai</h2>
                        <p className="text-xs text-gray-500">
                            Buka kunci hanya bila hasil belum diterbitkan. Setelah dibuka, juri wajib mengunci ulang.
                        </p>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {sheets.map((sheet) => (
                            <li key={sheet.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                <div className="text-sm">
                                    <p className="font-medium">{sheet.judge_name ?? 'Juri'}</p>
                                    <p className="text-xs text-gray-500">
                                        Entri {sheet.registration_code ?? '—'} · {sheet.status_label}
                                        {sheet.total !== null && ` · total ${sheet.total.toFixed(2)}`}
                                    </p>
                                </div>
                                {sheet.status === 'locked' && (
                                    <SecondaryButton onClick={() => setUnlocking(sheet)} disabled={published}>
                                        Buka kunci
                                    </SecondaryButton>
                                )}
                            </li>
                        ))}
                        {sheets.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-500">Belum ada nilai tersimpan.</li>
                        )}
                    </ul>
                </div>
            </div>

            <Modal show={confirm !== null} onClose={() => setConfirm(null)} maxWidth="md">
                <div className="p-6">
                    {confirm === 'compute' && (
                        <>
                            <h2 className="text-lg font-semibold">Hitung ulang nilai akhir?</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Nilai akhir dihitung dari rata-rata lembar terkunci semua juri. Entri yang belum lengkap
                                tetap tanpa nilai.
                            </p>
                        </>
                    )}
                    {confirm === 'unlock-all' && (
                        <>
                            <h2 className="text-lg font-semibold">Buka semua kunci?</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Semua lembar nilai kembali menjadi draf dan totalnya dikosongkan. Juri harus mengunci
                                ulang sebelum hasil bisa diterbitkan.
                            </p>
                        </>
                    )}
                    {confirm === 'publish' && (
                        <>
                            <h2 className="text-lg font-semibold">Terbitkan hasil lomba?</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Juara tampil di portal dan peserta menerima notifikasi. Sertifikat mulai dibuat di
                                antrean. Tindakan ini tidak bisa dibatalkan.
                            </p>
                            {incompleteCount > 0 && (
                                <label className="mt-3 flex items-start gap-2 text-sm text-amber-900">
                                    <input
                                        type="checkbox"
                                        checked={allowIncomplete}
                                        onChange={(event) => setAllowIncomplete(event.target.checked)}
                                        className="mt-1 rounded border-gray-300"
                                    />
                                    <span>
                                        Terbitkan walau {incompleteCount} entri belum lengkap (entri itu tanpa
                                        peringkat).
                                    </span>
                                </label>
                            )}
                        </>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton onClick={() => setConfirm(null)}>Batal</SecondaryButton>
                        <PrimaryButton
                            onClick={
                                confirm === 'compute' ? doCompute : confirm === 'publish' ? doPublish : doUnlockAll
                            }
                        >
                            Lanjutkan
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={unlocking !== null} onClose={() => setUnlocking(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold">Buka kunci lembar ini?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Lembar {unlocking?.judge_name ?? 'juri'} untuk entri {unlocking?.registration_code ?? '—'}{' '}
                        kembali menjadi draf dan totalnya dikosongkan.
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton onClick={() => setUnlocking(null)}>Batal</SecondaryButton>
                        <PrimaryButton onClick={doUnlock}>Buka kunci</PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
