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
        sandbox: process.env.NEXT_PUBLIC_PI_NETWORK === "testnet",
      });

      try {
        const auth = await window.Pi.authenticate(
          ["payments", "username"],
          (payment) => {
            console.log("Incomplete payment:", payment);
          }
        );

        setPiUser(auth.user);
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
    if (!window.Pi) { alert("Pi SDK not loaded"); return; }
    if (!piUser) { alert("Please login with Pi"); return; }

    setBuying(true);

    try {
      const create = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId,
          productName: product.name,
          amount: Number(product.price),
          buyerUid: piUser.uid,
          buyerUsername: piUser.username,
          buyerWalletAddress: "",
        }),
      });

      const result = await create.json();
      if (!result.success) { alert(result.error); setBuying(false); return; }

      // استدعاء Pi.createPayment من الواجهة الأمامية
      await window.Pi.createPayment({
        amount: Number(product.price),
        memo: `Order ${result.data.orderId}`,
        metadata: {
          orderId: result.data.orderId,
          productId: product.productId,
        },
      }, {
        onReadyForServerApproval: async (paymentId) => {
          const approve = await fetch("/api/pi/approve-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, orderId: result.data.orderId }),
          });
          const approveJson = await approve.json();
          if (!approveJson.success) throw new Error(approveJson.error || "Approve failed");
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          const complete = await fetch("/api/pi/complete-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });
          const completeJson = await complete.json();
          if (completeJson.success) {
            alert("✅ Payment completed successfully.");
            router.push("/");
          } else {
            alert(completeJson.error || "Payment completion failed.");
          }
        },
        onCancel: () => { alert("Payment cancelled."); },
        onError: (error) => { alert("Payment failed."); },
      });
    } catch (err) {
      console.error(err);
      alert("Unable to create payment.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) return <div style={{ padding: 50, textAlign: "center", fontSize: 22 }}>Loading...</div>;

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
      {/* بقية واجهة الصفحة الخاصة بك تبقى كما هي هنا */}
    </>
  );
}
