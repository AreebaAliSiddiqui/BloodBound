// Public landing-page endpoints. Standalone: needs the backend running (default http://localhost:5000).
// Run:  node Tests/public.test.js        (Node 18+)
const assert = require('assert');
const BASE = process.env.API_URL || 'http://localhost:5000';
const FORBIDDEN = ['patient_identifier', 'hospital_address', 'hospital_id', 'request_id', 'phone', 'email',
                   'latitude', 'longitude', 'organizer_id', 'password_hash', 'user_id'];
const get = async (p) => { const r = await fetch(BASE + p); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const noLeaks = (o) => FORBIDDEN.forEach((k) => assert.ok(!(k in o), `leaked field: ${k}`));

const tests = [
  ['TC-PUB-01 camps endpoint works without a token', async () => {
    const r = await get('/api/public/camps');
    assert.strictEqual(r.status, 200); assert.ok(Array.isArray(r.body));
  }],
  ['TC-PUB-02 camps expose no private fields and only open camps', async () => {
    const r = await get('/api/public/camps');
    r.body.forEach((c) => { noLeaks(c); assert.ok(['Published', 'Ongoing'].includes(c.status)); assert.ok(c.slots_left <= 1000); });
  }],
  ['TC-PUB-03 live-request endpoint works without a token', async () => {
    const r = await get('/api/public/live-request');
    assert.strictEqual(r.status, 200); assert.ok('request' in r.body);
  }],
  ['TC-PUB-04 live request exposes no private fields and is not expired', async () => {
    const { body } = await get('/api/public/live-request');
    if (body.request) { noLeaks(body.request); assert.ok(new Date(body.request.expires_at) > new Date()); }
  }],
  ['TC-PUB-05 existing camps API still requires login', async () => {
    const r = await get('/api/camps');
    assert.ok([401, 403].includes(r.status), `expected 401/403, got ${r.status}`);
  }],
  ['TC-PUB-06 existing requests API still requires login', async () => {
    const r = await get('/api/requests');
    assert.ok([401, 403].includes(r.status), `expected 401/403, got ${r.status}`);
  }],
];

(async () => {
  let pass = 0;
  for (const [name, fn] of tests) {
    try { await fn(); pass++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '-', e.message); }
  }
  console.log(`\n${pass}/${tests.length} passed`);
  process.exit(pass === tests.length ? 0 : 1);
})();
