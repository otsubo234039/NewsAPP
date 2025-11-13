import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewsAPP - Your Personalized News Feed",
  description: "Stay informed with news tailored to your interests",
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
