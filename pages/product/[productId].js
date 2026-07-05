import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!productId) return;
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_NETWORK !== "mainnet",
      });
    }
  }, []);

  async function loadProduct() {
    setLoading(true);

    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (data.success) {
        const item = data.data.products.find(
          (p) => String(p.productId) === String(productId)
        );

        setProduct(item || null);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  async function handleBuy() {
    if (!product) return;

    if (!window.Pi) {
      alert("Pi SDK is not loaded.");
      return;
    }

    setBuying(true);

    try {
      const create = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.productId,
          productName: product.name,
          amount: Number(product.price),
          buyerUid: "demo-user",
          buyerUsername: "demo-user",
        }),
      });

      const payment = await create.json();

      if (!payment.success) {
        alert(payment.error || "Payment creation failed");
        setBuying(false);
        return;
      }

      await window.Pi.createPayment(
        {
          amount: Number(product.price),
          memo: `Order ${payment.data.orderId}`,
          metadata: {
            orderId: payment.data.orderId,
            productId: product.productId,
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await fetch("/api/pi/approve-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentId }),

                if (loading) {
    return (
      <div
        style={{
          padding: 50,
          textAlign: "center",
          fontSize: 22,
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
          padding: 50,
          textAlign: "center",
        }}
      >
        <h2>Product not found</h2>

        <Link href="/">← Back to Store</Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </Head>

      <div
        style={{
          maxWidth: 1100,
          margin: "40px auto",
          padding: 20,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#0984e3",
            fontWeight: "bold",
          }}
        >
          ← Back to Store
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            marginTop: 30,
          }}
        >
          <div>
            <img
              src={
                product.images?.length
                  ? product.images[0]
                  : "/no-image.png"
              }
              alt={product.name}
              style={{
                width: "100%",
                borderRadius: 12,
                objectFit: "cover",
              }}
            />
          </div>

          <div>
            <h1>{product.name}</h1>

            <p
              style={{
                fontSize: 18,
                color: "#555",
                lineHeight: 1.7,
              }}
            >
              {product.description}
            </p>

            <h2
              style={{
                color: "#00b894",
                marginTop: 20,
              }}
            >
              {product.price} PI
            </h2>

            <p>
              <b>Category:</b> {product.category}
            </p>

            <p>
              <b>Available:</b> {product.stock}
            </p>

            <button
              onClick={handleBuy}
              disabled={buying}
              style={{
                marginTop: 30,
                padding: "15px 30px",
                background: "#6c5ce7",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                opacity: buying ? 0.7 : 1,
              }}
            >
              {buying ? "Processing..." : "Buy with Pi"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
