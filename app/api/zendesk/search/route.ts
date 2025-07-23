import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "ticket"

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    try {
      // Try to search in Zendesk
      const response = await zendeskClient.search(query, { type })

      return NextResponse.json({
        results: response.results || [],
        mocked: false,
      })
    } catch (error) {
      console.error("Failed to search Zendesk:", error)

      // Return empty results when search fails
      return NextResponse.json({
        results: [],
        mocked: true,
        error: "Search not available - using mock data",
      })
    }
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
