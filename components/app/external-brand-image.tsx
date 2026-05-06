import type { CSSProperties } from "react";

/* eslint-disable @next/next/no-img-element */

type ExternalBrandImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  height?: number;
  width?: number;
  style?: CSSProperties;
};

function isSafeImageUrl(src: string) {
  try {
    const url = new URL(src);

    if (url.protocol !== "https:") {
      return false;
    }

    const blockedHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

    if (blockedHostnames.has(url.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function ExternalBrandImage({
  src,
  alt,
  className,
  loading = "lazy",
  height,
  width,
  style
}: ExternalBrandImageProps) {
  if (!isSafeImageUrl(src)) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      height={height}
      loading={loading}
      style={style}
      width={width}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
