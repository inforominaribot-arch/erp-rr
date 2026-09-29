import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PWARegister } from "@/components/pwa-register"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: "ERP RR — Sistema de Gestión",
  description: "Sistema ERP para gestión de toldos y cortinas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mediciones RR",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.className} h-full`}>
      <body className="h-full antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
