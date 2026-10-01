import test from 'node:test';
import assert from 'node:assert/strict';
import { enableBrowserNotifications, showBrowserNotification } from '../lib/browser-notifications.ts';
const item = {id:7,title:'مأموریت جدید',message:'تهران',missionId:3};

test('mobile notification uses the service worker and preserves click destination', async () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let shown;
  globalThis.window = {isSecureContext:true, Notification:{}};
  globalThis.Notification = {permission:'granted'};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{getRegistration:async()=>({showNotification:async(title,options)=>{shown={title,options};}})}}});
  try {
    await showBrowserNotification(item, '/driver/dispatch');
    assert.equal(shown.title,item.title); assert.equal(shown.options.body,item.message);
    assert.equal(shown.options.data.url, '/driver/dispatch'); assert.equal(shown.options.tag, 'sunpath-7');
  } finally { delete globalThis.window; delete globalThis.Notification; if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator);else delete globalThis.navigator; }
});
test('HTTP never requests browser notification permissions or attempts native delivery', async () => {
  let requested=false;
  globalThis.window = {isSecureContext:false,Notification:{}};
  globalThis.Notification = {permission:'granted',requestPermission:()=>{requested=true;}};
  try { assert.equal(await enableBrowserNotifications(),false);await showBrowserNotification(item,'/vehicles');assert.equal(requested,false); }
  finally {delete globalThis.window;delete globalThis.Notification;}
});
test('denied notification permission leaves system delivery disabled', async () => {
  globalThis.window = {isSecureContext:true,Notification:{}};
  globalThis.Notification = {permission:'denied',requestPermission:async()=>'denied'};
  try { assert.equal(await enableBrowserNotifications(),false);await showBrowserNotification(item,'/vehicles'); }
  finally {delete globalThis.window;delete globalThis.Notification;}
});
