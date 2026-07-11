"use client";

import { useState, useEffect } from "react";

export default function StorePage() {
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [piUser, setPiUser] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);

  function logDebug(...args) {
    const line = args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ");
    console.log(...args);
    setDebugLogs((prev) => [...prev.slice(-30), `${new Date().toLocaleTimeString()} - ${line}`]);
  }

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        logDebug("HTTP Status (fetch products):", res.status);
        const data = await res.json();

        if (res.ok && data.success) {
          setProducts(data.data);
        } else {
          setMessage("لا توجد منتجات بعد");
        }
      } catch (error) {
        logDebug("Error fetching products:", error.message);
        setMessage("حدث خطأ أثناء جلب المنتجات");
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  async function authenticateWithPi() {
    logDebug("authenticateWithPi: started");
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.Pi) {
        logDebug("authenticateWithPi: window.Pi is missing");
        reject(new Error("Pi SDK غير متوفر"));
        return;
      }

      logDebug("authenticateWithPi: window.Pi exists, calling authenticate()");

      const onIncompletePaymentFound = (payment) => {
        logDebug("Incomplete payment found:", payment);
      };

      try {
        window.Pi.authenticate(["payments"], onIncompletePaymentFound)
          .then((auth) => {
            logDebug("Pi authenticate SUCCESS, uid:", auth?.user?.uid);
            setPiUser(auth.user);
            resolve(auth);
          })
          .catch((error) => {
            logDebug("Pi authenticate REJECTED:", error?.message || String(error));
            reject(error);
          });
      } catch (syncError) {
        logDebug("Pi authenticate THREW synchronously:", syncError?.message || String(syncError));
        reject(syncError);
      }
    });
  }

  async function handleBuy(product) {
    logDebug("=== handleBuy START for:", product.name, "===");
    try {
      setLoadingProductId(product._id);
      setMessage("");

      if (typeof window === "undefined" || !window.Pi) {
        logDebug("window.Pi not found - stopping here");
        setMessage("Pi SDK غير متوفر. الرجاء فتح الصفحة عبر تطبيق Pi Browser.");
        return;
      }

      logDebug("window.Pi found, proceeding to authenticate");

      let currentUser = piUser;
      if (!currentUser) {
        try {
          const auth = await authenticateWithPi();
          currentUser = auth.user;
        } catch (authError) {
          logDebug("authenticate failed:", authError?.message || String(authError));
          setMessage("فشل تسجيل الدخول عبر Pi Network. تأكد من الموافقة على الصلاحيات المطلوبة.");
          return;
        }
      }

      logDebug("currentUser:", currentUser);

      if (!currentUser?.uid) {
        logDebug("currentUser.uid missing, stopping");
        setMessage("لم يتم الحصول على معرّف المستخدم (uid) من Pi Network. حاول تسجيل الدخول من جديد.");
        return;
      }

      logDebug("Creating order in MongoDB...");
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId,
          buyerUid: currentUser.uid,
          buyerUsername: currentUser.username,
        }),
      });

      logDebug("HTTP Status (create order):", orderRes.status);
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        logDebug("Order creation failed:", orderData.message);
        setMessage(orderData.message || "فشل إنشاء الطلب");
        return;
      }

      const order = orderData.data;
      logDebug("Order created, orderId:", order.orderId);

      logDebug("Calling window.Pi.createPayment...");
      window.Pi.createPayment(
        {
          amount: order.payment.amount,
          memo: `شراء ${order.product.name}`,
          metadata: { orderId: order.orderId },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            logDebug("onReadyForServerApproval:", paymentId);

            const approveRes = await fetch("/api/pi/approve-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, orderId: order.orderId }),
            });

            logDebug("HTTP Status (approve-payment):", approveRes.status);
            const approveData = await approveRes.json();

            if (!approveRes.ok || !approveData.success) {
              setMessage(approveData.message || "فشلت الموافقة على الدفع");
            }
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            logDebug("onReadyForServerCompletion:", paymentId, txid);

            const completeRes = await fetch("/api/pi/complete-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            logDebug("HTTP Status (complete-payment):", completeRes.status);
            const completeData = await completeRes.json();

            if (completeRes.ok && completeData.success) {
              setMessage("تم الدفع وإتمام الطلب بنجاح ✅");
            } else {
              setMessage(completeData.message || "فشل إتمام الدفع");
            }
          },

          onCancel: (paymentId) => {
            logDebug("onCancel:", paymentId);
            setMessage("تم إلغاء عملية الدفع");
          },

          onError: (error, payment) => {
            logDebug("onError:", error?.message || String(error));
            setMessage("حدث خطأ أثناء الدفع عبر Pi Network");
          },
        }
      );
      logDebug("window.Pi.createPayment call returned (fire-and-forget)");
    } catch (error) {
      logDebug("CATCH block error:", error?.message || String(error));
      setMessage("خطأ: " + error.message);
    } finally {
      logDebug("=== handleBuy FINALLY - resetting loading state ===");
      setLoadingProductId(null);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "red", color: "white", padding: "1rem", fontSize: "20px", fontWeight: "bold", textAlign: "center", marginBottom: "1rem" }}>
        VERSION TEST 777 - إذا شفت هذا النص، فالتحديث الجديد وصل فعلاً
      </div>
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

      {message && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{message}</p>}

      {debugLogs.length > 0 && (
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px", direction: "ltr", textAlign: "left" }}>
          <strong>سجل التصحيح (Debug Log):</strong>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", marginTop: "0.5rem" }}>
            {debugLogs.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
