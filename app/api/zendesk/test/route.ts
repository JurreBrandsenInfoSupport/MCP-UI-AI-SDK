import { NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

/**
 * GET /api/zendesk/test
 *
 * Test the Zendesk connection
 */
export async function GET() {
  try {
    const result = await zendeskClient.testConnection()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Zendesk connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: "Make sure ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN are set correctly",
      },
      { status: 500 },
    )
  }
}
