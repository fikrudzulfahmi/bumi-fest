import Field from '@/Components/app/Field';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={`stack ${className}`}>
            <div>
                <h2 style={{ fontSize: '1.4rem' }}>Ubah kata sandi</h2>
                <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>
                    Gunakan kata sandi panjang dan acak agar akun Anda tetap aman.
                </p>
            </div>

            <form onSubmit={updatePassword} className="stack">
                <Field label="Kata sandi saat ini" htmlFor="current_password" error={errors.current_password} required>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        className="input"
                        value={data.current_password}
                        autoComplete="current-password"
                        onChange={(e) => setData('current_password', e.target.value)}
                        aria-invalid={Boolean(errors.current_password)}
                    />
                </Field>

                <Field label="Kata sandi baru" htmlFor="new_password" error={errors.password} required>
                    <input
                        id="new_password"
                        ref={passwordInput}
                        type="password"
                        className="input"
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        aria-invalid={Boolean(errors.password)}
                    />
                </Field>

                <Field label="Ulangi kata sandi baru" htmlFor="password_confirmation" required>
                    <input
                        id="password_confirmation"
                        type="password"
                        className="input"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </Field>

                <div className="row-gap">
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan kata sandi'}
                    </button>
                    {recentlySuccessful && (
                        <span className="small strong" role="status">
                            Tersimpan.
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
