// k6 load test — Bumifest (AC-F13-05)
// Target PRD §7: p95 < 800 ms pada 500 VU untuk beranda & daftar lomba.
//
// Jalankan:
//   k6 run tests/load/home.js
//   k6 run tests/load/portal.js
//
// Sesuaikan BASE_URL. Untuk login, isi token/session setelah login manual.

import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8123';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  http.get(`${BASE_URL}/`);
}
