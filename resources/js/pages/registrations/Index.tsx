import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatRupiah } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Trophy, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Registration {
    id: number;
    code: string;
    status: string;
    status_label: string;
    fee: number;
    team_name: string | null;
    competition_name: string;
    level: string;
    level_label?: string | null;
    slug: string;
}

interface Props {
    registrations: Registration[];
}

export default function Index({ registrations }: Props) {
    const [target, setTarget] = useState<Registration | null>(null);

    const cancel = () => {
        if (!target) {
            return;
        }

        router.post(route('registrations.cancel', target.id), {}, {
            preserveScroll: true,
            onFinish: () => setTarget(null),
        });
    };

    const cancellable = ['draft', 'awaiting_payment', 'rejected'];

    return (
        <AuthenticatedLayout header={<h1>Pendaftaran Saya</h1>}>
            <Head title="Pendaftaran Saya" />

            <FlashMessage />

            <div className="stack">
                <div className="panel">
                    <div className="panel__head">
                        <div>
                            <span className="kicker">Riwayat entri</span>
                            <h2>Daftar pendaftaran</h2>
                            <p className="muted">
                                {registrations.length > 0
                                    ? `${registrations.length} entri tercatat. Buka detail untuk melengkapi dokumen.`
                                    : 'Belum ada entri pada akun ini.'}
                            </p>
                        </div>
                        <Link className="btn btn--clay btn--sm" href={route('portal.index')}>
                            <Trophy size={18} aria-hidden />
                            Cari cabang lomba
                        </Link>
                    </div>

                    {registrations.length === 0 ? (
                        <EmptyState
                            title="Belum ada pendaftaran"
                            description="Pilih cabang lomba di portal, lalu daftarkan siswa Anda. Entri yang tersimpan akan tampil di sini."
                            action={
                                <Link className="btn btn--sm" href={route('portal.index')}>
                                    Buka portal lomba
                                </Link>
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table className="data">
                                <thead>
                                    <tr>
                                        <th>Lomba</th>
                                        <th>Kode</th>
                                        <th>Biaya</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg.id}>
                                            <td data-label="Lomba">
                                                <span className="strong">{reg.competition_name}</span>
                                                {reg.team_name && <span className="small muted"> · {reg.team_name}</span>}
                                                <span className="small muted" style={{ display: 'block' }}>
                                                    Jenjang {reg.level_label ?? reg.level}
                                                </span>
                                            </td>
                                            <td data-label="Kode" className="nowrap">
                                                <span className="tnum small">{reg.code || '—'}</span>
                                            </td>
                                            <td data-label="Biaya" className="num nowrap">
                                                {formatRupiah(reg.fee)}
                                            </td>
                                            <td data-label="Status">
                                                <StatusBadge value={reg.status} label={reg.status_label} />
                                            </td>
                                            <td data-label="Aksi">
                                                <div className="row-gap" style={{ gap: 8 }}>
                                                    <Link
                                                        className="btn btn--ghost btn--sm"
                                                        href={route('registrations.edit', reg.id)}
                                                    >
                                                        <Eye size={16} aria-hidden />
                                                        Detail
                                                    </Link>
                                                    {cancellable.includes(reg.status) && (
                                                        <button
                                                            type="button"
                                                            className="btn btn--danger btn--sm"
                                                            onClick={() => setTarget(reg)}
                                                        >
                                                            <XCircle size={16} aria-hidden />
                                                            Batalkan
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                show={target !== null}
                title="Batalkan pendaftaran?"
                message={
                    <p>
                        Pendaftaran <span className="strong">{target?.competition_name}</span> akan dibatalkan dan slot
                        peserta dilepas. Tindakan ini tidak bisa diurungkan.
                    </p>
                }
                confirmLabel="Ya, batalkan"
                cancelLabel="Tidak jadi"
                danger
                onConfirm={cancel}
                onCancel={() => setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
