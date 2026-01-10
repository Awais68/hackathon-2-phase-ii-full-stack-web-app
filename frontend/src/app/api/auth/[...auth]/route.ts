import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Check if auth is properly initialized
if (!auth || !auth.handler) {
  console.error("❌ Auth not initialized - DATABASE_URL missing?")
  
  // Provide fallback handlers
  const errorHandler = () => {
    return NextResponse.json(
      { 
        error: "Auth service not configured",
        message: "DATABASE_URL environment variable is required",
        hasDatabase: !!process.env.DATABASE_URL 
      },
      { status: 503 }
    )
  }
  
  export const GET = errorHandler
  export const POST = errorHandler
} else {
  export const GET = auth.handler
  export const POST = auth.handler
}

