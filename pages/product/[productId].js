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

  const [piUser, setPiUser] = useState(null);

  useEffect(() => {
    if (!productId) return;
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initPi = async () => {
      if (!window.Pi) return;

      window.Pi.init({
        version: "2.0",
        sandbox:
          (process.env.NEXT_PUBLIC_PI_NETWORK || "testnet") === "testnet",
      });

      try {
        const auth = await window.Pi.authenticate(
          ["payments"],
          () => {}
        );

        setPiUser(auth);
      } catch (err) {
        console.error(err);
      }
    };

    if (window.Pi) {
      initPi();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = initPi;

    document.body.appendChild(script);
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
      alert("Pi SDK not loaded.");
      return;
    }

    if (!piUser) {
      alert("Please login with Pi first.");
      return;
    }

    setBuying(true);

    try {

      await window.Pi.createPayment(
        {
          amount: Number(product.price),

          memo: `Buy ${product.name}`,

          metadata: {
            productId: product.productId,
            productName: product.name,
          },
        },

        {
          onReadyForServerApproval: async (paymentId) => {

            const response = await fetch("/api/payment", {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                paymentId,

                productId: product.productId,

                productName: product.name,

                amount: Number(product.price),

                buyerUid: piUser.user.uid,

                buyerUsername: piUser.user.username,

                accessToken: piUser.accessToken,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              alert(result.error || "Server error");
              return;
            }

            await fetch("/api/pi/approve-payment", {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                paymentId,
              }),
            });
          },
                    onReadyForServerCompletion: async (paymentId, txid) => {

            const complete = await fetch("/api/pi/complete-payment", {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                paymentId,
                txid,
              }),
            });

            const result = await complete.json();

            if (result.success) {
              alert("✅ Payment completed successfully.");
            } else {
              alert(result.error || "Payment completion failed.");
            }
          },

          onCancel: () => {
            alert("Payment cancelled.");
          },

          onError: (error) => {
            console.error(error);
            alert(error?.message || "Payment failed.");
          },
        }
      );

    } catch (err) {
      console.error(err);
      alert("Unable to create payment.");
    }

    setBuying(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: "center", fontSize: 22 }}>
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <h2>Product not found</h2>
        <Link href="/">← Back to Store</Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name}</title>
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
                cursor: buying ? "not-allowed" : "pointer",
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
