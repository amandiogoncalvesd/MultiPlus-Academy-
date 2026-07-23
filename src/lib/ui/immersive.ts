/**
 * Browsers only allow fullscreen requests while handling a trusted user gesture.
 * Login submits call this synchronously, before asynchronous authentication.
 */
export function requestImmersiveMode(): void {
  if (typeof document === 'undefined' || document.fullscreenElement) return;
  void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function leaveImmersiveMode(): void {
  if (typeof document === 'undefined' || !document.fullscreenElement) return;
  void document.exitFullscreen?.().catch(() => undefined);
}
