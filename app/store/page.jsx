"use client";

import { useState, useEffect } from "react";

export default function StorePage() {
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [piUser, setPiUser] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        console.log("HTTP Status (fetch products):", res.status);
        const data = await res.json();

        if (res.ok && data.success) {
          setProducts(data.data);
        } else {
          setMessage("لا توجد منتجات بعد");
        }
      } catch (error) {
        console.log("Error fetching products:", error.message);
        setMessage("حدث خطأ أثناء جلب المنتجات");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  async function authenticateWithPi() {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.Pi) {
        reject(new Error("Pi SDK غير متوفر"));
        return;
      }

      const onIncompletePaymentFound = (payment) => {
        console.log("Incomplete payment found:", payment);
        // في حال وُجد دفع سابق لم يكتمل، يمكن استكماله عبر complete-payment هنا لاحقاً
      };

      window.Pi.authenticate(["payments"], onIncompletePaymentFound)
        .then((auth) => {
          console.log("Pi authenticate success:", auth.user.uid);
          setPiUser(auth.user);
          resolve(auth);
        })
        .catch((error) => {
          console.log("Pi authenticate error:", error);
          reject(error);
        });
    });
  }

  async function handleBuy(product) {
    try {
      console.log("handleBuy called with product:", JSON.stringify(product));
      setLoadingProductId(product._id);
      setMessage("");

      if (typeof window === "undefined" || !window.Pi) {
        setMessage("Pi SDK غير متوفر. الرجاء فتح الصفحة عبر تطبيق Pi Browser.");
        console.log("HTTP Status: N/A - window.Pi is undefined");
        return;
      }

      // 0) تسجيل الدخول وطلب صلاحية payments قبل أي عملية شراء
      let currentUser = piUser;
      if (!currentUser) {
        try {
          const auth = await authenticateWithPi();
          currentUser = auth.user;
        } catch (authError) {
          setMessage("فشل تسجيل الدخول عبر Pi Network. تأكد من الموافقة على الصلاحيات المطلوبة.");
          return;
        }
      }

      console.log("currentUser from Pi:", JSON.stringify(currentUser));

      if (!currentUser?.uid) {
        setMessage("لم يتم الحصول على معرّف المستخدم (uid) من Pi Network. حاول تسجيل الدخول من جديد.");
        console.log("HTTP Status: N/A - currentUser.uid is missing:", currentUser);
        return;
      }

      // 1) إنشاء الطلب في MongoDB
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId,
          buyerUid: currentUser.uid,
          buyerUsername: currentUser.username,
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
          amount: order.payment.amount,
          memo: `شراء ${order.product.name}`,
          metadata: { orderId: order.orderId },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log("Payment ready for approval:", paymentId);

            const approveRes = await fetch("/api/pi/approve-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId: order.orderId }),
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
      setMessage("خطأ: " + error.message);
    } finally {
      setLoadingProductId(null);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>متجر Souq Pi</h1>

      {loadingProducts && <p>جاري تحميل المنتجات...</p>}

      {!loadingProducts && products.length === 0 && (
        <p>
          لا توجد منتجات بعد. زر الرابط{" "}
          <code>/api/seed</code> مرة واحدة لإضافة منتج تجريبي.
        </p>
      )}

      {products.map((product) => (
        <div
          key={product._id}
          style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", maxWidth: 300, marginBottom: "1rem" }}
        >
          <h2>{product.name}</h2>
          <p>{product.price} π</p>
          <button onClick={() => handleBuy(product)} disabled={loadingProductId === product._id}>
            {loadingProductId === product._id ? "جاري المعالجة..." : "شراء الآن"}
          </button>
        </div>
      ))}

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}
