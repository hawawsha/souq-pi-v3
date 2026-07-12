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

const REFUND_LABELS = {
  pending: "طلب الاسترجاع قيد المراجعة",
  approved: "تمت الموافقة على الاسترجاع",
  processing: "جاري تنفيذ الاسترجاع...",
  rejected: "تم رفض طلب الاسترجاع",
  completed: "تم استرجاع المبلغ",
  failed: "تعذّر تنفيذ الاسترجاع، سيُعاد المحاولة",
  cancelled: "تم إلغاء طلب الاسترجاع",
};

export default function MyOrdersPage() {
  const { authenticateWithPi, logDebug } = usePiPurchase();
  const [orders, setOrders] = useState([]);
  const [refundsByOrder, setRefundsByOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [buyerUid, setBuyerUid] = useState(null);
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [reasonDraft, setReasonDraft] = useState("");
  const [openReasonFor, setOpenReasonFor] = useState(null);

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
        setBuyerUid(uid);

        const [ordersRes, refundsRes] = await Promise.all([
          fetch(`/api/orders?buyerUid=${encodeURIComponent(uid)}`),
          fetch(`/api/refunds?buyerUid=${encodeURIComponent(uid)}`),
        ]);

        const ordersData = await ordersRes.json();
        const refundsData = await refundsRes.json();

        if (ordersRes.ok && ordersData.success) {
          setOrders(ordersData.data);
        } else {
          setAuthError(ordersData.message || "تعذّر جلب الطلبات");
        }

        if (refundsRes.ok && refundsData.success) {
          const map = {};
          refundsData.data.forEach((r) => {
            map[r.orderId] = r;
          });
          setRefundsByOrder(map);
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

  async function submitRefund(order) {
    setSubmittingOrderId(order.orderId);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          buyerUid,
          reason: reasonDraft,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRefundsByOrder((prev) => ({ ...prev, [order.orderId]: data.data }));
        setOpenReasonFor(null);
        setReasonDraft("");
      } else {
        alert(data.message || "فشل إرسال طلب الاسترجاع");
      }
    } catch (error) {
      alert("حدث خطأ: " + error.message);
    } finally {
      setSubmittingOrderId(null);
    }
  }

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
          {orders.map((order) => {
            const refund = refundsByOrder[order.orderId];
            const canRequestRefund =
              order.status === "completed" && (!refund || refund.status === "rejected");

            return (
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

                {refund && (
                  <p className="sq-refund-status">
                    {REFUND_LABELS[refund.status] || refund.status}
                  </p>
                )}

                {canRequestRefund && openReasonFor !== order.orderId && (
                  <button
                    className="sq-refund-btn"
                    onClick={() => setOpenReasonFor(order.orderId)}
                  >
                    طلب استرجاع
                  </button>
                )}

                {canRequestRefund && openReasonFor === order.orderId && (
                  <div className="sq-refund-form">
                    <textarea
                      className="sq-admin-input"
                      placeholder="سبب الاسترجاع (اختياري)"
                      rows={2}
                      value={reasonDraft}
                      onChange={(e) => setReasonDraft(e.target.value)}
                    />
                    <div className="sq-refund-actions">
                      <button
                        className="sq-refund-btn sq-refund-confirm"
                        onClick={() => submitRefund(order)}
                        disabled={submittingOrderId === order.orderId}
                      >
                        {submittingOrderId === order.orderId ? "جاري الإرسال..." : "تأكيد الطلب"}
                      </button>
                      <button
                        className="sq-refund-btn sq-refund-cancel"
                        onClick={() => {
                          setOpenReasonFor(null);
                          setReasonDraft("");
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
