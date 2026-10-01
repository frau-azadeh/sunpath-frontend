import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVehiclePlate, normalizeVehiclePlate, formatVehiclePlate, escapeHtml } from '../lib/plate.ts';

test('motorcycle uses three/five digits, preserves zeroes and accepts Persian/Arabic digits', () => {
  assert.equal(normalizeVehiclePlate('۰۱۲ / ۰۰۳۴۵', 3), '012-00345');
  assert.equal(normalizeVehiclePlate('١٢٣٤٥٦٧٨', 3), '123-45678');
  assert.deepEqual(parseVehiclePlate('123-45678', 3), { kind: 'motorcycle', top: '123', bottom: '45678' });
  assert.equal(formatVehiclePlate('123-45678', 3), '۱۲۳ / ۴۵۶۷۸');
});
test('cars normalize spacing, Iran text, Arabic letter and digit variants', () => {
  assert.equal(normalizeVehiclePlate('۱۲ ي ۳۴۵ ایران ۶۷', 0), '12ی345-67');
  assert.equal(normalizeVehiclePlate('12ب34567', 2), '12ب345-67');
  assert.equal(formatVehiclePlate('12ب345-67', 1), '۱۲ ب ۳۴۵ ایران ۶۷');
});
test('changing vehicle type requires a compatible plate', () => {
  assert.equal(normalizeVehiclePlate('12ب345-67', 3), null);
  assert.equal(normalizeVehiclePlate('123-45678', 0), null);
  for (const value of ['123-4567', '1234-5678', '123-456789', '', '123-abcde']) assert.equal(normalizeVehiclePlate(value, 3), null);
});
test('history without vehicle type recognizes numeric motorcycle plates', () => {
  assert.equal(parseVehiclePlate('123-45678')?.kind, 'motorcycle');
  assert.equal(parseVehiclePlate('12ب345-67')?.kind, 'car');
});
test('legacy values are preserved in fallback and map HTML escapes user input', () => {
  assert.equal(formatVehiclePlate('12-345-AB', 3), '۱۲-۳۴۵-AB');
  assert.equal(formatVehiclePlate(null), 'پلاک ثبت نشده');
  assert.equal(escapeHtml('<img src="x" onerror=\'x\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt;&amp;');
});
