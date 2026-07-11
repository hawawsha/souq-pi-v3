"use client";

import Script from "next/script";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lalezar&family=Almarai:wght@400;700;800&family=Tajawal:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window !== "undefined" && window.Pi) {
              // sandbox: true فقط أثناء Testnet - غيّرها لـ false عند إطلاق Mainnet
              window.Pi.init({ version: "2.0", sandbox: true });
              console.log("Pi SDK initialized successfully");
            } else {
              console.log("Pi SDK script loaded but window.Pi is still undefined");
            }
          }}
        />
        {children}
      </body>
    </html>
  );
}
