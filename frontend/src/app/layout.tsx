import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JT29 HUB | Premium Software & Identities",
  description: "ศูนย์รวมซอฟต์แวร์พรีเมียมและไอดีคุณภาพสูง (Premium Software & Identities) ปลอดภัยและรวดเร็วที่สุด",
  keywords: ["JT29 HUB", "โปรแกรม", "ไอดี", "ซื้อขาย", "Premium Software", "Identities", "ซอฟต์แวร์"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
