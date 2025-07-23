import { NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET() {
  try {
    const result = await zendeskClient.testConnection()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Connection test failed",
      },
      { status: 500 },
    )
  }
}
