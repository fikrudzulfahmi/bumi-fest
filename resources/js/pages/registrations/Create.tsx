import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';

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
            <AuthenticatedLayout header={<h1>{competition.name}</h1>}>
                <Head title="Daftar" />

                <FlashMessage />

                <div className="panel">
                    <EmptyState
                        title="Belum ada siswa terdaftar"
                        description={`Belum ada siswa dengan jenjang ${
                            level === 'sd_mi' ? 'SD/MI' : 'SMP/MTs'
                        }. Tambahkan siswa terlebih dahulu, lalu kembali ke halaman ini.`}
                        action={
                            <Link className="btn btn--sm" href={route('participants.index')}>
                                <Users size={16} aria-hidden />
                                Tambah siswa
                            </Link>
                        }
                    />
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout header={<h1>Daftar: {competition.name}</h1>}>
            <Head title="Daftar Lomba" />

            <FlashMessage />

            <div className="stack">
                <div className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Formulir pendaftaran</span>
                            <h2>{competition.name}</h2>
                            <p className="muted">
                                {isTeam ? 'Lomba beregu' : 'Lomba individu'} · biaya {formatRupiah(competition.fee)}
                                {competition.quota !== null ? ` · kuota ${competition.quota}` : ''}
                            </p>
                        </div>
                        <Link className="btn btn--ghost btn--sm" href={route('portal.level', level)}>
                            <ArrowLeft size={16} aria-hidden />
                            Kembali ke portal
                        </Link>
                    </div>

                    <form onSubmit={submit}>
                        {isTeam && (
                            <Field
                                label="Nama Tim"
                                htmlFor="team_name"
                                error={errors.team_name}
                                hint={`Jumlah anggota ${competition.team_min}–${competition.team_max} siswa.`}
                                required
                            >
                                <input
                                    id="team_name"
                                    type="text"
                                    name="team_name"
                                    className="input"
                                    value={data.team_name}
                                    onChange={(e) => setData('team_name', e.target.value)}
                                />
                            </Field>
                        )}

                        <fieldset className="fieldset">
                            <legend>
                                Pilih Siswa {isTeam ? `(${competition.team_min}–${competition.team_max} siswa)` : '(pilih 1 siswa)'}
                            </legend>

                            <div className="stack-sm" style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {participants.map((p) => (
                                    <label key={p.id} className="check">
                                        <input
                                            type={isTeam ? 'checkbox' : 'radio'}
                                            name="participant_ids"
                                            checked={data.participant_ids.includes(p.id)}
                                            onChange={() => toggleMember(p.id)}
                                        />
                                        <span>
                                            {p.name}
                                            <span className="small muted" style={{ display: 'block' }}>
                                                Kelas {p.grade} · {p.school_name}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {errors.participant_ids && (
                                <p className="error" role="alert">
                                    {errors.participant_ids}
                                </p>
                            )}
                        </fieldset>

                        <label className="check">
                            <input
                                type="checkbox"
                                checked={data.consent}
                                onChange={(e) => setData('consent', e.target.checked)}
                            />
                            <span>Saya menyetujui persyaratan lomba, juknis, dan kebijakan privasi.</span>
                        </label>
                        {errors.consent && (
                            <p className="error" role="alert">
                                {errors.consent}
                            </p>
                        )}

                        <div className="divider" />

                        <div className="row-between">
                            <p className="small muted" style={{ margin: 0 }}>
                                Biaya pendaftaran <span className="strong">{formatRupiah(competition.fee)}</span> akan
                                ditagihkan setelah draf dikirim.
                            </p>
                            <button type="submit" className="btn btn--clay" disabled={processing}>
                                <CheckCircle2 size={18} aria-hidden />
                                {processing ? 'Menyimpan…' : 'Simpan Draf'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
