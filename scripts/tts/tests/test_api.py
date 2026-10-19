"""Test client API: chính sách retry (I-3) và việc lấy id admin khi đăng nhập (phục vụ I-2).

Chỉ GET và publish được tự retry; start_draft/save_draft không retry để tránh conflict giả do
gửi lại thao tác ghi không idempotent khi mạng chập chờn.
"""
import pytest
import requests

from ttslib.api import ApiError, VietverseClient


class FakeResp:
    def __init__(self, status, body=None, text="", reason="reason"):
        self.status_code = status
        self._body = body
        self.text = text
        self.reason = reason

    @property
    def ok(self):
        return self.status_code < 400

    def json(self):
        if self._body is None:
            raise ValueError("không phải JSON")
        return self._body


class FakeSession:
    """Trả lần lượt các mục trong `responses`; mục là FakeResp hoặc Exception để ném."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url))
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def _client(responses, **kwargs):
    return VietverseClient("http://api", backoff=0, session=FakeSession(responses), **kwargs)


def ok_body(data):
    return {"success": True, "data": data}


def test_get_retries_on_5xx_then_succeeds():
    sess = FakeSession([FakeResp(500, text="tạm lỗi"), FakeResp(200, ok_body({"live": {}, "draft": None}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    data = client.get_content("lesson", "L1")
    assert len(sess.calls) == 2  # có retry
    assert data == {"live": {}, "draft": None}


def test_get_network_error_retries_to_limit_then_raises():
    sess = FakeSession([requests.ConnectionError("1"), requests.ConnectionError("2"), requests.ConnectionError("3")])
    client = VietverseClient("http://api", backoff=0, max_retries=3, session=sess)
    with pytest.raises(ApiError) as ei:
        client.get_content("lesson", "L1")
    assert len(sess.calls) == 3
    assert ei.value.code == "NETWORK_ERROR"


def test_save_draft_does_not_retry_on_5xx():
    sess = FakeSession([FakeResp(500, text="boom"), FakeResp(200, ok_body({"draftVersion": 3}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    with pytest.raises(ApiError) as ei:
        client.save_draft("lesson", "L1", {"a": 1}, 2)
    assert len(sess.calls) == 1  # KHÔNG retry: lỗi nổi lên ngay
    assert ei.value.status == 500


def test_save_draft_does_not_retry_on_network_error():
    sess = FakeSession([requests.ConnectionError("down"), FakeResp(200, ok_body({"draftVersion": 3}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    with pytest.raises(ApiError) as ei:
        client.save_draft("lesson", "L1", {"a": 1}, 2)
    assert len(sess.calls) == 1
    assert ei.value.code == "NETWORK_ERROR"


def test_start_draft_does_not_retry_on_5xx():
    sess = FakeSession([FakeResp(503, text="x"), FakeResp(200, ok_body({"draftVersion": 1}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    with pytest.raises(ApiError):
        client.start_draft("lesson", "L1")
    assert len(sess.calls) == 1


def test_publish_retries_on_5xx_then_succeeds():
    sess = FakeSession([FakeResp(503, text="x"), FakeResp(200, ok_body({"contentId": "L1", "contentVersion": 3}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    receipt = client.publish("lesson", "L1", 2, 1)
    assert len(sess.calls) == 2  # publish idempotent nhờ receipt -> được retry
    assert receipt["contentVersion"] == 3


def test_login_captures_user_id():
    sess = FakeSession([FakeResp(200, ok_body({"accessToken": "tok", "user": {"id": "u123", "email": "a@b"}}))])
    client = VietverseClient("http://api", backoff=0, session=sess)
    token = client.login("a@b", "pw")
    assert token == "tok"
    assert client.user_id == "u123"
