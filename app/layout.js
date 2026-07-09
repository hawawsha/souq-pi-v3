export const metadata = {
  title: "Souq Pi",
  description: "متجر Souq Pi يعمل بعملة Pi Network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
