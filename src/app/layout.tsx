import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบนับสต็อกร้านเสื้อผ้า - Loyverse Linker",
  description: "ระบบตรวจสต็อกจริงและจัดการสต็อกร้านเสื้อผ้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
