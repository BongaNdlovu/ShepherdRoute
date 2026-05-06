import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/shepherd-logo.svg"
      alt="ShepherdRoute logo"
      width={320}
      height={120}
      priority={priority}
      className={className}
    />
  );
}
