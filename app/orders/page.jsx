"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePiPurchase } from "@/lib/usePiPurchase";

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  approved: "تمت الموافقة",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const STATUS_CLASS = {
  pending: "is-neutral",
  approved: "is-neutral",
  completed: "is-success",
  cancelled: "is-error",
};

export default function MyOrdersPage() {
  const { piUser, authenticateWithPi, logDebug } = usePiPurchase();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        if (typeof window === "undefined" || !window.Pi) {
          setAuthError("افتح هذه الصفحة عبر تطبيق Pi Browser لعرض طلباتك.");
          setLoading(false);
          return;
        }

        const auth = await authenticateWithPi();
        const uid = auth.user.uid;

        const res = await fetch(`/api/orders?buyerUid=${encodeURIComponent(uid)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setOrders(data.data);
        } else {
          setAuthError(data.message || "تعذّر جلب الطلبات");
        }
      } catch (error) {
        logDebug("Failed to load orders:", error.message);
        setAuthError("فشل تسجيل الدخول عبر Pi Network لعرض طلباتك.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sq-page">
      <header className="sq-header sq-header-detail">
        <Link href="/store" className="sq-back-link">
          ← الرجوع للمتجر
        </Link>
        <h1 className="sq-wordmark sq-wordmark-sm">طلباتي</h1>
      </header>

      {loading && <p className="sq-loading">جاري تحميل طلباتك...</p>}

      {!loading && authError && <p className="sq-empty">{authError}</p>}

      {!loading && !authError && orders.length === 0 && (
        <p className="sq-empty">لا توجد لديك أي طلبات بعد.</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="sq-grid">
          {orders.map((order) => (
            <div className="sq-order-card" key={order.orderId}>
              <div className="sq-order-row">
                <h3 className="sq-order-name">{order.product.name}</h3>
                <span className={"sq-message sq-order-status " + (STATUS_CLASS[order.status] || "is-neutral")}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="sq-order-row">
                <span className="sq-order-price">
                  <span className="pi-glyph">π</span> {order.payment.amount}
                </span>
                <span className="sq-order-date">
                  {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
