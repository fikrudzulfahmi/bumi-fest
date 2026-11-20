import Field from '@/Components/app/Field';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Kata Sandi" />

            <h1 className="auth__title">Atur Kata Sandi Baru</h1>
            <p className="auth__sub muted">
                Tentukan kata sandi baru untuk akun <span className="strong">{email}</span>.
            </p>

            <form onSubmit={submit} style={{ marginTop: 20 }}>
                <input type="hidden" name="token" value={token} />

                <Field label="Email" htmlFor="email" error={errors.email} required>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="input"
                        value={data.email}
                        autoComplete="username"
                        aria-invalid={Boolean(errors.email)}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </Field>

                <Field
                    label="Kata sandi baru"
                    htmlFor="password"
                    error={errors.password}
                    hint="Minimal 8 karakter."
                    required
                >
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="input"
                        value={data.password}
                        autoComplete="new-password"
                        autoFocus
                        aria-invalid={Boolean(errors.password)}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>

                <Field
                    label="Ulangi kata sandi baru"
                    htmlFor="password_confirmation"
                    error={errors.password_confirmation}
                    required
                >
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        className="input"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password_confirmation)}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </Field>

                <button type="submit" className="btn btn--clay btn--block" disabled={processing}>
                    {processing ? 'Menyimpan…' : 'Simpan Kata Sandi'}
                </button>

                <p className="auth__foot">
                    Sudah selesai?{' '}
                    <Link href={route('login')} style={{ fontWeight: 700 }}>
                        Masuk dengan kata sandi baru
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
