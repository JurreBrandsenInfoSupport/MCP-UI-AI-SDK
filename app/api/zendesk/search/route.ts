import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "ticket"

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const searchQuery = type === "ticket" ? `type:ticket ${query}` : query
    const data = await zendeskClient.search(searchQuery)

    return NextResponse.json({
      results: data.results || [],
      count: data.count,
      next_page: data.next_page,
      previous_page: data.previous_page,
    })
  } catch (error: any) {
    console.error("Error searching Zendesk:", error)

    // Check if it's a credentials issue
    if (error.message.includes("credentials not configured")) {
      return NextResponse.json({
        results: [],
        count: 0,
        mocked: true,
      })
    }

    return NextResponse.json({ error: "Search failed", details: error.message }, { status: 500 })
  }
}
