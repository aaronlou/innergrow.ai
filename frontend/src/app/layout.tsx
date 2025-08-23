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
  title: {
    default: "InnerGrow.ai - AI 驱动的个人成长助手",
    template: "%s | InnerGrow.ai",
  },
  description: "通过 AI 技术帮助您实现个人目标，培养良好习惯，追踪成长进度。与智能助手对话，获得个性化的成长建议和支持。",
  keywords: ["个人成长", "AI助手", "目标管理", "习惯养成", "自我提升"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
