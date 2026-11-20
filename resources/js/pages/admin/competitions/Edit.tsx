import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Edit({ competition }: { competition: Record<string, unknown>; levels: Array<{ value: string; label: string }> }) {
    const name = String(competition.name ?? 'Lomba');

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="kicker">Panitia</span>
                    <h1>Edit Lomba</h1>
                </div>
            }
        >
            <Head title={`Edit ${name}`} />

            <div className="panel stack" style={{ maxWidth: 680 }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem' }}>{name}</h2>
                    <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>
                        Perubahan mendasar pada lomba (nama, jenjang, jadwal, biaya) dilakukan lewat formulir
                        pembuatan lomba. Gunakan tombol di bawah untuk membuat lomba baru dengan data serupa,
                        lalu sunting sesuai kebutuhan.
                    </p>
                </div>

                <div className="row-gap">
                    <Link href={route('admin.competitions.show', competition.id as number)} className="btn btn--ghost">
                        Lihat detail lomba
                    </Link>
                    <Link href={route('admin.competitions.index')} className="btn btn--clay">
                        Kembali ke daftar lomba
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
