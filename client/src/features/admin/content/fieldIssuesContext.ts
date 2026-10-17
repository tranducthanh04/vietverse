import { createContext, useContext } from "react";
import type { FieldIssue } from "./content.types.js";

/**
 * Danh sách lỗi theo trường của bản nháp đang biên tập, cung cấp xuống cây form
 * để từng ô nhập biết mình có lỗi và nối `aria-describedby`/`aria-invalid` đúng.
 */
export const FieldIssuesContext = createContext<FieldIssue[]>([]);

/** Bỏ tiền tố `payload.` để khớp với thuộc tính `name` của ô nhập trong form. */
export function issueFieldName(field: string) {
  return field.replace(/^payload\./, "");
}

/** Id DOM ổn định cho một ô theo `name`, để link tóm tắt lỗi neo tới đúng ô. */
export function fieldAnchorId(field: string) {
  return `cms-field-${issueFieldName(field).replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

/** Lỗi khớp đúng một ô theo `name` (so khớp chính xác sau khi bỏ tiền tố). */
export function useFieldIssue(name: string) {
  return useContext(FieldIssuesContext).find(
    (issue) => issueFieldName(issue.field) === name,
  );
}

/**
 * Tìm phần tử form ứng với một trường lỗi: ưu tiên khớp `name` chính xác, sau đó
 * đến ô con đầu tiên (lỗi ở nhóm/mảng trỏ về ô đầu của nhóm đó). Dùng chung cho
 * việc tự chuyển focus tới lỗi đầu và cho link neo trong khối tóm tắt lỗi.
 */
export function resolveIssueField(
  root: HTMLElement | null,
  field: string,
): HTMLElement | undefined {
  const name = issueFieldName(field);
  const fields = Array.from(
    root?.querySelectorAll<HTMLElement>("[name]") ?? [],
  );
  return (
    fields.find((element) => element.getAttribute("name") === name) ??
    fields.find((element) => element.getAttribute("name")?.startsWith(name))
  );
}
