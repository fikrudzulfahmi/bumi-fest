import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import Field from '@/Components/app/Field';
import ConfirmDialog from '@/Components/app/ConfirmDialog';

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirming(false),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const close = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`stack ${className}`}>
            <div>
                <h2 style={{ fontSize: '1.4rem' }}>Hapus akun</h2>
                <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>
                    Setelah akun dihapus, seluruh data dan sumber dayanya dihapus permanen. Unduh dulu apa pun
                    yang ingin Anda simpan.
                </p>
            </div>

            <div>
                <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>
                    Hapus akun
                </button>
            </div>

            <ConfirmDialog
                show={confirming}
                title="Yakin ingin menghapus akun?"
                danger
                processing={processing}
                confirmLabel="Hapus akun permanen"
                onCancel={close}
                onConfirm={() => {
                    const form = document.getElementById('delete-account-form') as HTMLFormElement | null;
                    form?.requestSubmit();
                }}
                message={
                    <form id="delete-account-form" onSubmit={deleteUser} className="stack-sm">
                        <p className="muted" style={{ fontSize: 15 }}>
                            Masukkan kata sandi Anda untuk mengonfirmasi. Tindakan ini tidak bisa dibatalkan.
                        </p>
                        <Field label="Kata sandi" htmlFor="delete_password" error={errors.password}>
                            <input
                                id="delete_password"
                                ref={passwordInput}
                                type="password"
                                className="input"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Kata sandi"
                                aria-invalid={Boolean(errors.password)}
                            />
                        </Field>
                    </form>
                }
            />
        </section>
    );
}
