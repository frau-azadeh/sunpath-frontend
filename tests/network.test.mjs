import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl, getHubBaseUrl } from '../lib/api/base.ts';

test('LAN IP and HTTPS resolve API/hub to the page origin without localhost', () => {
  delete process.env.NEXT_PUBLIC_API_BASE;
  for (const origin of ['http://localhost:3000', 'http://192.168.43.125:3000', 'https://192.168.137.5:3000']) {
    globalThis.window = { location: { origin }, CONFIG: { NEXT_PUBLIC_API_BASE: '/backend' } };
    assert.equal(getApiBaseUrl(), '/backend');
    assert.equal(getHubBaseUrl(), `${origin}/backend`);
  }
  delete globalThis.window;
});
test('missing config immediately falls back to same-origin proxy', () => {
  delete process.env.NEXT_PUBLIC_API_BASE;
  globalThis.window = { location: { origin: 'http://10.1.2.3:3000' } };
  assert.equal(getHubBaseUrl(), 'http://10.1.2.3:3000/backend');
  delete globalThis.window;
});
