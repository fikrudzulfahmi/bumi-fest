import Field from '@/Components/app/Field';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { PageProps } from '@/types';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage<PageProps>().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const nameInput = useRef<HTMLInputElement>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <section className={`stack ${className}`}>
            <div>
                <h2 style={{ fontSize: '1.4rem' }}>Informasi profil</h2>
                <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>
                    Perbarui nama dan alamat email akun Anda.
                </p>
            </div>

            <form onSubmit={submit} className="stack">
                <Field label="Nama" htmlFor="name" error={errors.name} required>
                    <input
                        id="name"
                        ref={nameInput}
                        type="text"
                        className="input"
                        value={data.name}
                        autoComplete="name"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        aria-invalid={Boolean(errors.name)}
                    />
                </Field>

                <Field label="Email" htmlFor="email" error={errors.email} required>
                    <input
                        id="email"
                        type="email"
                        className="input"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        aria-invalid={Boolean(errors.email)}
                    />
                </Field>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="toast toast--warn">
                        <span>
                            Email Anda belum terverifikasi.{' '}
                            <Link href={route('verification.send')} method="post" as="button" className="strong">
                                Kirim ulang email verifikasi
                            </Link>
                            {status === 'verification-link-sent' && (
                                <span className="small" style={{ display: 'block', marginTop: 6 }}>
                                    Tautan verifikasi baru telah dikirim.
                                </span>
                            )}
                        </span>
                    </div>
                )}

                <div className="row-gap">
                    <button type="submit" className="btn btn--clay" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan'}
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
