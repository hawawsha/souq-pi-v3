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
