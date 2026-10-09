import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contentApi, contentFailure } from "./content.api.js";
import {
  type ContentDetail,
  type ContentKind,
  type DraftView,
  type FieldIssue,
  type LessonContent,
  type StoryContent,
  type CultureContent,
  type Payload,
  paths,
  titles,
} from "./content.types.js";
import { TextField } from "./FormFields.js";
import { LessonEditor } from "./LessonEditor.js";
import { StoryEditor } from "./StoryEditor.js";
import { CultureEditor } from "./CultureEditor.js";
import { useUnsavedChanges } from "./useUnsavedChanges.js";

export function ContentEditorPage({ kind }: { kind: ContentKind }) {
  const { id = "" } = useParams();
  return <LoadEditor key={`${kind}:${id}`} kind={kind} id={id} />;
}
function LoadEditor({ kind, id }: { kind: ContentKind; id: string }) {
  const query = useQuery({
    queryKey: ["cms-detail", kind, id],
    queryFn: () => contentApi.get(kind, id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  if (query.isPending)
    return (
      <div className="cms" role="status">
        Đang tải nội dung…
      </div>
    );
  if (query.isError)
    return (
      <div className="cms" role="alert">
        Không tải được nội dung.{" "}
        <button onClick={() => void query.refetch()}>Thử lại</button>
      </div>
    );
  return <Editor kind={kind} id={id} initial={query.data} />;
}
function Editor({
  kind,
  id,
  initial,
}: {
  kind: ContentKind;
  id: string;
  initial: ContentDetail;
}) {
  const [detail, setDetail] = useState(initial);
  const [loaded, setLoaded] = useState(initial.draft);
  const [value, setValue] = useState<Payload | null>(
    initial.draft?.state === "editing" ? initial.draft.payload : null,
  );
  const [busy, setBusy] = useState(false);
  const [allowTyping, setAllowTyping] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [conflict, setConflict] = useState(false);
  const [serverView, setServerView] = useState<ContentDetail | null>(null);
  const [confirmation, setConfirmation] = useState<
    "publish" | "discard" | "reload" | "visibility" | null
  >(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const form = useRef<HTMLFieldSetElement>(null);
  const editing = loaded?.state === "editing";
  const dirty = Boolean(
    editing &&
    value &&
    JSON.stringify(value) !== JSON.stringify(loaded?.payload),
  );
  const blocker = useUnsavedChanges(dirty || busy);
  useEffect(() => {
    if (!busy && issues.length) {
      const name = issues[0].field.replace(/^payload\./, "");
      const fields = Array.from(
        form.current?.querySelectorAll<HTMLElement>("[name]") ?? [],
      );
      (
        fields.find((field) => field.getAttribute("name") === name) ??
        fields.find((field) => field.getAttribute("name")?.startsWith(name))
      )?.focus();
    }
  }, [busy, issues]);
  const reportIssues = setIssues;
  async function run(action: () => Promise<void>, editable = false) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setAllowTyping(editable);
    setMessage("");
    setIssues([]);
    try {
      await action();
    } catch (error) {
      const failure = contentFailure(error);
      setMessage(failure.message);
      setConflict(failure.conflict);
      reportIssues(failure.issues);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function adopt(draft: DraftView) {
    setLoaded(draft);
    setValue(draft.state === "editing" ? draft.payload : null);
    setDetail((old) => ({ ...old, draft }));
    setConflict(false);
    setServerView(null);
  }
  async function reload() {
    const next = await contentApi.get(kind, id);
    setDetail(next);
    setLoaded(next.draft);
    setValue(next.draft?.state === "editing" ? next.draft.payload : null);
    setConflict(false);
    setServerView(null);
  }
  async function invalidate() {
    await client.invalidateQueries({ queryKey: ["cms-list"] });
  }
  async function save() {
    if (!loaded || !value) return;
    const submitted = structuredClone(value);
    const version = loaded.draftVersion;
    const next = await contentApi.save(kind, id, submitted, version);
    setLoaded(next);
    setDetail((old) => ({ ...old, draft: next }));
    // Nested lesson controls are locked during save, so only metadata can change in flight.
    setValue((current) =>
      JSON.stringify(current) === JSON.stringify(submitted)
        ? next.payload
        : kind === "lesson" && current
          ? {
              ...current,
              activities: (next.payload as LessonContent).activities,
            }
          : current,
    );
    setMessage("Đã lưu nháp. Chưa xuất bản.");
    await invalidate();
  }
  async function validate(publish = false) {
    if (!loaded) return;
    const result = await contentApi.validate(kind, id, loaded.draftVersion);
    reportIssues(result.issues);
    if (!result.issues.length) {
      setMessage("Bản đã lưu đủ điều kiện kiểm tra nội dung.");
      if (publish) setConfirmation("publish");
    }
  }
  async function confirm() {
    const choice = confirmation;
    setConfirmation(null);
    if (choice === "reload") await reload();
    if (choice === "discard" && loaded) {
      adopt(await contentApi.discard(kind, id, loaded.draftVersion));
      setMessage("Đã bỏ nháp; nội dung đang phát hành không đổi.");
    }
    if (choice === "publish" && loaded) {
      const receipt = await contentApi.publish(
        kind,
        id,
        loaded.draftVersion,
        loaded.baseContentVersion,
      );
      await reload();
      setMessage(`Đã xuất bản phiên bản ${receipt.contentVersion}.`);
    }
    if (choice === "visibility" && detail.live) {
      await contentApi.setVisibility(
        kind,
        id,
        detail.live.visibility === "withdrawn" ? "published" : "withdrawn",
        detail.live.contentVersion,
      );
      await reload();
      setMessage("Đã cập nhật trạng thái hiển thị.");
    }
    await invalidate();
  }
  const source = loaded?.source;
  return (
    <div className="cms">
      <Link className="cms-link" to={paths[kind]}>
        Về danh sách
      </Link>
      <h1>Biên tập {titles[kind].toLocaleLowerCase("vi")}</h1>
      <p>
        Live: {detail.live?.contentVersion ?? "chưa có"} · Nháp:{" "}
        {loaded?.draftVersion ?? "chưa có"} {dirty && "· Chưa lưu"}
      </p>
      {loaded && (
        <p>
          Sửa bởi {loaded.updatedBy} ·{" "}
          {new Date(loaded.updatedAt).toLocaleString("vi-VN")}
        </p>
      )}
      {source && (
        <aside>
          <h2>Nguồn khách hàng</h2>
          <a
            href={`${source.documentUrl.split("?")[0]}?tab=${encodeURIComponent(source.tabId)}`}
            target="_blank"
            rel="noreferrer"
          >
            {source.heading}
          </a>
          <p>
            Đối soát {source.capturedAt} · SHA-256 {source.checksum}
          </p>
        </aside>
      )}
      {!!loaded?.editorialNotes.length && (
        <aside>
          <h2>Ghi chú biên tập — cần đối chiếu trước xuất bản</h2>
          {loaded.editorialNotes.map((note, i) => (
            <p key={i}>
              <strong>{note.field}</strong> ({note.reason}): {note.message}
            </p>
          ))}
        </aside>
      )}
      {message && (
        <p role={conflict || issues.length ? "alert" : "status"}>{message}</p>
      )}
      {!!issues.length && (
        <div role="alert">
          <h2>{issues.length} lỗi cần sửa</h2>
          {issues.map((issue, i) => (
            <p key={i}>
              {issue.field}: {issue.message}
            </p>
          ))}
        </div>
      )}
      {conflict && (
        <div className="cms-actions">
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setServerView(await contentApi.get(kind, id));
              })
            }
          >
            Xem bản server
          </button>
          <button disabled={busy} onClick={() => setConfirmation("reload")}>
            Tải lại bản server
          </button>
        </div>
      )}
      {serverView && (
        <section>
          <h2>Bản server (chưa thay form)</h2>
          <p>
            {serverView.draft?.payload.title ?? serverView.live?.payload.title}
          </p>
          <p>
            Nháp {serverView.draft?.draftVersion ?? "—"} · Live{" "}
            {serverView.live?.contentVersion ?? "—"}
          </p>
        </section>
      )}
      {editing && value ? (
        <>
          <fieldset
            ref={form}
            disabled={Boolean(confirmation) || (busy && !allowTyping)}
          >
            <legend>Nội dung nháp</legend>
            <TextField
              label="Tiêu đề"
              name="title"
              value={value.title}
              onChange={(title) => setValue({ ...value, title })}
            />
            {kind === "lesson" && (
              <LessonEditor
                value={value as LessonContent}
                onChange={setValue}
                busy={busy}
              />
            )}
            {kind === "story" && (
              <StoryEditor value={value as StoryContent} onChange={setValue} />
            )}
            {kind === "culture" && (
              <CultureEditor
                value={value as CultureContent}
                onChange={setValue}
              />
            )}
          </fieldset>
          <div className="cms-actions">
            <button
              className="cms-primary"
              disabled={busy || conflict || !dirty}
              onClick={() => void run(save, true)}
            >
              Lưu nháp
            </button>
            <button
              disabled={busy || conflict || dirty}
              onClick={() =>
                navigate(
                  `${paths[kind]}/${id}/xem-truoc?draftVersion=${loaded.draftVersion}`,
                )
              }
            >
              Xem trước
            </button>
            <button
              disabled={busy || conflict || dirty}
              onClick={() => void run(() => validate())}
            >
              Kiểm tra
            </button>
            <button
              disabled={busy || conflict || dirty}
              onClick={() => void run(() => validate(true))}
            >
              Xuất bản
            </button>
            <button disabled={busy} onClick={() => setConfirmation("discard")}>
              Bỏ nháp
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{detail.live?.payload.title ?? loaded?.payload.title}</p>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                adopt(await contentApi.start(kind, id, loaded?.draftVersion));
                await invalidate();
              })
            }
          >
            Bắt đầu biên tập
          </button>
        </>
      )}
      {kind !== "lesson" && detail.live && (
        <button
          disabled={busy || dirty}
          onClick={() => setConfirmation("visibility")}
        >
          {detail.live.visibility === "withdrawn"
            ? "Hiện nội dung"
            : "Ẩn nội dung"}
        </button>
      )}
      {confirmation && (
        <div role="dialog" aria-modal="true" aria-label="Xác nhận thay đổi">
          <h2>Xác nhận thay đổi</h2>
          <p>
            {confirmation === "publish"
              ? `Xuất bản đúng nháp ${loaded?.draftVersion}, dựa trên live ${loaded?.baseContentVersion ?? "mới"}. Nội dung mới sẽ hiển thị với bé; tiến độ và điểm giữ nguyên.`
              : confirmation === "reload"
                ? "Bỏ thay đổi local và tải bản server?"
                : confirmation === "discard"
                  ? "Bỏ thay đổi nháp? Bản đang phát hành và lịch sử không bị xóa."
                  : "Đổi hiển thị nội dung và tăng phiên bản? Nháp hiện có sẽ cần mở lại từ bản mới."}
          </p>
          <div className="cms-actions">
            <button autoFocus onClick={() => setConfirmation(null)}>
              Hủy
            </button>
            <button onClick={() => void run(confirm)}>Xác nhận</button>
          </div>
        </div>
      )}
      {blocker.state === "blocked" && (
        <div role="dialog" aria-modal="true" aria-label="Rời trang chưa lưu?">
          <h2>Rời trang chưa lưu?</h2>
          <p>
            {busy
              ? "Đang gửi yêu cầu. Hãy đợi kết quả để tránh mất trạng thái."
              : "Thay đổi chưa lưu sẽ mất nếu rời trang."}
          </p>
          <div className="cms-actions">
            <button autoFocus onClick={() => blocker.reset()}>
              Ở lại
            </button>
            <button disabled={busy} onClick={() => blocker.proceed()}>
              Rời trang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
