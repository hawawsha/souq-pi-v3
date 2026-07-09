"use client";

import { useState } from "react";

export default function StorePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // مثال مبدئي لمنتج - في الواقع سيأتي من قاعدة البيانات عبر fetch("/api/products")
  const product = {
    _id: "PRODUCT_ID_HERE",
    name: "منتج تجريبي",
    price: 1, // بعملة Pi
  };

  async function handleBuy(product) {
    try {
      setLoading(true);
      setMessage("");

      if (typeof window === "undefined" || !window.Pi) {
        setMessage("Pi SDK غير متوفر. الرجاء فتح الصفحة عبر تطبيق Pi Browser.");
        console.log("HTTP Status: N/A - window.Pi is undefined");
        return;
      }

      // 1) إنشاء الطلب في MongoDB
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          userUid: window.Pi?.currentUser?.uid || "GUEST_UID",
        }),
      });

      console.log("HTTP Status (create order):", orderRes.status);
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        setMessage(orderData.message || "فشل إنشاء الطلب");
        return;
      }

      const order = orderData.data;

      // 2) استدعاء window.Pi.createPayment
      window.Pi.createPayment(
        {
          amount: order.amount,
          memo: `شراء ${order.productName}`,
          metadata: { orderId: order._id },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log("Payment ready for approval:", paymentId);

            const approveRes = await fetch("/api/pi/approve-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId: order._id }),
            });

            console.log("HTTP Status (approve-payment):", approveRes.status);
            const approveData = await approveRes.json();

            if (!approveRes.ok || !approveData.success) {
              setMessage(approveData.message || "فشلت الموافقة على الدفع");
            }
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("Payment ready for completion:", paymentId, txid);

            const completeRes = await fetch("/api/pi/complete-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            console.log("HTTP Status (complete-payment):", completeRes.status);
            const completeData = await completeRes.json();

            if (completeRes.ok && completeData.success) {
              setMessage("تم الدفع وإتمام الطلب بنجاح ✅");
            } else {
              setMessage(completeData.message || "فشل إتمام الدفع");
            }
          },

          onCancel: (paymentId) => {
            console.log("Payment cancelled by user:", paymentId);
            setMessage("تم إلغاء عملية الدفع");
          },

          onError: (error, payment) => {
            console.log("Pi SDK payment error:", error, payment);
            setMessage("حدث خطأ أثناء الدفع عبر Pi Network");
          },
        }
      );
    } catch (error) {
      console.log("HTTP Status: 500 - handleBuy error:", error.message);
      setMessage("حدث خطأ غير متوقع أثناء عملية الشراء");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>متجر Souq Pi</h1>

      <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", maxWidth: 300 }}>
        <h2>{product.name}</h2>
        <p>{product.price} π</p>
        <button onClick={() => handleBuy(product)} disabled={loading}>
          {loading ? "جاري المعالجة..." : "شراء الآن"}
        </button>
      </div>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}
