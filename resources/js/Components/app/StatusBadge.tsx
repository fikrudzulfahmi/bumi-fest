const MAP: Record<string, { cls: string; label?: string }> = {
    // pendaftaran
    draft: { cls: 'badge--neutral', label: 'Draf' },
    awaiting_payment: { cls: 'badge--wait', label: 'Menunggu bayar' },
    awaiting_verification: { cls: 'badge--wait', label: 'Menunggu verifikasi' },
    verified: { cls: 'badge--ok', label: 'Terverifikasi' },
    rejected: { cls: 'badge--bad', label: 'Ditolak' },
    cancelled: { cls: 'badge--bad', label: 'Dibatalkan' },
    expired: { cls: 'badge--bad', label: 'Kedaluwarsa' },

    // tagihan
    unpaid: { cls: 'badge--wait', label: 'Belum bayar' },
    paid: { cls: 'badge--ok', label: 'Lunas' },

    // lomba
    published: { cls: 'badge--ok', label: 'Terbit' },
    closed: { cls: 'badge--neutral', label: 'Ditutup' },
    'Dibuka': { cls: 'badge--ok' },
    'Segera dibuka': { cls: 'badge--wait' },
    'Ditutup': { cls: 'badge--neutral' },
    'Kuota penuh': { cls: 'badge--bad' },

    // lembar nilai
    locked: { cls: 'badge--ok', label: 'Terkunci' },

    // sertifikat
    winner: { cls: 'badge--ok', label: 'Juara' },
    participation: { cls: 'badge--neutral', label: 'Partisipasi' },

    // pengumuman
    active: { cls: 'badge--ok', label: 'Aktif' },
    inactive: { cls: 'badge--neutral', label: 'Nonaktif' },
};

export default function StatusBadge({ value, label }: { value: string; label?: string }) {
    const entry = MAP[value] ?? { cls: 'badge--info' };
    const text = label ?? entry.label ?? value;

    return <span className={`badge ${entry.cls}`}>{text}</span>;
}
