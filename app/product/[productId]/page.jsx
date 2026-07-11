"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePiPurchase } from "@/lib/usePiPurchase";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { loadingProductId, message, handleBuy } = usePiPurchase();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setProduct(data.data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.log("Error fetching product:", error.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (productId) fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="sq-page">
        <header className="sq-header">
          <h1 className="sq-wordmark">
            سوق <span className="pi-glyph">π</span>
          </h1>
        </header>
        <p className="sq-loading">جاري تحميل المنتج...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="sq-page">
        <header className="sq-header">
          <h1 className="sq-wordmark">
            سوق <span className="pi-glyph">π</span>
          </h1>
        </header>
        <p className="sq-empty">
          هذا المنتج غير موجود.
          <br />
          <Link href="/store" className="sq-back-link">
            الرجوع للمتجر
          </Link>
        </p>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const isBuying = loadingProductId === product._id;

  return (
    <div className="sq-page">
      <header className="sq-header sq-header-detail">
        <Link href="/store" className="sq-back-link">
          ← الرجوع للمتجر
        </Link>
        <h1 className="sq-wordmark sq-wordmark-sm">
          سوق <span className="pi-glyph">π</span>
        </h1>
      </header>

      <div className="sq-detail">
        <div className="sq-detail-media">
          {images.length > 0 ? (
            <img src={images[activeImage]} alt={product.name} />
          ) : (
            <div className="sq-media-fallback sq-media-fallback-lg">π</div>
          )}
          <div className="sq-coin sq-coin-lg">
            <span className="sq-coin-symbol">π</span>
            <span className="sq-coin-amount">{product.price}</span>
          </div>
        </div>

        {images.length > 1 && (
          <div className="sq-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                className={"sq-thumb" + (i === activeImage ? " is-active" : "")}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt={`${product.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}

        <div className="sq-detail-body">
          {product.category && <span className="sq-card-category">{product.category}</span>}
          <h2 className="sq-detail-name">{product.name}</h2>

          {product.description && <p className="sq-detail-desc">{product.description}</p>}

          <div className="sq-detail-meta">
            {typeof product.stock === "number" && (
              <span className="sq-meta-chip">
                {product.stock > 0 ? `متوفر (${product.stock})` : "غير متوفر حالياً"}
              </span>
            )}
            {product.seller?.username && (
              <span className="sq-meta-chip">البائع: {product.seller.username}</span>
            )}
            {product.ratings?.count > 0 && (
              <span className="sq-meta-chip">
                ⭐ {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            )}
          </div>

          <button
            className="sq-buy-btn sq-buy-btn-lg"
            onClick={() => handleBuy(product)}
            disabled={isBuying || product.stock === 0}
          >
            {isBuying
              ? "جاري المعالجة..."
              : product.stock === 0
              ? "غير متوفر"
              : "شراء الآن"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={
            "sq-message " +
            (message.includes("✅") || message.includes("نجاح")
              ? "is-success"
              : message.includes("خطأ") || message.includes("فشل")
              ? "is-error"
              : "is-neutral")
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
