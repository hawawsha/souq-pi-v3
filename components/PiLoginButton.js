import { useState } from "react";

export default function PiLoginButton({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!window.Pi) {
      alert("Pi SDK is not loaded.");
      return;
    }

    try {
      setLoading(true);

      const scopes = ["payments", "username"];

      const auth = await window.Pi.authenticate(
        scopes,
        () => {}
      );

      onLogin(auth);

    } catch (err) {
      console.error(err);
      alert("Pi login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={login}
      disabled={loading}
      style={{
        padding: "14px 24px",
        background: "#6c5ce7",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 16,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Connecting..." : "Login with Pi"}
    </button>
  );
}
