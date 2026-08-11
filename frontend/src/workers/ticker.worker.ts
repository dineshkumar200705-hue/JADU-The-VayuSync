// Runs in a dedicated worker thread — not throttled by Chrome's background-tab timer policy.
// Posts a 'tick' message at ~20 fps so the main thread can run MediaPipe inference
// even when the browser window is not focused.
self.setInterval(() => {
  (self as DedicatedWorkerGlobalScope).postMessage('tick');
}, 50);
