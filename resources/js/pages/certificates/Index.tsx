import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface CertificateItem {
    id: number;
    number: string;
    type: string;
    type_label: string;
    placement: number | null;
    participant_name: string | null;
    competition_name: string | null;
    generated_at: string | null;
}

interface Props {
    certificates: CertificateItem[];
    can_zip: boolean;
}

export default function Index({ certificates, can_zip }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Sertifikat</h1>}>
            <Head title="Sertifikat" />

            <div className="mx-auto max-w-4xl space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-gray-600">Unduh sertifikat Anda setelah hasil lomba diterbitkan.</p>
                    {can_zip && (
                        <Link
                            href={route('certificates.download-all')}
                            className="min-h-11 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                            Unduh Semua (ZIP)
                        </Link>
                    )}
                </div>

                {certificates.length === 0 && (
                    <div className="rounded border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                        Belum ada sertifikat. Sertifikat dibuat setelah hasil lomba diterbitkan oleh panitia.
                    </div>
                )}

                <ul className="space-y-3">
                    {certificates.map((cert) => (
                        <li key={cert.id} className="rounded border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded px-2 py-1 text-xs font-medium ${
                                                cert.type === 'winner'
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {cert.type_label}
                                            {cert.placement !== null && ` — Juara ${cert.placement}`}
                                        </span>
                                        <span className="font-mono text-xs text-gray-500">{cert.number}</span>
                                    </div>
                                    <h2 className="mt-2 text-base font-semibold">{cert.participant_name ?? '—'}</h2>
                                    <p className="text-sm text-gray-600">{cert.competition_name ?? '—'}</p>
                                    {cert.generated_at && (
                                        <p className="text-xs text-gray-400">
                                            Terbit {new Date(cert.generated_at).toLocaleDateString('id-ID')}
                                        </p>
                                    )}
                                </div>

                                <Link
                                    href={route('certificates.download', cert.id)}
                                    className="min-h-11 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                                >
                                    Unduh PDF
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </AuthenticatedLayout>
    );
}
