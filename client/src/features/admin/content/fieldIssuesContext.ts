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

/**
 * Id DOM cho dòng lỗi thứ `index` của một trường. Có chỉ số nên vẫn duy nhất
 * khi một trường mang nhiều lỗi cùng lúc, và `aria-describedby` của ô trỏ được
 * tới tất cả các dòng lỗi đó.
 */
export function fieldErrorId(field: string, index: number) {
  return `${fieldAnchorId(field)}-error-${index}`;
}

/** Mọi lỗi khớp đúng một ô theo `name` (so khớp chính xác sau khi bỏ tiền tố). */
export function useFieldIssues(name: string) {
  return useContext(FieldIssuesContext).filter(
    (issue) => issueFieldName(issue.field) === name,
  );
}

/**
 * Thuộc tính khả truy cập dùng chung cho mọi ô (hoặc nhóm ô) được validate:
 * `id` neo ổn định, cờ `aria-invalid` khi có lỗi, và `aria-describedby` ghép ghi
 * chú nguồn với *tất cả* dòng lỗi của trường. Dùng cho text/number lẫn
 * select/checkbox để link tóm tắt lỗi luôn có đích hợp lệ và trình đọc màn hình
 * đọc đủ lỗi.
 */
export function useFieldErrorA11y(name: string, noteId?: string) {
  const issues = useFieldIssues(name);
  const describedBy =
    [noteId, ...issues.map((_, index) => fieldErrorId(name, index))]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    id: fieldAnchorId(name),
    "aria-invalid": issues.length ? true : undefined,
    "aria-describedby": describedBy,
  };
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
