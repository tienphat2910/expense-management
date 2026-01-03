import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sổ thu chi cá nhân - Quản lý tài chính hiệu quả",
  description: "Ứng dụng quản lý thu chi cá nhân giúp bạn theo dõi giao dịch, quản lý ví tiền, đặt mục tiêu tiết kiệm và xem thống kê chi tiêu một cách dễ dàng và hiệu quả.",
  keywords: ["sổ thu chi", "quản lý tài chính", "thu chi cá nhân", "tiết kiệm", "ví tiền"],
  authors: [{ name: "Phat Nguyen", url: "https://phatnguyen.vercel.app" }],
  creator: "Phat Nguyen",
  publisher: "Phat Nguyen",
  metadataBase: new URL("https://sothuchi.vercel.app"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://sothuchi.vercel.app",
    title: "Sổ thu chi cá nhân - Quản lý tài chính hiệu quả",
    description: "Ứng dụng quản lý thu chi cá nhân giúp bạn theo dõi giao dịch, quản lý ví tiền, đặt mục tiêu tiết kiệm và xem thống kê chi tiêu một cách dễ dàng và hiệu quả.",
    siteName: "Sổ thu chi cá nhân",
    images: [
      {
        url: "/images/banner.png",
        width: 1200,
        height: 630,
        alt: "Sổ thu chi cá nhân",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sổ thu chi cá nhân - Quản lý tài chính hiệu quả",
    description: "Ứng dụng quản lý thu chi cá nhân giúp bạn theo dõi giao dịch, quản lý ví tiền, đặt mục tiêu tiết kiệm và xem thống kê chi tiêu.",
    images: ["/images/banner.png"],
    creator: "@phatnguyen",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
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
