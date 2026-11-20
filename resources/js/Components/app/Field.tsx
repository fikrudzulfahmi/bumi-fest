import { ReactNode } from 'react';

interface Props {
    label: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}

export default function Field({ label, htmlFor, hint, error, required, children }: Props) {
    return (
        <div className="field">
            <label className="label" htmlFor={htmlFor}>
                {label}
                {required && (
                    <span aria-hidden="true" style={{ color: 'var(--clay)' }}>
                        {' '}
                        *
                    </span>
                )}
            </label>
            {children}
            {hint && !error && <p className="hint">{hint}</p>}
            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
