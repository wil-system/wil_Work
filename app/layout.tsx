import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WIL 업무 협업툴",
  description: "WIL team collaboration workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
