import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.error("Error loading product:", err);
    }
    setLoading(false);
  }

  // دالة الدفع المدمجة بالـ Pi SDK
  async function handleBuy() {
    if (!product) return;
    
    // التحقق من وجود SDK
    if (typeof window === 'undefined' || !window.Pi) {
      alert("لم يتم تحميل نظام Pi SDK بعد، يرجى الانتظار ثانية أو إعادة تحميل الصفحة داخل Pi Browser");
      return;
    }

    try {
      const paymentData = {
        amount: parseFloat(product.price),
        memo: `شراء المنتج: ${product.name}`,
        metadata: { productId: product.productId },
      };

      await window.Pi.createPayment(paymentData, {
        onReadyForServerApproval: (paymentId) => {
          console.log("الدفعة جاهزة للموافقة من السيرفر:", paymentId);
          alert("تم إنشاء طلب الدفع، جاري المعالجة...");
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("تمت العملية بنجاح:", txid);
          alert("تمت عملية الدفع بنجاح!");
        },
        onCancel: () => alert("تم إلغاء عملية الدفع"),
        onError: (error) => {
          console.error("خطأ في الدفع:", error);
          alert("حدث خطأ في الدفع: " + (error.message || "يرجى المحاولة مجدداً"));
        },
      });
    } catch (err) {
      console.error("فشل في إنشاء الطلب:", err);
      alert("فشل في الاتصال بنظام الدفع");
    }
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
        <Link href="/">Back to Store</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <Head>
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </Head>

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
              product.images?.length > 0
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
            style={{
              marginTop: 30,
              padding: "15px 30px",
              background: "#6c5ce7",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Buy with Pi
          </button>
        </div>
      </div>
    </div>
  );
}
