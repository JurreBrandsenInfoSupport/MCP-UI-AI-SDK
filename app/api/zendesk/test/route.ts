import { NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET() {
  try {
    const result = await zendeskClient.testConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Zendesk verbindingstest mislukt:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verbindingstest mislukt",
      },
      { status: 500 },
    )
  }
}
