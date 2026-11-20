import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MailCheck size={16} aria-hidden />
                Verifikasi email
            </span>

            <h1 className="auth__title" style={{ marginTop: 14 }}>
                Satu Langkah Lagi
            </h1>
            <p className="auth__sub muted">
                Terima kasih sudah mendaftar di Bumifest. Kami telah mengirim tautan verifikasi ke email
                Anda. Buka tautan tersebut untuk mengaktifkan akun.
            </p>

            {status === 'verification-link-sent' && (
                <div className="toast toast--ok" role="status" style={{ marginTop: 16 }}>
                    Tautan verifikasi baru sudah dikirim ke alamat email yang Anda daftarkan.
                </div>
            )}

            <form onSubmit={submit} style={{ marginTop: 20 }}>
                <button type="submit" className="btn btn--clay btn--block" disabled={processing}>
                    {processing ? 'Mengirim…' : 'Kirim Ulang Email Verifikasi'}
                </button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="btn btn--ghost btn--block"
                    style={{ marginTop: 10 }}
                >
                    Keluar
                </Link>

                <p className="auth__foot small muted">
                    Belum menerima email? Periksa folder spam atau tunggu beberapa menit sebelum mengirim ulang.
                </p>
            </form>
        </GuestLayout>
    );
}
