import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { contentApi } from "./content.api.js";
import {
  type ContentKind,
  type LessonContent,
  type StoryContent,
  type CultureContent,
  paths,
} from "./content.types.js";
import { LessonPreview } from "./LessonPreview.js";
import { StoryPreview } from "./StoryPreview.js";
import { CulturePreview } from "./CulturePreview.js";
export function ContentPreviewPage({ kind }: { kind: ContentKind }) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const version = Number(params.get("draftVersion"));
  const valid = Number.isInteger(version) && version > 0;
  const query = useQuery({
    queryKey: ["cms-preview", kind, id, version],
    queryFn: () => contentApi.preview(kind, id, version),
    enabled: valid,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const view = query.data;
  return (
    <div className="cms">
      <Link className="cms-link" to={`${paths[kind]}/${id}`}>
        Về biên tập
      </Link>
      <h1>Xem trước bản nháp {valid ? version : ""} — chỉ admin</h1>
      <p>Không lưu tiến độ, không cộng điểm, không ghi âm.</p>
      {!valid ? (
        <p role="alert">
          Thiếu phiên bản nháp hợp lệ. Mở từ editor sau khi lưu.
        </p>
      ) : query.isPending ? (
        <p role="status">Đang tải bản xem trước…</p>
      ) : query.isError ? (
        <div role="alert">
          Bản nháp không còn đúng phiên bản hoặc không tải được. Quay lại editor
          để đối chiếu.
          <button onClick={() => void query.refetch()}>Thử lại</button>
        </div>
      ) : (
        view && (
          <>
            <aside>
              {view.source && (
                <p>
                  Nguồn: {view.source.heading} · {view.source.capturedAt}
                </p>
              )}
              {view.editorialNotes.map((note, i) => (
                <p key={i}>
                  {note.field}: {note.message}
                </p>
              ))}
            </aside>
            {view.issues.length > 0 && (
              <div role="alert">
                Nháp chưa đủ điều kiện xuất bản.
                {view.issues.map((issue, i) => (
                  <p key={i}>
                    {issue.field}: {issue.message}
                  </p>
                ))}
              </div>
            )}
            <div key={`${kind}:${id}:${version}`}>
              {kind === "lesson" ? (
                <LessonPreview
                  payload={view.payload as LessonContent}
                  issues={view.issues}
                />
              ) : kind === "story" ? (
                <StoryPreview payload={view.payload as StoryContent} />
              ) : (
                <CulturePreview payload={view.payload as CultureContent} />
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
