import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

/**
 * GET /api/zendesk/search?q=query
 *
 * Search Zendesk tickets, users, organizations, etc.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") // tickets, users, organizations

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    let searchQuery = query
    if (type) {
      searchQuery = `type:${type} ${query}`
    }

    const data = await zendeskClient.search(searchQuery)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error searching Zendesk:", error)
    return NextResponse.json({ error: "Failed to search", details: error.message }, { status: 500 })
  }
}
