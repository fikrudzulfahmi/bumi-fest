import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';

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
        if (!confirm('Kirim pendaftaran kolektif? Satu tagihan akan dibuat.')) return;
        router.post(route('collective-registrations.commit', { level, competition: competition.slug }), { token }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold">Pendaftaran Kolektif: {competition.name}</h1>}
        >
            <Head title="Daftar Kolektif" />

            <div className="max-w-3xl mx-auto p-4 space-y-4">
                <div className="border border-gray-200 rounded p-4">
                    <p className="text-sm text-gray-600">
                        Impor siswa sekolah Anda lewat <b>Excel (.xlsx)</b> atau <b>CSV</b>. Kolom:
                        <code> nama_siswa, kelas{isTeam ? ', tim' : ''}</code>.
                        {isTeam && (
                            <> Baris dengan nama tim sama menjadi satu tim ({competition.team_min}–{competition.team_max} anggota).</>
                        )}
                        Biaya: Rp {competition.fee.toLocaleString('id-ID')} per entri.
                    </p>
                    <a
                        href={route('collective-registrations.template', { level, competition: competition.slug })}
                        className="text-blue-600 hover:underline text-sm inline-block mt-2"
                    >
                        Unduh template CSV
                    </a>
                </div>

                <div className="border border-gray-200 rounded p-4">
                    <p className="text-sm font-medium mb-2">1. Unggah berkas (pratinjau)</p>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePreview(f);
                        }}
                        className="text-sm"
                    />
                </div>

                {activePreview ? (
                    <div className="border border-gray-200 rounded p-4 space-y-3">
                        <p className="text-sm font-medium">2. Hasil pratinjau</p>

                        <div className="text-sm">
                            <span className="text-gray-600">Jumlah entri: {activePreview.entries ?? 0}</span>
                        </div>

                        {activePreview.errors?.length ? (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                                <p className="text-sm font-medium text-red-700 mb-1">
                                    Baris bermasalah ({activePreview.errors.length}):
                                </p>
                                <ul className="text-xs text-red-600 list-disc pl-5 space-y-1">
                                    {activePreview.errors.map((e, i) => (
                                        <li key={i}>{e.row ? `Baris ${e.row}: ` : ''}{e.message}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-red-500 mt-2">
                                    Perbaiki berkas lalu unggah ulang. Tidak ada data yang disimpan.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                                Tidak ada baris bermasalah. {activePreview.entries} entri siap dikirim.
                            </div>
                        )}

                        {!activePreview.errors?.length && activePreview.token ? (
                            <PrimaryButton onClick={() => handleCommit(activePreview.token!)}>
                                3. Kirim (buat tagihan)
                            </PrimaryButton>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}
