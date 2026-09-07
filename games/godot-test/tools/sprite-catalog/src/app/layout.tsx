import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprite Catalog & Asset Manager",
  description: "Interactive 2D Sprite Catalog and Asset Re-Mapping Tool for Godot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
