import { PropsWithChildren, useEffect, useRef } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    title: string;
    wide?: boolean;
    closeable?: boolean;
}

export default function Modal({ show, onClose, title, wide, closeable = true, children }: PropsWithChildren<Props>) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!show) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeable) {
                onClose();
            }
        };

        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [show, closeable, onClose]);

    if (!show) {
        return null;
    }

    return (
        <div
            className="overlay"
            role="presentation"
            onClick={(e) => {
                if (e.target === e.currentTarget && closeable) {
                    onClose();
                }
            }}
        >
            <div
                ref={panelRef}
                className={`modal${wide ? ' modal--wide' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
            >
                <div className="panel__head">
                    <h2>{title}</h2>
                    {closeable && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Tutup">
                            Tutup
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}
