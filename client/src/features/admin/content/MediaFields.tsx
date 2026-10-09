import React, { useState } from "react";
import { TextField } from "./FormFields.js";
function allowedMediaUrl(value: string) {
  if (!value) return true;
  if (
    [...value].some(
      (char) =>
        char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\",
    )
  )
    return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function MediaAsset({
  url,
  audio = false,
}: {
  url: string;
  audio?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url) return audio ? <p>Chưa có audio — dùng bản đọc.</p> : null;
  if (!allowedMediaUrl(url))
    return (
      <p role="alert">URL không hợp lệ: dùng HTTPS hoặc đường dẫn /asset.</p>
    );
  if (failedUrl === url)
    return (
      <p role="alert">
        Không tải được {audio ? "audio" : "ảnh"}. Kiểm tra quyền truy cập tệp.
        <button type="button" onClick={() => setFailedUrl(null)}>
          Thử tải media lại
        </button>
      </p>
    );
  return audio ? (
    <audio
      key={url}
      aria-label="Nghe thử audio"
      src={url}
      controls
      preload="none"
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <img
      key={url}
      src={url}
      alt="Ảnh nội dung"
      onError={() => setFailedUrl(url)}
    />
  );
}
export function MediaFields({
  value,
  onChange,
  prefix = "",
}: {
  value: { audioUrl?: string; imageUrl?: string };
  onChange: (patch: { audioUrl?: string; imageUrl?: string }) => void;
  prefix?: string;
}) {
  return (
    <div>
      <TextField
        label={`URL audio${prefix ? ` ${prefix}` : ""}`}
        name={`${prefix}audioUrl`}
        value={value.audioUrl ?? ""}
        onChange={(audioUrl) => onChange({ audioUrl })}
      />
      <MediaAsset audio url={value.audioUrl ?? ""} />
      {"imageUrl" in value && (
        <>
          <TextField
            label={`URL ảnh${prefix ? ` ${prefix}` : ""}`}
            name={`${prefix}imageUrl`}
            value={value.imageUrl ?? ""}
            onChange={(imageUrl) => onChange({ imageUrl })}
          />
          <MediaAsset url={value.imageUrl ?? ""} />
        </>
      )}
    </div>
  );
}
