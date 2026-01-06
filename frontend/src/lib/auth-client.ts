import { createAuthClient } from "better-auth/react"

// Use window.location.origin for dynamic port support in development
const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
})

export const { signIn, signUp, signOut, useSession } = authClient
