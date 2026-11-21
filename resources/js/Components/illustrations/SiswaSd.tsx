import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

/**
 * Karakter ilustrasi siswa sekolah dasar Islami untuk kolase hero.
 * Warna memakai token CSS dari bumifest.css supaya tetap dalam palet
 * "Bumi Clay" dan tidak menambah hex baru di komponen.
 */
export function SiswaPutra(props: Props) {
    return (
        <svg viewBox="0 0 210 456" role="img" aria-label="Siswa putra berpeci dengan seragam SD" {...props}>
            <g stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
                <ellipse cx="105" cy="398" rx="46" ry="6" fill="var(--ink)" stroke="none" opacity=".16"/>
                <rect x="82" y="346" width="23" height="28" rx="4" fill="var(--paper)"/>
                <rect x="105" y="346" width="23" height="28" rx="4" fill="#f0e9d8"/>
                <path d="M82 346h23v4H82ZM105 346h23v4h-23Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M80 372h26a8 8 0 0 1 8 8v10H80a9 9 0 0 1-9-9v-6a3 3 0 0 1 3-3Z" fill="var(--ink)"/>
                <path d="M71 388h43a3 3 0 0 1 0 4H71a3 3 0 0 1 0-4Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M84 378h18" stroke="var(--ink-2)" strokeWidth="1.6"/>
                <path d="M130 372h-26a8 8 0 0 0-8 8v10h34a9 9 0 0 0 9-9v-6a3 3 0 0 0-3-3Z" fill="var(--ink-2)"/>
                <path d="M139 388h-43a3 3 0 0 0 0 4h43a3 3 0 0 0 0-4Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M126 378h-18" stroke="var(--ink-2)" strokeWidth="1.6"/>
                <path d="M76 228h58v40H76Z" fill="var(--uniform)"/>
                <path d="M76 260h26v92a6 6 0 0 1-6 6H82a6 6 0 0 1-6-6Z" fill="var(--uniform)"/>
                <path d="M108 260h26v92a6 6 0 0 1-6 6h-14a6 6 0 0 1-6-6Z" fill="var(--uniform-d)"/>
                <path d="M104 262h3v84h-3Z" fill="var(--uniform-d)" stroke="none"/>
                <path d="M75 226h60v6H75Z" fill="var(--uniform-d)" stroke="none"/>
                <path d="M93 120h24v40a10 10 0 0 1-24 0Z" fill="var(--skin-d)" stroke="none"/>
                <path d="M79 162c0-10 12-16 26-16s26 6 26 16v58c0 9-5 13-12 13H91c-7 0-12-4-12-13Z" fill="var(--paper)"/>
                <path d="M87 146h36v8H87Z" fill="var(--paper)"/>
                <path d="M89 154l17 16-18 5Z" fill="var(--paper)"/>
                <path d="M121 154l-17 16 18 5Z" fill="var(--paper)"/>
                <path d="M105 176v46" stroke="var(--sand-2)" strokeWidth="2"/>
                <circle cx="105" cy="182" r="2.3" fill="var(--saffron)" stroke="none"/>
                <circle cx="105" cy="198" r="2.3" fill="var(--saffron)" stroke="none"/>
                <circle cx="105" cy="214" r="2.3" fill="var(--saffron)" stroke="none"/>
                <path d="M76 178c-8 14-9 32-5 48l6 18c2 7 10 11 17 9 6-2 9-8 9-14 3 0 6-3 6-7 0-3-2-5-5-6 1-2 0-4-2-5-3-2-6-1-8 1l-4 3-6-26c-2-10-4-17-8-21Z" fill="var(--skin)"/>
                <path d="M77 214c6 1 13-1 16-6" stroke="var(--skin-d)" strokeWidth="1.6" strokeOpacity=".7"/>
                <path d="M88 240c4 1 7-1 8-4" stroke="var(--skin-d)" strokeWidth="1.6" strokeOpacity=".7"/>
                <path d="M84 160c-9 3-14 12-14 24v4c0 9 9 13 16 10 7-2 10-9 9-16l-2-9c-1-10-4-13-9-13Z" fill="var(--paper)"/>
                <path d="M72 194c6 1 12-2 14-7l2 9c-3 5-9 8-16 6Z" fill="var(--sand-2)"/>
                <path d="M134 178c8 14 9 32 5 48l-6 18c-2 7-10 11-17 9-6-2-9-8-9-14-3 0-6-3-6-7 0-3 2-5 5-6-1-2 0-4 2-5 3-2 6-1 8 1l4 3 6-26c2-10 4-17 8-21Z" fill="var(--skin)"/>
                <path d="M133 214c-6 1-13-1-16-6" stroke="var(--skin-d)" strokeWidth="1.6" strokeOpacity=".7"/>
                <path d="M122 240c-4 1-7-1-8-4" stroke="var(--skin-d)" strokeWidth="1.6" strokeOpacity=".7"/>
                <path d="M126 160c9 3 14 12 14 24v4c0 9-9 13-16 10-7-2-10-9-9-16l2-9c1-10 4-13 9-13Z" fill="var(--paper)"/>
                <path d="M138 194c-6 1-12-2-14-7l-2 9c3 5 9 8 16 6Z" fill="var(--sand-2)"/>
                <circle cx="105" cy="86" r="40" fill="var(--skin)"/>
                <circle cx="66" cy="90" r="8" fill="var(--skin)"/>
                <circle cx="144" cy="90" r="8" fill="var(--skin-d)"/>
                <path d="M73 64 75 36q1-6 30-6t30 6l2 28Z" fill="var(--ink)"/>
                <path d="M74 54h62v9H74Z" fill="var(--ink-2)"/>
                <path d="M76 55h58v2.5H76Z" fill="var(--saffron)" stroke="none" opacity=".9"/>
                <path d="M67 74c1-8 5-12 10-14-4 6-6 11-6 17Z" fill="var(--ink)"/>
                <path d="M143 74c-1-8-5-12-10-14 4 6 6 11 6 17Z" fill="var(--ink)"/>
                <circle cx="91" cy="90" r="3.6" fill="var(--ink)" stroke="none"/>
                <circle cx="119" cy="90" r="3.6" fill="var(--ink)" stroke="none"/>
                <circle cx="92" cy="88.6" r="1.2" fill="var(--paper)" stroke="none"/>
                <circle cx="120" cy="88.6" r="1.2" fill="var(--paper)" stroke="none"/>
                <path d="M85 79c2-3 8-3 10 0" strokeWidth="2.4"/>
                <path d="M115 79c2-3 8-3 10 0" strokeWidth="2.4"/>
                <path d="M96 104c3 5 15 5 18 0" stroke="var(--clay-d)" strokeWidth="2.8"/>
                <circle cx="79" cy="101" r="5" fill="var(--clay)" stroke="none" opacity=".5"/>
                <circle cx="131" cy="101" r="5" fill="var(--clay)" stroke="none" opacity=".5"/>
            </g>
        </svg>
    );
}

export function SiswiPutri(props: Props) {
    return (
        <svg viewBox="0 0 210 456" role="img" aria-label="Siswi berhijab dengan seragam SD" {...props}>
            <g stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
                <ellipse cx="105" cy="398" rx="46" ry="6" fill="var(--ink)" stroke="none" opacity=".16"/>
                <rect x="84" y="348" width="22" height="24" rx="4" fill="var(--paper)"/>
                <rect x="105" y="348" width="22" height="24" rx="4" fill="#f0e9d8"/>
                <path d="M84 348h22v4H84ZM105 348h22v4h-22Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M82 372h24a8 8 0 0 1 8 8v10H82a9 9 0 0 1-9-9v-6a3 3 0 0 1 3-3Z" fill="var(--ink)"/>
                <path d="M73 388h41a3 3 0 0 1 0 4H73a3 3 0 0 1 0-4Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M86 378h17" stroke="var(--ink-2)" strokeWidth="1.6"/>
                <path d="M128 372h-24a8 8 0 0 0-8 8v10h32a9 9 0 0 0 9-9v-6a3 3 0 0 0-3-3Z" fill="var(--ink-2)"/>
                <path d="M137 388h-41a3 3 0 0 0 0 4h41a3 3 0 0 0 0-4Z" fill="var(--sand-2)" stroke="none"/>
                <path d="M124 378h-17" stroke="var(--ink-2)" strokeWidth="1.6"/>
                <path d="M79 238h52l19 108H60Z" fill="var(--uniform)"/>
                <path d="M77 238h56v9H77Z" fill="var(--uniform-d)" stroke="none"/>
                <path d="M93 250l-11 92M117 250l11 92" stroke="var(--uniform-d)" strokeWidth="2.4" strokeOpacity=".85"/>
                <path d="M60 346h90l1 6H59Z" fill="var(--uniform-d)" stroke="none"/>
                <path d="M80 162c0-10 11-16 25-16s25 6 25 16v58c0 9-5 13-12 13H92c-7 0-12-4-12-13Z" fill="var(--paper)"/>
                <path d="M105 172v56" stroke="var(--sand-2)" strokeWidth="2"/>
                <circle cx="105" cy="188" r="2.3" fill="var(--saffron)" stroke="none"/>
                <circle cx="105" cy="206" r="2.3" fill="var(--saffron)" stroke="none"/>
                <path d="M92 150h26v5c0 3-6 5-13 5s-13-2-13-5Z" fill="var(--sand-2)"/>
                <path d="M76 186c-8 12-10 30-6 46l6 18c2 7 10 11 17 9 6-2 9-8 9-14 3 0 6-3 6-7 0-3-2-5-5-6 1-2 0-4-2-5-3-2-6-1-8 1l-4 3-6-24c-2-10-4-17-7-21Z" fill="var(--skin)"/>
                <path d="M86 160c-9 3-14 12-14 24v4c0 9 9 13 16 10 7-2 10-9 9-16l-2-9c-1-10-4-13-9-13Z" fill="var(--paper)"/>
                <path d="M74 194c6 1 12-2 14-7l2 9c-3 5-9 8-16 6Z" fill="var(--sand-2)"/>
                <path d="M134 186c8 12 10 30 6 46l-6 18c-2 7-10 11-17 9-6-2-9-8-9-14-3 0-6-3-6-7 0-3 2-5 5-6-1-2 0-4 2-5 3-2 6-1 8 1l4 3 6-24c2-10 4-17 7-21Z" fill="var(--skin)"/>
                <path d="M124 160c9 3 14 12 14 24v4c0 9-9 13-16 10-7-2-10-9-9-16l2-9c1-10 4-13 9-13Z" fill="var(--paper)"/>
                <path d="M136 194c-6 1-12-2-14-7l-2 9c3 5 9 8 16 6Z" fill="var(--sand-2)"/>
                <path d="M105 16c42 0 60 30 60 66 0 18-5 28-5 42 0 20-11 32-29 34-11 1-19-4-26-11-7 7-15 12-26 11-18-2-29-14-29-34 0-14-5-24-5-42 0-36 18-66 60-66Z" fill="var(--paper)"/>
                <path d="M105 16c18 0 32 5 42 15-10-7-22-9-34-7 16 6 26 22 26 38 0 18-5 28-5 42 0 14-6 24-17 30 12-1 19-11 19-29 0-14 5-24 5-42 0-20-8-38-20-47Z" fill="var(--sand-2)" stroke="none"/>
                <ellipse cx="105" cy="90" rx="26" ry="31" fill="var(--skin)"/>
                <path d="M112 120c6-1 10-5 12-10" stroke="var(--sand-2)" strokeWidth="2" fill="none"/>
                <circle cx="95" cy="92" r="3.4" fill="var(--ink)" stroke="none"/>
                <circle cx="115" cy="92" r="3.4" fill="var(--ink)" stroke="none"/>
                <circle cx="96" cy="90.8" r="1.1" fill="var(--paper)" stroke="none"/>
                <circle cx="116" cy="90.8" r="1.1" fill="var(--paper)" stroke="none"/>
                <path d="M89 83c2-3 7-3 9 0" strokeWidth="2.2"/>
                <path d="M112 83c2-3 7-3 9 0" strokeWidth="2.2"/>
                <path d="M99 106c2 4 10 4 12 0" stroke="var(--clay-d)" strokeWidth="2.6"/>
                <circle cx="85" cy="103" r="4.5" fill="var(--clay)" stroke="none" opacity=".5"/>
                <circle cx="125" cy="103" r="4.5" fill="var(--clay)" stroke="none" opacity=".5"/>
            </g>
        </svg>
    );
}
