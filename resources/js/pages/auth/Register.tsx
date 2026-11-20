import Field from '@/Components/app/Field';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, UserRound } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Register() {
    const [type, setType] = useState<'participant' | 'institution'>('participant');

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'participant',
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        password_confirmation: '',
        privacy_consent: false,

        // Institution fields (conditional)
        institution_name: '',
        npsn: '',
        city: '',
    });

    const handleTypeChange = (newType: 'participant' | 'institution') => {
        setType(newType);
        setData('type', newType);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar Akun" />

            <h1 className="auth__title">Daftar Akun</h1>
            <p className="auth__sub muted">
                Ikuti Bumifest sebagai peserta individu atau mewakili lembaga/sekolah.
            </p>

            <form onSubmit={submit} style={{ marginTop: 20 }}>
                <fieldset className="fieldset">
                    <legend>Jenis akun</legend>

                    <div className="stack-sm">
                        <label className="check">
                            <input
                                type="radio"
                                name="type"
                                value="participant"
                                checked={type === 'participant'}
                                onChange={() => handleTypeChange('participant')}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <UserRound size={18} aria-hidden />
                                Peserta Individu
                            </span>
                        </label>

                        <label className="check">
                            <input
                                type="radio"
                                name="type"
                                value="institution"
                                checked={type === 'institution'}
                                onChange={() => handleTypeChange('institution')}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={18} aria-hidden />
                                Lembaga / Sekolah
                            </span>
                        </label>
                    </div>

                    {errors.type && (
                        <p className="error" role="alert" style={{ marginTop: 8 }}>
                            {errors.type}
                        </p>
                    )}
                </fieldset>

                <Field
                    label={type === 'participant' ? 'Nama lengkap' : 'Nama pengguna'}
                    htmlFor="name"
                    error={errors.name}
                    hint={
                        type === 'participant'
                            ? 'Tulis nama sesuai kartu identitas.'
                            : 'Nama penanggung jawab pendaftaran lembaga.'
                    }
                    required
                >
                    <input
                        id="name"
                        name="name"
                        className="input"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        aria-invalid={Boolean(errors.name)}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                </Field>

                <Field
                    label="Email"
                    htmlFor="email"
                    error={errors.email}
                    hint="Tautan verifikasi akun dikirim ke alamat ini."
                    required
                >
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
                    label="Nomor WhatsApp"
                    htmlFor="whatsapp"
                    error={errors.whatsapp}
                    hint="Contoh: 0812-3456-7890 atau +62812-3456-7890."
                    required
                >
                    <input
                        id="whatsapp"
                        type="tel"
                        name="whatsapp"
                        className="input"
                        placeholder="0812-3456-7890"
                        value={data.whatsapp}
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.whatsapp)}
                        onChange={(e) => setData('whatsapp', e.target.value)}
                    />
                </Field>

                {type === 'institution' && (
                    <fieldset className="fieldset">
                        <legend>Data lembaga</legend>

                        <Field label="Nama sekolah" htmlFor="institution_name" error={errors.institution_name} required>
                            <input
                                id="institution_name"
                                name="institution_name"
                                className="input"
                                value={data.institution_name}
                                aria-invalid={Boolean(errors.institution_name)}
                                onChange={(e) => setData('institution_name', e.target.value)}
                            />
                        </Field>

                        <Field label="NPSN" htmlFor="npsn" error={errors.npsn} hint="8 digit nomor pokok sekolah nasional." required>
                            <input
                                id="npsn"
                                type="text"
                                name="npsn"
                                className="input tnum"
                                maxLength={8}
                                placeholder="20123456"
                                value={data.npsn}
                                aria-invalid={Boolean(errors.npsn)}
                                onChange={(e) => setData('npsn', e.target.value)}
                            />
                        </Field>

                        <Field label="Kota" htmlFor="city" error={errors.city} required>
                            <input
                                id="city"
                                name="city"
                                className="input"
                                value={data.city}
                                aria-invalid={Boolean(errors.city)}
                                onChange={(e) => setData('city', e.target.value)}
                            />
                        </Field>
                    </fieldset>
                )}

                <Field
                    label="Kata sandi"
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
                        aria-invalid={Boolean(errors.password)}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </Field>

                <Field
                    label="Ulangi kata sandi"
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

                <div className="stack-sm" style={{ marginBottom: 16 }}>
                    <label className="check">
                        <input
                            type="checkbox"
                            name="privacy_consent"
                            checked={data.privacy_consent}
                            onChange={(e) => setData('privacy_consent', e.target.checked)}
                            required
                        />
                        <span>
                            Saya menyetujui{' '}
                            <a href="#" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                                Kebijakan Privasi
                            </a>{' '}
                            dan{' '}
                            <a href="#" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                                Syarat &amp; Ketentuan
                            </a>{' '}
                            Bumifest.
                        </span>
                    </label>

                    {errors.privacy_consent && (
                        <p className="error" role="alert">
                            {errors.privacy_consent}
                        </p>
                    )}
                </div>

                <button type="submit" className="btn btn--clay btn--block" disabled={processing}>
                    {processing ? 'Memproses…' : 'Daftar'}
                </button>

                <p className="auth__foot">
                    Sudah punya akun?{' '}
                    <Link href={route('login')} style={{ fontWeight: 700 }}>
                        Masuk di sini
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
