import { usePage } from '@inertiajs/react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

interface Flash {
    success?: string;
    error?: string;
    status?: string;
}

export default function FlashMessage() {
    const flash = (usePage().props as { flash?: Flash }).flash;

    if (!flash?.success && !flash?.error && !flash?.status) {
        return null;
    }

    if (flash.error) {
        return (
            <div className="toast toast--error" role="alert">
                <XCircle size={20} aria-hidden />
                <span>{flash.error}</span>
            </div>
        );
    }

    return (
        <div className="toast toast--ok" role="status">
            <CheckCircle2 size={20} aria-hidden />
            <span>{flash.success ?? flash.status}</span>
        </div>
    );
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="empty">
            <Info size={26} style={{ color: 'var(--clay)' }} aria-hidden />
            <h3 style={{ marginTop: 10 }}>{title}</h3>
            {description && <p className="muted">{description}</p>}
            {action}
        </div>
    );
}
