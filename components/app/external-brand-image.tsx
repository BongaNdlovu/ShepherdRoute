/* eslint-disable @next/next/no-img-element */

type ExternalBrandImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
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
  loading = "lazy"
}: ExternalBrandImageProps) {
  if (!isSafeImageUrl(src)) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
