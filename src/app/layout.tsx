import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HotelFlow",
  description: "Upravljanje apartmanima: rezervacije, čišćenje, popravke i računi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Latn" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
