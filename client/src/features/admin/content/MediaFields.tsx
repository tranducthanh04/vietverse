import React, { useState } from "react";
import { TextField } from "./FormFields.js";
import { CoverImageUpload, type CoverUploadContext } from './CoverImageUpload.js';
import { ContentAudioUpload } from './ContentAudioUpload.js';
import { resolveMediaUrl } from '../../../lib/mediaUrl.js';
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
  // Stored URLs are app-relative ("/api/..."); rebase onto the API origin for the preview element
  // so "nghe thử" works even when the admin app and API are on different domains.
  const src = resolveMediaUrl(url);
  return audio ? (
    <audio
      key={src}
      aria-label="Nghe thử audio"
      src={src}
      controls
      preload="none"
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <img
      key={src}
      className="cms-media-img"
      src={src}
      alt="Ảnh nội dung"
      onError={() => setFailedUrl(url)}
    />
  );
}
export function MediaFields({
  value,
  onChange,
  prefix = "",
  imageName = `${prefix}imageUrl`,
  uploadContext,
  onUploadBusy,
  uploadDisabled,
}: {
  value: { audioUrl?: string; imageUrl?: string };
  onChange: (patch: { audioUrl?: string; imageUrl?: string }) => void;
  prefix?: string;
  imageName?: string;
  uploadContext?: CoverUploadContext;
  onUploadBusy?: (busy: boolean) => void;
  uploadDisabled?: boolean;
}) {
  return (
    <div>
      <TextField
        label={`URL audio${prefix ? ` ${prefix}` : ""}`}
        name={`${prefix}audioUrl`}
        value={value.audioUrl ?? ""}
        onChange={(audioUrl) => onChange({ audioUrl })}
      />
      <ContentAudioUpload
        disabled={uploadDisabled}
        onBusyChange={onUploadBusy}
        onUploaded={(audioUrl) => onChange({ audioUrl })}
      />
      <MediaAsset audio url={value.audioUrl ?? ""} />
      {"imageUrl" in value && (
        <>
          {uploadContext && onUploadBusy && <CoverImageUpload key={`${uploadContext.kind}:${uploadContext.contentId}:${uploadContext.draftVersion}`} context={uploadContext} disabled={uploadDisabled} onBusyChange={onUploadBusy} onUploaded={imageUrl => onChange({ imageUrl })} />}
          <TextField
            label={`URL ảnh${prefix ? ` ${prefix}` : ""}`}
            name={imageName}
            value={value.imageUrl ?? ""}
            onChange={(imageUrl) => onChange({ imageUrl })}
          />
          <MediaAsset url={value.imageUrl ?? ""} />
        </>
      )}
    </div>
  );
}
