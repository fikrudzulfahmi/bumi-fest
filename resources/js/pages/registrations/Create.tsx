import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Competition {
    id: number;
    slug: string;
    name: string;
    category: string;
    team_min: number | null;
    team_max: number | null;
    fee: number;
    quota: number | null;
    required_documents: string[] | null;
    submission_mode: string;
}

interface Participant {
    id: number;
    name: string;
    grade: number;
    school_name: string;
}

interface Draft {
    team_name?: string | null;
    participant_ids?: number[];
}

interface Props {
    competition: Competition;
    participants: Participant[];
    draft: Draft;
    level: string;
}

type FormData = {
    team_name: string;
    participant_ids: number[];
    consent: boolean;
};

export default function Create({ competition, participants, draft, level }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        team_name: draft.team_name ?? '',
        participant_ids: draft.participant_ids ?? [],
        consent: false,
    });

    const isTeam = competition.category === 'team';
    const routeName = 'registrations.store';
    const url = route(routeName, { level, competition: competition.slug });

    const toggleMember = (id: number) => {
        const has = data.participant_ids.includes(id);
        if (has) {
            setData('participant_ids', data.participant_ids.filter((x) => x !== id));
        } else {
            setData('participant_ids', [...data.participant_ids, id]);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isTeam) {
            setData('team_name', '');
        }
        post(url);
    };

    if (participants.length === 0) {
        return (
            <AuthenticatedLayout header={<h1 className="text-2xl font-bold">{competition.name}</h1>}>
                <Head title="Daftar" />
                <div className="max-w-2xl mx-auto p-4">
                    <p className="text-gray-600">
                        Belum ada siswa dengan jenjang {level === 'sd_mi' ? 'SD/MI' : 'SMP/MTs'}. Tambahkan siswa terlebih dahulu di /siswa.
                    </p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Daftar: {competition.name}</h1>}>
            <Head title="Daftar Lomba" />

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={submit} className="space-y-4">
                    {isTeam && (
                        <div>
                            <InputLabel htmlFor="team_name">Nama Tim</InputLabel>
                            <TextInput
                                id="team_name"
                                type="text"
                                className="w-full"
                                value={data.team_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('team_name', e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Jumlah anggota: {competition.team_min}–{competition.team_max} siswa
                            </p>
                            <InputError message={errors.team_name} className="mt-2" />
                        </div>
                    )}

                    <div>
                        <InputLabel>
                            Pilih Siswa {isTeam ? `(pilih ${competition.team_min}–${competition.team_max})` : '(pilih 1)'}
                        </InputLabel>
                        <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded p-2">
                            {participants.map((p) => (
                                <label key={p.id} className="flex items-center gap-2">
                                    <input
                                        type={isTeam ? 'checkbox' : 'radio'}
                                        name="participant_ids"
                                        checked={data.participant_ids.includes(p.id)}
                                        onChange={() => toggleMember(p.id)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">
                                        {p.name} — Kelas {p.grade}, {p.school_name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.participant_ids} className="mt-2" />
                    </div>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.consent}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('consent', e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">
                                Saya menyetujui persyaratan lomba, juknis, dan kebijakan privasi.
                            </span>
                        </label>
                        <InputError message={errors.consent} className="mt-2" />
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>Simpan Draf</PrimaryButton>
                        <span className="text-sm text-gray-600">Biaya: Rp {competition.fee.toLocaleString('id-ID')}</span>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
