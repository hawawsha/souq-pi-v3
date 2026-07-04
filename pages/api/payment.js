import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import PiLoginButton from "../../components/PiLoginButton";

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
    if (!product || !piUser) {
      alert("Please login with Pi first.");
      return;
    }

    setBuying(true);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.productId,
          productName: product.name,
          amount: Number(product.price),
          buyerUid: piUser.user.uid,
          buyerUsername: piUser.user.username,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Payment failed");
        setBuying(false);
        return;
      }

      console.log("Payment created:", data.data);

      // سيتم في الجزء الثاني تشغيل Pi.createPayment
          await window.Pi.createPayment(
        {
          amount: Number(product.price),
          memo: `Order: ${data.data.orderId}`,
          metadata: {
            orderId: data.data.orderId,
            productId: product.productId,
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            try {
              await fetch("/api/pi/approve-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentId }),
              });
            } catch (err) {
              console.error(err);
            }
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const res = await fetch("/api/pi/complete-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentId,
                  txid,
                }),
              });

              const result = await res.json();

              if (result.success) {
                alert("✅ Payment completed successfully.");
              } else {
                alert(result.error || "Payment completion failed.");
              }
            } catch (err) {
              console.error(err);
              alert("Payment completion failed.");
            }
          },

          onCancel: () => {
            alert("Payment cancelled.");
          },

          onError: (error) => {
            console.error(error);
            alert("Payment failed.");
          },
        }
      );
    } catch (err) {
      console.error(err);
      alert("Unable to create payment.");
    }

    setBuying(false);
  }
