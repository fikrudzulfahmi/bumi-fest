import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage from '@/Components/app/FlashMessage';
import StatusBadge from '@/Components/app/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, Copy, Pencil, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Competition {
    id: number;
    name: string;
    level_label: string;
    category_label: string;
    status: string;
    status_label: string;
    fee: number;
    opens_at: string;
    closes_at: string;
}

type Action = { type: 'publish' | 'archive' | 'duplicate' | 'destroy'; label: string } | null;

export default function Show({ competition }: { competition: Competition }) {
    const [pending, setPending] = useState<Action>(null);
    const [processing, setProcessing] = useState(false);

    const run = () => {
        if (!pending) {
            return;
        }

        setProcessing(true);
        const options = { onFinish: () => setProcessing(false), preserveScroll: true };

        if (pending.type === 'destroy') {
            router.delete(route('admin.competitions.destroy', competition.id), {
                ...options,
                onSuccess: () => setPending(null),
            });
            return;
        }

        router.post(route(`admin.competitions.${pending.type}`, competition.id), {}, {
            ...options,
            onSuccess: () => setPending(null),
        });
    };

    const info = [
        { label: 'Jenjang', value: competition.level_label },
        { label: 'Kategori', value: competition.category_label },
        { label: 'Biaya', value: competition.fee === 0 ? 'Gratis' : `Rp ${competition.fee.toLocaleString('id-ID')}` },
        { label: 'Dibuka', value: new Date(competition.opens_at).toLocaleString('id-ID') },
        { label: 'Ditutup', value: new Date(competition.closes_at).toLocaleString('id-ID') },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Detail lomba</span>
                    <h1>{competition.name}</h1>
                </div>
            }
        >
            <Head title={competition.name} />

            <FlashMessage />

            <div className="panel">
                <div className="panel__head">
                    <div>
                        <StatusBadge value={competition.status} label={competition.status_label} />
                    </div>
                </div>

                <div className="row-gap" style={{ gap: 10 }}>
                    {competition.status === 'draft' && (
                        <button
                            type="button"
                            className="btn btn--clay btn--sm"
                            onClick={() => setPending({ type: 'publish', label: 'Publikasikan' })}
                        >
                            <Send size={15} aria-hidden />
                            Publikasikan
                        </button>
                    )}
                    {competition.status === 'published' && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setPending({ type: 'archive', label: 'Arsipkan' })}
                        >
                            <Archive size={15} aria-hidden />
                            Arsipkan
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setPending({ type: 'duplicate', label: 'Duplikasi' })}
                    >
                        <Copy size={15} aria-hidden />
                        Duplikasi
                    </button>
                    <Link href={route('admin.competitions.edit', competition.id)} className="btn btn--ghost btn--sm">
                        <Pencil size={15} aria-hidden />
                        Edit
                    </Link>
                    <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => setPending({ type: 'destroy', label: 'Hapus' })}
                    >
                        <Trash2 size={15} aria-hidden />
                        Hapus
                    </button>
                </div>

                <hr className="divider" />

                <div className="stat-grid">
                    {info.map((row) => (
                        <div key={row.label}>
                            <span className="kicker">{row.label}</span>
                            <p className="strong" style={{ marginTop: 4 }}>
                                {row.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                show={pending !== null}
                title={`${pending?.label} lomba ini?`}
                danger={pending?.type === 'destroy'}
                processing={processing}
                confirmLabel={`Ya, ${pending?.label.toLowerCase() ?? ''}`}
                onConfirm={run}
                onCancel={() => setPending(null)}
                message={
                    <p className="muted" style={{ fontSize: 15 }}>
                        {pending?.type === 'destroy'
                            ? 'Lomba dan seluruh datanya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'
                            : `Lomba "${competition.name}" akan ${pending?.label.toLowerCase()}.`}
                    </p>
                }
            />
        </AuthenticatedLayout>
    );
}
