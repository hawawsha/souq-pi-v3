"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    images: "",
    stock: "1",
    sellerUsername: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleUnlock(e) {
    e.preventDefault();
    if (secret.trim()) {
      setUnlocked(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          category: form.category,
          images: form.images
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          stock: parseInt(form.stock, 10) || 0,
          sellerUsername: form.sellerUsername || "Souq Pi",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("تم إضافة المنتج بنجاح ✅");
        setForm({
          name: "",
          description: "",
          price: "",
          category: "",
          images: "",
          stock: "1",
          sellerUsername: "",
        });
      } else if (res.status === 401) {
        setMessage("كلمة السر غير صحيحة");
        setUnlocked(false);
      } else {
        setMessage(data.message || "فشل إضافة المنتج");
      }
    } catch (error) {
      setMessage("حدث خطأ: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sq-page">
      <header className="sq-header sq-header-detail">
        <Link href="/store" className="sq-back-link">
          ← الرجوع للمتجر
        </Link>
        <h1 className="sq-wordmark sq-wordmark-sm">لوحة الإدارة</h1>
      </header>

      <div className="sq-detail">
        <Link href="/admin/refunds" className="sq-buy-btn sq-admin-nav-btn">
          عرض طلبات الاسترجاع ←
        </Link>
        {!unlocked ? (
          <form onSubmit={handleUnlock} className="sq-admin-form">
            <label className="sq-admin-label">كلمة سر الإدارة</label>
            <input
              type="password"
              className="sq-admin-input"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="أدخل كلمة السر"
            />
            <button type="submit" className="sq-buy-btn sq-buy-btn-lg">
              دخول
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="sq-admin-form">
            <label className="sq-admin-label">اسم المنتج *</label>
            <input
              className="sq-admin-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label className="sq-admin-label">الوصف</label>
            <textarea
              className="sq-admin-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />

            <label className="sq-admin-label">السعر (π) *</label>
            <input
              className="sq-admin-input"
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />

            <label className="sq-admin-label">الفئة</label>
            <input
              className="sq-admin-input"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="مثلاً: الكترونيات"
            />

            <label className="sq-admin-label">روابط الصور (افصل بينها بفاصلة ,)</label>
            <textarea
              className="sq-admin-input"
              name="images"
              value={form.images}
              onChange={handleChange}
              rows={2}
              placeholder="https://...jpg, https://...jpg"
            />

            <label className="sq-admin-label">الكمية المتوفرة</label>
            <input
              className="sq-admin-input"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
            />

            <label className="sq-admin-label">اسم البائع</label>
            <input
              className="sq-admin-input"
              name="sellerUsername"
              value={form.sellerUsername}
              onChange={handleChange}
              placeholder="Souq Pi"
            />

            <button type="submit" className="sq-buy-btn sq-buy-btn-lg" disabled={submitting}>
              {submitting ? "جاري الإضافة..." : "إضافة المنتج"}
            </button>
          </form>
        )}

        {message && (
          <p
            className={
              "sq-message " +
              (message.includes("✅") ? "is-success" : "is-error")
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
