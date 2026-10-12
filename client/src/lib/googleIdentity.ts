interface GoogleIdentity {
  initialize(options: { client_id: string; nonce: string; auto_select: false; callback: (response: { credential: string }) => void }): void;
  renderButton(element: HTMLElement, options: { theme: string; size: string; width: number; text: string; locale: string }): void;
  cancel?(): void;
}

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_LOAD_TIMEOUT = 10_000;
const GOOGLE_LOAD_ERROR = 'Không tải được Google. Kiểm tra kết nối hoặc trình chặn nội dung rồi thử lại.';

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

let pending: Promise<GoogleIdentity> | undefined;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (pending) return pending;
  pending = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timeout); script.remove(); pending = undefined;
      reject(new Error(GOOGLE_LOAD_ERROR));
    };
    const timeout = window.setTimeout(fail, GOOGLE_LOAD_TIMEOUT);
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (!window.google?.accounts.id) { fail(); return; }
      clearTimeout(timeout); resolve(window.google.accounts.id);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return pending;
}
