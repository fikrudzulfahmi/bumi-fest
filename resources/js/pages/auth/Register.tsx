import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
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

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Daftar Akun Bumifest
                </h1>

                {/* Type Selection */}
                <div className="flex gap-4 mb-6">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="type"
                            value="participant"
                            checked={type === 'participant'}
                            onChange={() => handleTypeChange('participant')}
                            className="w-4 h-4"
                        />
                        <span className="ml-2 text-gray-700">Peserta Individu</span>
                    </label>

                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="type"
                            value="institution"
                            checked={type === 'institution'}
                            onChange={() => handleTypeChange('institution')}
                            className="w-4 h-4"
                        />
                        <span className="ml-2 text-gray-700">Lembaga / Sekolah</span>
                    </label>
                </div>
            </div>

            <form onSubmit={submit}>
                {/* Nama */}
                <div>
                    <InputLabel
                        htmlFor="name"
                        value={type === 'participant' ? 'Nama Lengkap' : 'Nama Pengguna'}
                    />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Email */}
                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* WhatsApp */}
                <div className="mt-4">
                    <InputLabel htmlFor="whatsapp" value="Nomor WhatsApp" />

                    <TextInput
                        id="whatsapp"
                        type="tel"
                        name="whatsapp"
                        placeholder="Contoh: 0812-3456-7890 atau +62812-3456-7890"
                        value={data.whatsapp}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('whatsapp', e.target.value)}
                        required
                    />

                    <InputError message={errors.whatsapp} className="mt-2" />
                </div>

                {/* Conditional: Institution fields */}
                {type === 'institution' && (
                    <>
                        <div className="mt-4">
                            <InputLabel htmlFor="institution_name" value="Nama Sekolah" />

                            <TextInput
                                id="institution_name"
                                name="institution_name"
                                value={data.institution_name}
                                className="mt-1 block w-full"
                                onChange={(e) =>
                                    setData('institution_name', e.target.value)
                                }
                                required={type === 'institution'}
                            />

                            <InputError
                                message={errors.institution_name}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="npsn" value="NPSN (8 digit)" />

                            <TextInput
                                id="npsn"
                                type="text"
                                name="npsn"
                                maxLength={8}
                                placeholder="Contoh: 20123456"
                                value={data.npsn}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('npsn', e.target.value)}
                                required={type === 'institution'}
                            />

                            <InputError message={errors.npsn} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="city" value="Kota" />

                            <TextInput
                                id="city"
                                name="city"
                                value={data.city}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('city', e.target.value)}
                                required={type === 'institution'}
                            />

                            <InputError message={errors.city} className="mt-2" />
                        </div>
                    </>
                )}

                {/* Password */}
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Kata Sandi" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Confirm Password */}
                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Konfirmasi Kata Sandi"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                {/* Privacy Consent */}
                <div className="mt-6">
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            name="privacy_consent"
                            checked={data.privacy_consent}
                            onChange={(e) =>
                                setData('privacy_consent', e.target.checked)
                            }
                            className="mt-1 w-4 h-4"
                            required
                        />

                        <span className="ml-3 text-sm text-gray-700">
                            Saya setuju dengan{' '}
                            <a href="#" className="text-blue-600 hover:underline">
                                Kebijakan Privasi
                            </a>{' '}
                            dan{' '}
                            <a href="#" className="text-blue-600 hover:underline">
                                Syarat & Ketentuan
                            </a>
                        </span>
                    </label>

                    <InputError message={errors.privacy_consent} className="mt-2" />
                </div>

                {/* Submit */}
                <div className="mt-6 flex items-center justify-between">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sudah punya akun?
                    </Link>

                    <PrimaryButton disabled={processing}>
                        Daftar
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
