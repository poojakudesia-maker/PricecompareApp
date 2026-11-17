import { useState } from 'react';
import type { ProductSummary } from '../../shared/types.ts';

/** Product photo when the server has one; otherwise (or if it fails to load) an emoji tile. */
export function ProductImage({ product, className }: { product: ProductSummary; className: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`pimg ${className}`} style={{ background: product.tint }}>
      {product.image && !broken ? (
        <img src={product.image} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <span className="pimg__emoji" aria-hidden="true">
          {product.emoji}
        </span>
      )}
    </span>
  );
}
