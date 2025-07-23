import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

/**
 * GET /api/tickets
 *
 * Fetch tickets from Zendesk using the improved client
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters for filtering/sorting
    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get("sort_by") || "created_at"
    const sortOrder = searchParams.get("sort_order") || "desc"
    const status = searchParams.get("status")
    const limit = searchParams.get("per_page") || "25"

    const params: any = {
      sort_by: sortBy,
      sort_order: sortOrder,
      per_page: limit,
    }

    if (status) {
      params.status = status
    }

    const data = await zendeskClient.listTickets(params)
    return NextResponse.json({
      tickets: data.tickets || [],
      count: data.count,
      next_page: data.next_page,
      previous_page: data.previous_page,
    })
  } catch (error: any) {
    console.error("Error fetching tickets:", error)

    // Check if it's a credentials issue
    if (error.message.includes("credentials not configured")) {
      // Return mock data for development
      const mockNow = new Date().toISOString()
      return NextResponse.json({
        mocked: true,
        tickets: [
          {
            id: 99999,
            subject: "Mock - Example bug report",
            description: "This is a mocked ticket because Zendesk credentials are missing.",
            status: "open",
            created_at: mockNow,
            updated_at: mockNow,
            submitter_id: 123456789,
            priority: "normal",
            type: "incident",
          },
          {
            id: 99998,
            subject: "Mock - Feature request",
            description: "This is another mocked ticket for testing the UI.",
            status: "pending",
            created_at: mockNow,
            updated_at: mockNow,
            submitter_id: 123456790,
            priority: "low",
            type: "task",
          },
        ],
        count: 2,
      })
    }

    return NextResponse.json({ error: "Failed to fetch tickets", details: error.message }, { status: 500 })
  }
}
