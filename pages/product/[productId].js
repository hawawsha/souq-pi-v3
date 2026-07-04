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
