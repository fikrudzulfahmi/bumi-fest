import ConfirmDialog from '@/Components/app/ConfirmDialog';
import Field from '@/Components/app/Field';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import Modal from '@/Components/app/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface Participant {
    id: number;
    name: string;
    grade: number;
    level: string;
    school_name: string;
    school_city: string | null;
    has_active_registration: boolean;
}

interface Props {
    participants: Participant[];
}

const LEVEL_LABEL: Record<string, string> = {
    sd_mi: 'SD/MI',
    smp_mts: 'SMP/MTs',
};

type FormData = {
    name: string;
    grade: string;
    school_name: string;
    school_city: string;
};

export default function Index({ participants }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Participant | null>(null);
    const [target, setTarget] = useState<Participant | null>(null);

    const form = useForm<FormData>({
        name: '',
        grade: '',
        school_name: '',
        school_city: '',
    });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', grade: '', school_name: '', school_city: '' });
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (participant: Participant) => {
        setEditing(participant);
        form.setData({
            name: participant.name,
            grade: String(participant.grade),
            school_name: participant.school_name,
            school_city: participant.school_city ?? '',
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const closeModal = () => {
        if (form.processing) {
            return;
        }

        setModalOpen(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    };

    const save = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditing(null);
                form.reset();
            },
        };

        if (editing) {
            form.put(route('participants.update', editing.id), options);
        } else {
            form.post(route('participants.store'), options);
        }
    };

    const destroy = () => {
        if (!target) {
            return;
        }

        router.delete(route('participants.destroy', target.id), {
            preserveScroll: true,
            onFinish: () => setTarget(null),
        });
    };

    return (
        <AuthenticatedLayout header={<h1>Data Siswa</h1>}>
            <Head title="Data Siswa" />

            <FlashMessage />

            <div className="stack">
                <section className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Basis data peserta</span>
                            <h2>Daftar siswa</h2>
                            <p className="muted">
                                {participants.length > 0
                                    ? `${participants.length} siswa terdata. Jenjang ditentukan otomatis dari kelas.`
                                    : 'Belum ada siswa terdata pada akun ini.'}
                            </p>
                        </div>
                        <button type="button" className="btn btn--clay btn--sm" onClick={openCreate}>
                            <Plus size={18} aria-hidden />
                            Tambah siswa
                        </button>
                    </div>

                    {participants.length === 0 ? (
                        <EmptyState
                            title="Belum ada siswa"
                            description="Tambahkan siswa dengan nama, kelas, dan sekolah. Siswa inilah yang nanti didaftarkan ke cabang lomba."
                            action={
                                <button type="button" className="btn btn--sm" onClick={openCreate}>
                                    <Users size={16} aria-hidden />
                                    Tambah siswa pertama
                                </button>
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Nama</th>
                                        <th>Kelas</th>
                                        <th>Jenjang</th>
                                        <th>Sekolah</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map((p) => (
                                        <tr key={p.id}>
                                            <td data-label="Nama" className="strong">
                                                {p.name}
                                            </td>
                                            <td data-label="Kelas" className="num nowrap">
                                                {p.grade}
                                            </td>
                                            <td data-label="Jenjang" className="nowrap">
                                                {LEVEL_LABEL[p.level] ?? p.level}
                                            </td>
                                            <td data-label="Sekolah">
                                                {p.school_name}
                                                {p.school_city && (
                                                    <span className="small muted" style={{ display: 'block' }}>
                                                        {p.school_city}
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Status">
                                                {p.has_active_registration ? (
                                                    <span className="badge badge--ok">Pendaftaran aktif</span>
                                                ) : (
                                                    <span className="badge badge--neutral">Belum terdaftar</span>
                                                )}
                                            </td>
                                            <td data-label="Aksi">
                                                <div className="row-gap" style={{ gap: 8 }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn--ghost btn--sm"
                                                        onClick={() => openEdit(p)}
                                                    >
                                                        <Pencil size={16} aria-hidden />
                                                        Ubah
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--danger btn--sm"
                                                        onClick={() => setTarget(p)}
                                                    >
                                                        <Trash2 size={16} aria-hidden />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="small muted">
                    Siswa yang masih terdaftar pada pendaftaran aktif tidak dapat dihapus. Batalkan pendaftarannya terlebih
                    dahulu.
                </p>
            </div>

            <Modal show={modalOpen} onClose={closeModal} title={editing ? 'Ubah data siswa' : 'Tambah siswa'}>
                <form onSubmit={save}>
                    <Field label="Nama lengkap siswa" htmlFor="p-name" error={form.errors.name} required>
                        <input
                            id="p-name"
                            type="text"
                            className="input"
                            value={form.data.name}
                            autoComplete="off"
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                    </Field>

                    <Field
                        label="Kelas"
                        htmlFor="p-grade"
                        error={form.errors.grade}
                        hint="Kelas 1–6 masuk jenjang SD/MI, kelas 7–9 masuk SMP/MTs."
                        required
                    >
                        <input
                            id="p-grade"
                            type="number"
                            min={1}
                            max={9}
                            inputMode="numeric"
                            className="input"
                            value={form.data.grade}
                            onChange={(e) => form.setData('grade', e.target.value)}
                        />
                    </Field>

                    <Field label="Nama sekolah" htmlFor="p-school" error={form.errors.school_name} required>
                        <input
                            id="p-school"
                            type="text"
                            className="input"
                            value={form.data.school_name}
                            onChange={(e) => form.setData('school_name', e.target.value)}
                        />
                    </Field>

                    <Field label="Kota sekolah" htmlFor="p-city" error={form.errors.school_city} hint="Opsional.">
                        <input
                            id="p-city"
                            type="text"
                            className="input"
                            value={form.data.school_city}
                            onChange={(e) => form.setData('school_city', e.target.value)}
                        />
                    </Field>

                    <div className="modal__actions">
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={closeModal}
                            disabled={form.processing}
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn btn--clay" disabled={form.processing}>
                            {form.processing ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah siswa'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                show={target !== null}
                title="Hapus data siswa?"
                message={
                    <p>
                        Data <span className="strong">{target?.name}</span> akan dihapus permanen dari daftar siswa Anda.
                    </p>
                }
                confirmLabel="Ya, hapus"
                cancelLabel="Batal"
                danger
                onConfirm={destroy}
                onCancel={() => setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
