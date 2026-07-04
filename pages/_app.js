import { PiPriceProvider } from "../contexts/PiPriceContext";
import "../styles/globals.css";

import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // تحميل Pi SDK الرسمي عند تشغيل التطبيق داخل Pi Browser
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;

    script.onload = () => {
      if (window.Pi) {
        window.Pi.init({
          version: "2.0",
          sandbox: process.env.NEXT_PUBLIC_PI_NETWORK !== "mainnet",
        });

        console.log("✅ Pi SDK Loaded");
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <PiPriceProvider>
      <Component {...pageProps} />
    </PiPriceProvider>
  );
}

export default MyApp;
