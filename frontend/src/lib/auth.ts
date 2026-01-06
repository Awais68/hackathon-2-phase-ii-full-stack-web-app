import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

// Skip database initialization during build
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Only initialize Prisma if not building and DATABASE_URL is set
const prisma = isBuilding || !process.env.DATABASE_URL
    ? null
    : (globalForPrisma.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    }))

if (process.env.NODE_ENV !== "production" && prisma) {
    globalForPrisma.prisma = prisma
}

// Get production URLs
const getBaseURL = () => {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }
    return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005"
}

export const auth = betterAuth({
    database: prisma ? prismaAdapter(prisma, {
        provider: "sqlite",
    }) : undefined as any,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    secret: process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",
    baseURL: getBaseURL(),
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3005",
        "http://localhost:3003",
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
        process.env.NEXT_PUBLIC_APP_URL || "",
    ].filter(Boolean),
})
