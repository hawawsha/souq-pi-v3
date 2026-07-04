import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        Product not found
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
        }}
      >
        <div>
          {product.images?.length > 0 && (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: "100%",
                borderRadius: 12,
                objectFit: "cover",
              }}
            />
          )}
        </div>

        <div>
          <h1>{product.name}</h1>

          <p
            style={{
              marginTop: 20,
              lineHeight: 1.8,
            }}
          >
            {product.description}
          </p>

          <h2
            style={{
              color: "#00b894",
              marginTop: 25,
            }}
          >
            {product.price} PI
          </h2>

          <p>
            <b>Category:</b> {product.category}
          </p>

          <p>
            <b>Stock:</b> {product.stock}
          </p>

          <p>
            <b>Seller:</b>{" "}
            {product.seller?.username || "Souq Pi"}
          </p>

          <button
            style={{
              marginTop: 30,
              width: "100%",
              padding: 16,
              background: "#6c5ce7",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
