import { Head } from '@inertiajs/react';

interface Props {
    name: string | null;
    competition: string | null;
    type: string;
    type_label: string;
    placement: number | null;
    number: string;
    generated_at: string | null;
}

export default function Show({ name, competition, type, type_label, placement, number, generated_at }: Props) {
    return (
        <>
            <Head title="Verifikasi Sertifikat" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Sertifikat Sah</h1>
                            <p className="text-xs text-gray-500">Terverifikasi oleh Bumi Fest</p>
                        </div>
                    </div>

                    <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Nama</dt>
                            <dd className="font-semibold text-gray-900">{name ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Lomba</dt>
                            <dd className="font-semibold text-gray-900">{competition ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Jenis</dt>
                            <dd className="font-semibold text-gray-900">
                                {type_label}
                                {placement !== null && ` (Juara ${placement})`}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Nomor</dt>
                            <dd className="font-mono text-xs font-semibold text-gray-900">{number}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-500">Tanggal</dt>
                            <dd className="font-semibold text-gray-900">{generated_at ?? '—'}</dd>
                        </div>
                    </dl>

                    <p className="mt-5 text-center text-xs text-gray-400">
                        Halaman ini menampilkan data minimal untuk verifikasi keaslian sertifikat.
                    </p>
                </div>
            </div>
        </>
    );
}
