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
        count: response.count || 0,
        mocked: false,
      })
    } catch (error) {
      console.error("Failed to search Zendesk:", error)

      // Return mock similar tickets when search fails
      const mockSimilarTickets = [
        {
          id: 14970,
          subject: "Bug - Wissel - Geluidsproblemen",
          description: "Bijsturingsgeluid werkt niet correct na update. Opgelost door driver update.",
          status: "solved",
          priority: "normal",
          type: "incident",
          created_at: "2025-07-20T10:30:00Z",
          updated_at: "2025-07-21T14:15:00Z",
          submitter_id: 26623239142561,
          assignee_id: 12347,
        },
        {
          id: 14968,
          subject: "Vraag - Wissel geluid instellingen",
          description: "Hoe kan ik het bijsturingsgeluid aanpassen? Opgelost via instellingen menu.",
          status: "solved",
          priority: "low",
          type: "question",
          created_at: "2025-07-18T09:20:00Z",
          updated_at: "2025-07-19T11:30:00Z",
          submitter_id: 26623239142562,
          assignee_id: 12348,
        },
      ]

      // Filter mock tickets based on search query
      const filteredMockTickets = mockSimilarTickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(query.toLowerCase()) ||
          ticket.description.toLowerCase().includes(query.toLowerCase()),
      )

      return NextResponse.json({
        results: filteredMockTickets,
        count: filteredMockTickets.length,
        mocked: true,
        error: "Search not available - using mock data",
      })
    }
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
