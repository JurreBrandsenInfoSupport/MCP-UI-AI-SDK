import { NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET() {
  try {
    const result = await zendeskClient.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Zendesk connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 },
    )
  }
}
