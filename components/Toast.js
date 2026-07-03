import { useEffect } from "react";

export default function Toast({
  show,
  type = "success",
  message,
  onClose,
}) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  const bg =
    type === "success"
      ? "#00b894"
      : type === "error"
      ? "#d63031"
      : "#0984e3";

  return (
    <div
      style={{
        position: "fixed",
        top: 25,
        right: 25,
        zIndex: 999999,
        background: bg,
        color: "#fff",
        padding: "14px 20px",
        borderRadius: 10,
        minWidth: 280,
        boxShadow: "0 8px 25px rgba(0,0,0,.25)",
        fontWeight: "bold",
        animation: "fadeIn .25s ease",
      }}
    >
      {message}
