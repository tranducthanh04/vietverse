"""Client gọi API Vietverse cho script TTS (đăng nhập admin, đọc/ghi nội dung, upload audio).

Theo "Hợp đồng chung" của plan và các route thật trong server:
- Đăng nhập: POST /api/v1/auth/login  -> { data: { accessToken, user } }
- Liệt kê nội dung: GET  /api/v1/admin/content/:kind            (kind: lessons|stories|culture)
- Lấy live+draft:   GET  /api/v1/admin/content/:kind/:id        -> { live, draft }
- Mở nháp:          POST /api/v1/admin/content/:kind/:id/draft  { expectedDraftVersion? }
- Lưu nháp:         PUT  /api/v1/admin/content/:kind/:id/draft  { payload, expectedDraftVersion }
- Xuất bản:         POST /api/v1/admin/content/:kind/:id/publish { expectedDraftVersion, baseContentVersion }
- Upload audio:     POST /api/v1/admin/content/audio  (multipart 'audio') -> { url }

Tài khoản admin lấy từ biến môi trường, KHÔNG bao giờ ghi ra file hay log.
"""
from __future__ import annotations

import time
from pathlib import Path
from typing import Any

import requests

# Map kind nội bộ (của payload) -> đoạn đường dẫn kind trên URL.
KIND_TO_SEGMENT = {"lesson": "lessons", "story": "stories", "culture": "culture"}


class ApiError(RuntimeError):
    """Lỗi HTTP có mã trạng thái và mã lỗi nghiệp vụ (nếu có)."""

    def __init__(self, status: int, code: str | None, message: str):
        super().__init__(f"HTTP {status} {code or ''}: {message}".strip())
        self.status = status
        self.code = code
        self.message = message


class VietverseClient:
    def __init__(
        self,
        base_url: str,
        *,
        timeout: float = 30.0,
        max_retries: int = 3,
        backoff: float = 1.0,
        session: requests.Session | None = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff = backoff
        self._session = session or requests.Session()
        self._token: str | None = None
        self._user_id: str | None = None

    @property
    def user_id(self) -> str | None:
        """ID admin đang đăng nhập (lấy từ login). Dùng để xác nhận nháp là của script (I-2)."""
        return self._user_id

    # ---- hạ tầng ----
    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    def _request(self, method: str, path: str, *, retriable: bool | None = None, **kwargs: Any) -> Any:
        """Gọi API; chỉ tự retry khi `retriable` (mặc định: chỉ GET).

        Ghi không idempotent (start_draft/save_draft/discard_draft) KHÔNG tự retry: một cú rớt
        mạng sau khi server đã xử lý rồi retry lại sẽ đụng version đã tăng -> conflict giả (I-3).
        Lỗi của chúng được để nổi lên và xử lý ở lớp từng-nội-dung của apply. GET an toàn để
        retry; publish được truyền retriable=True vì server chống trùng bằng receipt.
        """
        url = f"{self.base_url}{path}"
        headers = kwargs.pop("headers", {})
        headers = {**self._headers(), **headers}
        if retriable is None:
            retriable = method.upper() == "GET"
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self._session.request(method, url, headers=headers, timeout=self.timeout, **kwargs)
            except requests.RequestException as exc:  # lỗi mạng
                last_error = exc
                if retriable and attempt < self.max_retries:
                    time.sleep(self.backoff * attempt)
                    continue
                raise ApiError(0, "NETWORK_ERROR", str(exc)) from exc

            # 5xx có thể do tạm thời -> chỉ retry khi idempotent; 4xx là lỗi dứt khoát.
            if retriable and resp.status_code >= 500 and attempt < self.max_retries:
                last_error = ApiError(resp.status_code, None, resp.text[:300])
                time.sleep(self.backoff * attempt)
                continue
            return self._parse(resp)
        raise last_error or ApiError(0, "NETWORK_ERROR", "unknown")

    @staticmethod
    def _parse(resp: requests.Response) -> Any:
        try:
            body = resp.json()
        except ValueError:
            if resp.ok:
                return None
            raise ApiError(resp.status_code, None, resp.text[:300])
        if not resp.ok or (isinstance(body, dict) and body.get("success") is False):
            error = body.get("error", {}) if isinstance(body, dict) else {}
            raise ApiError(resp.status_code, error.get("code"), error.get("message", resp.reason))
        return body.get("data") if isinstance(body, dict) else body

    # ---- auth ----
    def login(self, email: str, password: str) -> str:
        data = self._request("POST", "/api/v1/auth/login", json={"email": email, "password": password})
        token = data.get("accessToken") if isinstance(data, dict) else None
        if not token:
            raise ApiError(0, "NO_TOKEN", "Đăng nhập không trả về accessToken")
        self._token = token
        user = data.get("user") if isinstance(data, dict) else None
        user_id = user.get("id") if isinstance(user, dict) else None
        self._user_id = str(user_id) if user_id is not None else None
        return token

    # ---- đọc nội dung ----
    def list_content(self, kind: str, page_size: int = 100) -> list[dict[str, Any]]:
        segment = KIND_TO_SEGMENT[kind]
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            data = self._request(
                "GET", f"/api/v1/admin/content/{segment}",
                params={"page": page, "pageSize": page_size},
            )
            batch = data.get("items", []) if isinstance(data, dict) else []
            items.extend(batch)
            total = data.get("total", len(items)) if isinstance(data, dict) else len(items)
            if len(items) >= total or not batch:
                break
            page += 1
        return items

    def get_content(self, kind: str, content_id: str) -> dict[str, Any]:
        segment = KIND_TO_SEGMENT[kind]
        return self._request("GET", f"/api/v1/admin/content/{segment}/{content_id}")

    # ---- ghi nội dung (draft -> publish) ----
    def start_draft(self, kind: str, content_id: str, expected_draft_version: int | None = None) -> dict[str, Any]:
        segment = KIND_TO_SEGMENT[kind]
        body: dict[str, Any] = {}
        if expected_draft_version is not None:
            body["expectedDraftVersion"] = expected_draft_version
        return self._request("POST", f"/api/v1/admin/content/{segment}/{content_id}/draft", json=body)

    def save_draft(self, kind: str, content_id: str, payload: dict[str, Any], expected_draft_version: int) -> dict[str, Any]:
        segment = KIND_TO_SEGMENT[kind]
        return self._request(
            "PUT", f"/api/v1/admin/content/{segment}/{content_id}/draft",
            json={"payload": payload, "expectedDraftVersion": expected_draft_version},
        )

    def publish(self, kind: str, content_id: str, expected_draft_version: int, base_content_version: int | None) -> dict[str, Any]:
        segment = KIND_TO_SEGMENT[kind]
        # retriable=True: server chống trùng publish bằng receipt nên retry an toàn (I-3).
        return self._request(
            "POST", f"/api/v1/admin/content/{segment}/{content_id}/publish",
            retriable=True,
            json={"expectedDraftVersion": expected_draft_version, "baseContentVersion": base_content_version},
        )

    def discard_draft(self, kind: str, content_id: str, expected_draft_version: int) -> dict[str, Any]:
        segment = KIND_TO_SEGMENT[kind]
        return self._request(
            "POST", f"/api/v1/admin/content/{segment}/{content_id}/discard-draft",
            json={"expectedDraftVersion": expected_draft_version},
        )

    # ---- upload audio nội dung ----
    def upload_audio(self, file_path: str | Path) -> str:
        path = Path(file_path)
        mime = {
            ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
            ".ogg": "audio/ogg", ".wav": "audio/wav",
        }.get(path.suffix.lower(), "application/octet-stream")
        with open(path, "rb") as fh:
            data = self._request(
                "POST", "/api/v1/admin/content/audio",
                files={"audio": (path.name, fh, mime)},
            )
        url = data.get("url") if isinstance(data, dict) else None
        if not url:
            raise ApiError(0, "NO_URL", "Upload audio không trả về url")
        return url
