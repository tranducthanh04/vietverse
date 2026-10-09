import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { contentApi, contentFailure } from "./content.api.js";
import { type ContentKind, paths, titles } from "./content.types.js";
import { TextField } from "./FormFields.js";
export function ContentCreatePage({
  kind,
}: {
  kind: Exclude<ContentKind, "lesson">;
}) {
  const [title, setTitle] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  async function create() {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    try {
      const draft = await contentApi.create(kind, { title }, requestId);
      await client.invalidateQueries({ queryKey: ["cms-list", kind] });
      navigate(`${paths[kind]}/${draft.contentId}`, { replace: true });
    } catch (error) {
      setError(contentFailure(error).message);
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="cms">
      <Link className="cms-link" to={paths[kind]}>
        Về danh sách
      </Link>
      <h1>Tạo nháp {titles[kind].toLocaleLowerCase("vi")}</h1>
      <p>Chưa hiển thị với bé. Biên tập chi tiết sau khi tạo.</p>
      <fieldset disabled={busy}>
        <TextField
          label="Tiêu đề mới"
          name="title"
          value={title}
          onChange={setTitle}
        />
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} onClick={() => void create()}>
        Tạo bản nháp
      </button>
    </div>
  );
}
