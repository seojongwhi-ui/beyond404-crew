import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LG SwapIt Crew",
  description: "LG SwapIt 수거 크루용 데모 앱",
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
