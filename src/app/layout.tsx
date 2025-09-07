import type { Metadata, Viewport } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Transitional Spaces",
  description: "A 3D interactive web experience exploring the urban landscape forgotten in Shanghai.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
