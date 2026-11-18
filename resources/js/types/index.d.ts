export interface User {
    id: number;
    name: string;
    email: string;
    whatsapp?: string;
    role: 'participant' | 'institution' | 'judge' | 'admin';
    preferred_level?: 'sd_mi' | 'smp_mts';
    is_active: boolean;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};

export interface Paginated<T> {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}
