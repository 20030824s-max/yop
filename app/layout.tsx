// ======================================
// 📱 アプリ全体のレイアウト
// ======================================
// すべてのページに共通する設定

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yop カフェ - 在庫管理",
  description: "Yop カフェの在庫・発注管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* AuthProviderでアプリ全体を囲む */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}