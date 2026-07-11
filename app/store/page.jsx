"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePiPurchase } from "@/lib/usePiPurchase";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchMessage, setFetchMessage] = useState("");

  const { loadingProductId, message, debugLogs, handleBuy } = usePiPurchase();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        console.log("HTTP Status (fetch products):", res.status);
        const data = await res.json();

        if (res.ok && data.success) {
          setProducts(data.data);
        } else {
          setFetchMessage("لا توجد منتجات بعد");
        }
      } catch (error) {
        console.log("Error fetching products:", error.message);
        setFetchMessage("حدث خطأ أثناء جلب المنتجات");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  const displayMessage = message || fetchMessage;

  return (
    <div className="sq-page">
      <header className="sq-header">
        <h1 className="sq-wordmark">
          سوق <span className="pi-glyph">π</span>
        </h1>
        <p className="sq-tagline">تسوّق وادفع مباشرة بعملة Pi</p>
      </header>

      {loadingProducts && <p className="sq-loading">جاري تحميل المنتجات...</p>}

      {!loadingProducts && products.length === 0 && (
        <p className="sq-empty">لا توجد منتجات بعد.</p>
      )}

      <div className="sq-grid">
        {products.map((product) => {
          const image = product.images?.[0];
          return (
            <div className="sq-card" key={product._id}>
              <Link href={`/product/${product.productId}`} className="sq-card-media-link">
                <div className="sq-card-media">
                  {image ? (
                    <img src={image} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="sq-media-fallback">π</div>
                  )}
                  <div className="sq-coin">
                    <span className="sq-coin-symbol">π</span>
                    <span className="sq-coin-amount">{product.price}</span>
                  </div>
                </div>
              </Link>

              <div className="sq-card-body">
                <Link href={`/product/${product.productId}`} className="sq-card-name-link">
                  <h2 className="sq-card-name">{product.name}</h2>
                </Link>
                {product.category && (
                  <span className="sq-card-category">{product.category}</span>
                )}
                <button
                  className="sq-buy-btn"
                  onClick={() => handleBuy(product)}
                  disabled={loadingProductId === product._id}
                >
                  {loadingProductId === product._id ? "جاري المعالجة..." : "شراء الآن"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {displayMessage && (
        <p
          className={
            "sq-message " +
            (displayMessage.includes("✅") || displayMessage.includes("نجاح")
              ? "is-success"
              : displayMessage.includes("خطأ") || displayMessage.includes("فشل")
              ? "is-error"
              : "is-neutral")
          }
        >
          {displayMessage}
        </p>
      )}

      {debugLogs.length > 0 && (
        <details className="sq-debug">
          <summary>سجل التصحيح (للمطورين)</summary>
          <pre>{debugLogs.join("\n")}</pre>
        </details>
      )}
    </div>
  );
}
