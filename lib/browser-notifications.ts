import type { MissionNotification } from './notifications';

export async function enableBrowserNotifications(): Promise<boolean> {
  if (!window.isSecureContext || !('Notification' in window)) return false;
  if (await Notification.requestPermission() !== 'granted') return false;
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/notification-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  }
  return true;
}
export async function showBrowserNotification(item: MissionNotification, url: string): Promise<void> {
  if (!window.isSecureContext || !('Notification' in window) || Notification.permission !== 'granted') return;
  const options: NotificationOptions = { body: item.message, tag: `sunpath-${item.id}`, dir: 'rtl', data: { url } };
  // Mobile browsers use persistent notifications instead of the Notification constructor.
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) { await registration.showNotification(item.title, options); return; }
  }
  const notification = new Notification(item.title, options);
  notification.onclick = () => { window.focus(); window.location.assign(url); notification.close(); };
}
