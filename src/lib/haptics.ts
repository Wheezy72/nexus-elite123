// Haptic feedback utility — uses Vibration API on supported devices
export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [15, 50, 30],
    error: [50, 30, 50, 30, 50],
  };
  
  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // silently fail
  }
}
