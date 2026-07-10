"use client";

import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
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
