import { ReactNode } from 'react';
import Modal from './Modal';

interface Props {
    show: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    processing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    show,
    title,
    message,
    confirmLabel = 'Ya, lanjutkan',
    cancelLabel = 'Batal',
    danger = false,
    processing = false,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <Modal show={show} title={title} onClose={onCancel} closeable={!processing}>
            <div className="stack-sm">{message}</div>
            <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={processing}>
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    className={`btn ${danger ? 'btn--danger' : 'btn--clay'}`}
                    onClick={onConfirm}
                    disabled={processing}
                >
                    {processing ? 'Memproses…' : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
