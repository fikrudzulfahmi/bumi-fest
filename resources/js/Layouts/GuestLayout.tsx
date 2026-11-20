import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="auth">
            <a href="#konten" className="skip-link">
                Lewati ke konten
            </a>

            <div className="auth__panel">
                <Link href="/" className="auth__brand">
                    <span className="logo" style={{ fontSize: 26 }}>
                        <i aria-hidden="true" />
                        bumifest
                    </span>
                </Link>

                <div id="konten">{children}</div>
            </div>
        </div>
    );
}
