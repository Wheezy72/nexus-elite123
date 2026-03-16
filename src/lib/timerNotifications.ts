// Timer notification utilities — browser notifications, tab badge, alert sound

let originalTitle = '';

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function sendTimerNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: 'future-timer',
        requireInteraction: false,
      });
    } catch {
      // Notification API may fail in some contexts
    }
  }
}

export function setTabBadge(show: boolean, label = '⏰') {
  if (!originalTitle) originalTitle = document.title.replace(/^\(.\) /, '');
  document.title = show ? `(1) ${label} — ${originalTitle}` : originalTitle;
}

export function resetTabTitle() {
  if (originalTitle) document.title = originalTitle;
}

// Generate a soft chime using Web Audio API
export function playAlertChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587, ctx.currentTime);     // D5
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.15); // G5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);  // A5
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    
    // Play a second gentle tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1047; // C6
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.35);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.9);
    
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Audio not available
  }
}

// Play a subtle warning tick (for "nearing end")
export function playWarningTick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440; // A4
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 500);
  } catch {}
}
