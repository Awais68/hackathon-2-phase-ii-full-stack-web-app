'use client'

import { useEffect, useState } from 'react'
import { PWAProviders } from "@/components/PWAProviders"
import "@/lib/i18n-config"
import { useLanguage } from '@/hooks/useLanguage'

/**
 * Language-aware layout wrapper
 * Handles RTL direction changes and font loading
 */
function LanguageLayout({ children }: { children: React.ReactNode }) {
    const { isRTL, dir } = useLanguage()
    const [mounted, setMounted] = useState(false)

    // Handle hydration mismatch by waiting for client mount
    useEffect(() => {
        setMounted(true)
    }, [])

    // Apply RTL direction to document after mount
    useEffect(() => {
        if (mounted) {
            document.documentElement.dir = dir
            document.documentElement.lang = isRTL ? 'ur' : 'en'
        }
    }, [dir, isRTL, mounted])

    // Use default 'ltr' on server, actual value after hydration
    const currentDir = mounted ? dir : 'ltr'
    const currentLang = mounted ? (isRTL ? 'ur' : 'en') : 'en'

    return (
        <div
            dir={currentDir}
            lang={currentLang}
            suppressHydrationWarning
        >
            {children}
        </div>
    )
}

/**
 * Client-side layout wrapper
 * Contains all client-side logic and providers
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <PWAProviders>
            <LanguageLayout>
                <div className="flex flex-col min-h-screen">
                    {children}
                </div>
            </LanguageLayout>
        </PWAProviders>
    )
}
