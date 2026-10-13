import "@testing-library/jest-dom";

// JSDOM has no top-layer dialog API. Test component state here; browser QA
// verifies native modality/inert background using Chrome's actual implementation.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}

// React Router data routers build a `Request` with JSDOM's AbortSignal, which
// Node's native (undici) Request rejects ("Expected signal to be an instance of
// AbortSignal"). Drop a foreign signal so navigations work under JSDOM.
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal) {
      try {
        super(input, init);
        return;
      } catch {
        const { signal: _signal, ...rest } = init;
        super(input, rest);
        return;
      }
    }
    super(input, init);
  }
} as typeof Request;
