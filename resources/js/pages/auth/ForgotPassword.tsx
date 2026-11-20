import Field from '@/Components/app/Field';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <h1 className="auth__title">Lupa Kata Sandi</h1>
            <p className="auth__sub muted">
                Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.
            </p>

            {status && (
                <div className="toast toast--ok" role="status" style={{ marginTop: 16 }}>
                    {status}
                </div>
            )}

            <form onSubmit={submit} style={{ marginTop: 20 }}>
                <Field label="Email" htmlFor="email" error={errors.email} required>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="input"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        aria-invalid={Boolean(errors.email)}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </Field>

                <button type="submit" className="btn btn--clay btn--block" disabled={processing}>
                    {processing ? 'Mengirim…' : 'Kirim Tautan Reset'}
                </button>

                <p className="auth__foot">
                    Ingat kata sandi Anda?{' '}
                    <Link href={route('login')} style={{ fontWeight: 700 }}>
                        Kembali ke halaman masuk
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
