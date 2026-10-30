"use client";
import { useState } from "react";
import type { Product } from "@/domain/types";
import { assetPath } from "@/lib/paths";

export function ProductPhoto({
  product,
  className,
}: {
  product: Product;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className={`${className} image-missing`}>Photo unavailable</span>
    );
  return (
    <img
      className={className}
      src={assetPath(product.image)}
      alt={`${product.brand} ${product.name} can`}
      width={product.imageWidth}
      height={product.imageHeight}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
