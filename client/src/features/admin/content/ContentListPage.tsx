import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api.js";
import { contentApi } from "./content.api.js";
import {
  type ContentKind,
  paths,
  titles,
  categories,
} from "./content.types.js";
import { TextField } from "./FormFields.js";
const states = {
  published: "Đã xuất bản",
  draft: "Có thay đổi nháp",
  new: "Nháp mới",
  withdrawn: "Đã ẩn",
  discarded: "Nháp đã bỏ",
};
export function ContentListPage({ kind }: { kind: ContentKind }) {
  return <ContentList key={kind} kind={kind} />;
}
function ContentList({ kind }: { kind: ContentKind }) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["cms-list", kind, search, state, group, page],
    queryFn: () =>
      contentApi.list(kind, {
        search,
        state,
        [kind === "lesson" ? "stageId" : "category"]: group,
        page,
        pageSize: 20,
      }),
  });
  const stages = useQuery<{ _id: string; title: string; order: number }[]>({
    queryKey: ["cms-stages"],
    enabled: kind === "lesson",
    queryFn: async () => (await api.get("/stages")).data.data,
  });
  return (
    <div className="cms">
      <h1>{titles[kind]}</h1>
      <p>
        Nội dung nháp chỉ dành cho admin. Lưu nháp không thay đổi nội dung của
        bé.
      </p>
      {kind !== "lesson" && (
        <Link className="cms-link" to={`${paths[kind]}/moi`}>
          Tạo nháp mới
        </Link>
      )}
      <div className="cms-row">
        <TextField
          label="Tìm nội dung"
          name="search"
          value={search}
          onChange={(text) => {
            setSearch(text.slice(0, 50));
            setPage(1);
          }}
        />
        <label className="cms-field">
          <span>Trạng thái</span>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(states).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {kind !== "story" && (
          <label className="cms-field">
            <span>{kind === "lesson" ? "Chặng" : "Chủ đề"}</span>
            <select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {kind === "lesson"
                ? (stages.data ?? []).map((stage) => (
                    <option key={stage._id} value={stage._id}>
                      {stage.title}
                    </option>
                  ))
                : Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
            </select>
          </label>
        )}
      </div>
      {query.isPending ? (
        <p role="status">Đang tải nội dung…</p>
      ) : query.isError ? (
        <div role="alert">
          Không tải được danh sách.{" "}
          <button onClick={() => void query.refetch()}>Thử lại</button>
        </div>
      ) : (
        <>
          {query.data.items.length === 0 ? (
            <p>Chưa có nội dung phù hợp.</p>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th>Phiên bản</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.contentId}>
                      <td>{item.title || "(Chưa đặt tên)"}</td>
                      <td>
                        {states[item.state]}
                        {item.state === "withdrawn" &&
                          item.hasDraft &&
                          " · Có nháp"}
                      </td>
                      <td>
                        Live {item.contentVersion ?? "—"} / Nháp{" "}
                        {item.draftVersion ?? "—"}
                      </td>
                      <td>
                        <Link
                          className="cms-link"
                          to={`${paths[kind]}/${item.contentId}`}
                        >
                          Biên tập
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="cms-actions">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Trang trước
            </button>
            <span>
              Trang {page} · {query.data.total} nội dung
            </span>
            <button
              disabled={page * query.data.pageSize >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}
