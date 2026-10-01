import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/notification-sw.js',import.meta.url),'utf8');
function setup(clients) {
  const handlers={};
  const self={location:{origin:'https://sunpath.local'},clients,skipWaiting:async()=>{},addEventListener:(name,handler)=>{handlers[name]=handler;}};
  vm.runInNewContext(source,{self,URL});return handlers;
}
test('notification click focuses and navigates an existing app window', async () => {
  let navigated,focused=false,promise;
  const handlers=setup({matchAll:async()=>[{url:'https://sunpath.local/map',navigate:async url=>{navigated=url;},focus:async()=>{focused=true;}}],openWindow:async()=>{throw Error('must reuse window');}});
  handlers.notificationclick({notification:{data:{url:'/driver/dispatch'},close(){}},waitUntil:value=>{promise=value;}});
  await promise;assert.equal(navigated,'https://sunpath.local/driver/dispatch');assert.equal(focused,true);
});
test('notification click rejects external destinations when opening a new window', async () => {
  let destination,promise;
  const handlers=setup({matchAll:async()=>[],openWindow:async url=>{destination=url;}});
  handlers.notificationclick({notification:{data:{url:'https://external.example/'},close(){}},waitUntil:value=>{promise=value;}});
  await promise;assert.equal(destination,'https://sunpath.local');
});
