// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono, Lobster } from "next/font/google";
import "./globals.css";
import OptionalTopBar from "./components/OptionalTopBar";
import { CartProvider } from "../context/CartContext";
import { CartDrawerProvider } from "../context/CartDrawerContext";
import { LoadingProvider } from "../context/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay";
import RouteChangeHandler from "./components/RouteChangeHandler";
import CartDrawer from "./components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lobster",
});

/**
 * Aquí defines el <title> y el favicon de toda la app.
 */
export const metadata: Metadata = {
  title: "Doble Chevron",              // <-- nuevo título
  description: "Tus dobleChevron favoritos al instante",
  icons: {
    icon: "/favicon.ico",               // <-- favicon en public/favicon.ico
    apple: "/apple-touch-icon.png",     // opcional para iOS
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${lobster.variable} antialiased`}>
        <LoadingProvider>
          <CartProvider>
            <CartDrawerProvider>
              <OptionalTopBar />
              <RouteChangeHandler />
              <LoadingOverlay />
              <CartDrawer />
              {children}
            </CartDrawerProvider>
          </CartProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
