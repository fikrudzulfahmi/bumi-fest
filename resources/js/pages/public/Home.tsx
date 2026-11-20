import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, LogIn, Trophy, UserPlus } from 'lucide-react';

interface Competition {
    id: number;
    name: string;
    level: string;
    level_label: string | null;
    category: string;
    fee: number;
    opens_at: string | null;
    closes_at: string | null;
}

interface Props {
    event_name: string;
    contact_email: string;
    contact_whatsapp: string;
    competitions: Competition[];
    can_login: boolean;
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function Home({ event_name, competitions, can_login }: Props) {
    return (
        <>
            <Head title={event_name} />

            <div className="flex min-h-screen flex-col bg-gray-50">
                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <span className="text-lg font-bold text-emerald-700">{event_name}</span>

                        {can_login && (
                            <nav className="flex items-center gap-2">
                                <Link
                                    href={route('login')}
                                    className="inline-flex min-h-11 items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    <LogIn className="h-4 w-4" aria-hidden />
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-flex min-h-11 items-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                                >
                                    <UserPlus className="h-4 w-4" aria-hidden />
                                    Daftar Akun
                                </Link>
                            </nav>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
                    <section className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            {event_name}
                        </h1>
                        <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
                            Festival lomba untuk jenjang SD/MI dan SMP/MTs. Daftarkan tim sekolah Anda,
                            unggah persyaratan, dan pantau hasil lomba dalam satu portal.
                        </p>
                    </section>

                    <section className="mt-10">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <CalendarDays className="h-5 w-5 text-emerald-700" aria-hidden />
                            Jadwal Lomba
                        </h2>

                        {competitions.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                                Belum ada lomba yang dibuka. Silakan cek kembali nanti.
                            </div>
                        ) : (
                            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">Lomba</th>
                                            <th className="px-4 py-3">Jenjang</th>
                                            <th className="px-4 py-3">Biaya</th>
                                            <th className="px-4 py-3">Dibuka</th>
                                            <th className="px-4 py-3">Ditutup</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {competitions.map((competition) => (
                                            <tr key={competition.id}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {competition.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {competition.category}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {competition.level_label ?? competition.level}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {competition.fee === 0
                                                        ? 'Gratis'
                                                        : formatRupiah(competition.fee)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {formatDate(competition.opens_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                    {formatDate(competition.closes_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="mt-10 grid gap-4 sm:grid-cols-3">
                        {[
                            {
                                icon: UserPlus,
                                title: '1. Buat akun',
                                body: 'Daftar sebagai peserta atau lembaga sekolah.',
                            },
                            {
                                icon: CalendarDays,
                                title: '2. Daftarkan tim',
                                body: 'Lengkapi data siswa, dokumen, dan syarat lomba.',
                            },
                            {
                                icon: Trophy,
                                title: '3. Pantau hasil',
                                body: 'Lihat juara dan unduh sertifikat setelah hasil terbit.',
                            },
                        ].map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.title}
                                    className="rounded-lg border border-gray-200 bg-white p-5"
                                >
                                    <Icon className="h-6 w-6 text-emerald-700" aria-hidden />
                                    <h3 className="mt-3 font-semibold text-gray-900">{step.title}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{step.body}</p>
                                </div>
                            );
                        })}
                    </section>
                </main>

                <footer className="border-t border-gray-200 bg-white py-6">
                    <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-center text-xs text-gray-500 sm:px-6 lg:px-8">
                        <p className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            {event_name} — portal pendaftaran resmi
                        </p>
                        <p>by Bumi Production</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
