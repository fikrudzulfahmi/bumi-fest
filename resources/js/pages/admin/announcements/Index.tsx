import ConfirmDialog from '@/Components/app/ConfirmDialog';
import FlashMessage, { EmptyState } from '@/Components/app/FlashMessage';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Send, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';

interface Announcement {
    id: number;
    level: string | null;
    title: string;
    body: string;
    published_at: string | null;
}

const LEVEL_LABELS: Record<string, string> = {
    sd_mi: 'SD/MI',
    smp_mts: 'SMP/MTs',
};

export default function Index({ announcements }: { announcements: { data: Announcement[]; total?: number } }) {
    const rows = announcements.data ?? [];
    const [deleting, setDeleting] = useState<Announcement | null>(null);
    const [processing, setProcessing] = useState(false);

    const togglePublish = (item: Announcement) => {
        router.post(
            item.published_at
                ? route('admin.announcements.unpublish', item.id)
                : route('admin.announcements.publish', item.id),
            {},
            { preserveScroll: true },
        );
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setProcessing(true);
        router.delete(route('admin.announcements.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Pengumuman</h1>
                </div>
            }
        >
            <Head title="Kelola Pengumuman" />

            <FlashMessage />

            <div className="row-between">
                <p className="muted" style={{ fontSize: 15 }}>
                    {announcements.total ?? rows.length} pengumuman.
                </p>
                <Link href={route('admin.announcements.create')} className="btn btn--clay btn--sm">
                    <Plus size={16} aria-hidden />
                    Tambah pengumuman
                </Link>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    title="Belum ada pengumuman"
                    description="Buat pengumuman untuk memberi info kepada peserta."
                    action={
                        <Link href={route('admin.announcements.create')} className="btn btn--sm">
                            Tambah pengumuman
                        </Link>
                    }
                />
            ) : (
                <div className="stack">
                    {rows.map((item) => (
                        <article key={item.id} className="panel">
                            <div className="panel__head">
                                <div>
                                    <h2 style={{ fontSize: '1.25rem' }}>{item.title}</h2>
                                    <p className="small muted" style={{ marginTop: 4 }}>
                                        {item.level ? LEVEL_LABELS[item.level] : 'Umum'}
                                    </p>
                                </div>
                                <span className={`badge ${item.published_at ? 'badge--ok' : 'badge--neutral'}`}>
                                    {item.published_at ? 'Terbit' : 'Draf'}
                                </span>
                            </div>

                            <p style={{ fontSize: 15 }}>{item.body}</p>

                            <div className="row-gap" style={{ gap: 8, marginTop: 16 }}>
                                <button type="button" className="btn btn--ghost btn--sm" onClick={() => togglePublish(item)}>
                                    {item.published_at ? (
                                        <>
                                            <Undo2 size={15} aria-hidden />
                                            Tarik
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} aria-hidden />
                                            Terbitkan
                                        </>
                                    )}
                                </button>
                                <Link
                                    href={route('admin.announcements.edit', item.id)}
                                    className="btn btn--ghost btn--sm"
                                >
                                    <Pencil size={15} aria-hidden />
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    onClick={() => setDeleting(item)}
                                >
                                    <Trash2 size={15} aria-hidden />
                                    Hapus
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <ConfirmDialog
                show={deleting !== null}
                title="Hapus pengumuman ini?"
                danger
                processing={processing}
                confirmLabel="Ya, hapus"
                onConfirm={confirmDelete}
                onCancel={() => setDeleting(null)}
                message={
                    <p className="muted" style={{ fontSize: 15 }}>
                        Pengumuman “{deleting?.title}” akan dihapus permanen.
                    </p>
                }
            />
        </AuthenticatedLayout>
    );
}
