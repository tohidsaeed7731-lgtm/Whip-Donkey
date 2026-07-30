import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "پنج ضربه تا عرعر!",
  description: "یک بازی کوچک و بامزه با شلاقِ نشانگر موس و مهمان عرعری.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
