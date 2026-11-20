import Field from '@/Components/app/Field';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <h1 className="auth__title">Masuk</h1>
            <p className="auth__sub muted">Gunakan akun peserta, juri, atau panitia Anda.</p>

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

                <Field label="Kata sandi" htmlFor="password" error={errors.password} required>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="input"
                        value={data.password}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>

                <label className="check">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked as false)}
                    />
                    <span>Ingat saya</span>
                </label>

                <button type="submit" className="btn btn--clay btn--block" style={{ marginTop: 16 }} disabled={processing}>
                    {processing ? 'Memproses…' : 'Masuk'}
                </button>

                {canResetPassword && (
                    <p className="auth__foot" style={{ borderTop: 0, paddingTop: 0, marginTop: 14 }}>
                        <Link href={route('password.request')} style={{ fontWeight: 600 }}>
                            Lupa kata sandi?
                        </Link>
                    </p>
                )}

                <p className="auth__foot" style={{ borderTop: 0, paddingTop: 0 }}>
                    Belum punya akun?{' '}
                    <Link href={route('register')} style={{ fontWeight: 700 }}>
                        Daftar di sini
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
