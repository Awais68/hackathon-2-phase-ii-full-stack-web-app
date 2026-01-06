import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3005",
        "http://localhost:3003",
    ],
})
