import { Head } from '@inertiajs/react';

export default function NotFound() {
    return (
        <>
            <Head title="Verifikasi Sertifikat" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                    <h1 className="mt-4 text-lg font-bold text-gray-900">Sertifikat Tidak Ditemukan</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Kode verifikasi tidak cocok dengan sertifikat mana pun. Periksa kembali kode pada sertifikat.
                    </p>
                </div>
            </div>
        </>
    );
}
