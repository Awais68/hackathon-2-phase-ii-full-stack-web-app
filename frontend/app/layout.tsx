'use client'

import { useEffect } from 'react'
import { Inter } from "next/font/google"
import "./globals.css"
import { PWAProviders } from "@/components/PWAProviders"
import "@/lib/i18n" // Initialize i18n

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

/**
 * Mobile-first root layout component
 * Optimized for 320px minimum viewport width
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Setup viewport meta
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes'
      document.head.appendChild(meta)
    }

    // Setup theme color
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (!themeColor) {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? '#000000'
        : '#ffffff'
      document.head.appendChild(meta)
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Task Manager - PWA</title>
        <meta name="description" content="Mobile-first Progressive Web App for task management with offline support" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Task Manager" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <PWAProviders>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </PWAProviders>
      </body>
    </html>
  )
}
