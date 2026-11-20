import { Link } from '@inertiajs/react';

export interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

export default function Pagination({ links, total, perPage }: { links: PageLink[]; total?: number; perPage?: number }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav className="pagination" aria-label="Navigasi halaman">
            {total !== undefined && (
                <span className="small muted" style={{ marginRight: 'auto' }}>
                    {total} data{perPage ? ` · ${perPage}/halaman` : ''}
                </span>
            )}
            {links.map((link, i) => {
                const label = link.label
                    .replace('&laquo; Previous', '‹ Sebelumnya')
                    .replace('Next &raquo;', 'Berikutnya ›')
                    .replace('&laquo;', '‹')
                    .replace('&raquo;', '›');

                if (link.url === null) {
                    return (
                        <span
                            key={i}
                            className="page-btn is-disabled"
                            aria-disabled="true"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        className={link.active ? 'page-btn is-active' : 'page-btn'}
                        aria-current={link.active ? 'page' : undefined}
                        preserveScroll
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </nav>
    );
}
