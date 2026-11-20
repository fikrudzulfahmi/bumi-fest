import Field from '@/Components/app/Field';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi Kata Sandi" />

            <h1 className="auth__title">Konfirmasi Kata Sandi</h1>
            <p className="auth__sub muted">
                Area ini terlindungi. Masukkan kata sandi Anda sekali lagi untuk melanjutkan.
            </p>

            <form onSubmit={submit} style={{ marginTop: 20 }}>
                <Field label="Kata sandi" htmlFor="password" error={errors.password} required>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="input"
                        value={data.password}
                        autoComplete="current-password"
                        autoFocus
                        aria-invalid={Boolean(errors.password)}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>

                <button type="submit" className="btn btn--clay btn--block" disabled={processing}>
                    {processing ? 'Memeriksa…' : 'Konfirmasi'}
                </button>

                <p className="auth__foot small muted">
                    Lupa kata sandi? Keluar lalu gunakan menu lupa kata sandi di halaman masuk.
                </p>
            </form>
        </GuestLayout>
    );
}
