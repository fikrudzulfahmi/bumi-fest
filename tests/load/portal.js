// k6 load test — halaman daftar lomba portal (AC-F13-05)
// Butuh cookie sesi pengguna terverifikasi (login manual dulu).
//
//   k6 run tests/load/portal.js -e BASE_URL=https://<domain> -e SESSION=<cookie>

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
  http.get(`${BASE_URL}/portal/sd-mi`);
}
