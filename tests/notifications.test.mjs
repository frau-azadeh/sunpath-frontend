import test from 'node:test';
import assert from 'node:assert/strict';
import { missionNextAction, workflowLabel, unseenUnread } from '../lib/notifications.ts';
import { driverAuthorization } from '../lib/api/auth.ts';

const time = '2026-10-01T08:00:00Z';
test('acceptance is a separate step before starting the journey', () => {
  assert.equal(missionNextAction({ status: 1 }), 'accept');
  assert.equal(missionNextAction({ status: 'Assigned', acceptedAtUtc: time }), 'start');
  assert.equal(workflowLabel({ status: 1, acceptedAtUtc: time }), 'پذیرفته شده');
});
test('arrival is separate from completion and supports numeric/string API states', () => {
  for (const status of [2, 'Started', 'InProgress', 'in_progress']) {
    assert.equal(missionNextAction({ status, acceptedAtUtc: time }), 'arrive');
    assert.equal(missionNextAction({ status, acceptedAtUtc: time, arrivedAtUtc: time }), 'complete');
  }
  assert.equal(workflowLabel({ status: 2, arrivedAtUtc: time }), 'رسیده به مقصد');
});
test('completed/cancelled missions have no remaining driver actions', () => {
  for (const status of [3,4,'Completed','Cancelled']) assert.equal(missionNextAction({ status, acceptedAtUtc: time, arrivedAtUtc: time }), null);
  assert.equal(workflowLabel({ status: 3, arrivedAtUtc: time }), 'تکمیل شده');
  assert.equal(workflowLabel({ status: 4, acceptedAtUtc: time }), 'لغو شده');
});
test('read and previously displayed notifications do not alert again after refresh/reconnect', () => {
  const records = [{id:4,readAtUtc:null},{id:2,readAtUtc:time},{id:3,readAtUtc:null},{id:1,readAtUtc:null}];
  const seen = new Set([1]);
  const fresh = unseenUnread(records, seen);
  assert.deepEqual(fresh.map(item=>item.id), [3,4]);
  fresh.forEach(item=>seen.add(item.id));
  assert.equal(unseenUnread(records, seen).length, 0);
});
test('driver identity comes from a saved token and malformed/legacy sessions send no token', () => {
  globalThis.window = {};
  globalThis.localStorage = { getItem: () => JSON.stringify({driverId:5,token:'signed-session'}) };
  assert.deepEqual(driverAuthorization(), {Authorization:'Bearer signed-session'});
  globalThis.localStorage.getItem = () => JSON.stringify({driverId:5,token:null});
  assert.deepEqual(driverAuthorization(), {});
  globalThis.localStorage.getItem = () => 'bad json';
  assert.deepEqual(driverAuthorization(), {});
  delete globalThis.window; delete globalThis.localStorage;
});
