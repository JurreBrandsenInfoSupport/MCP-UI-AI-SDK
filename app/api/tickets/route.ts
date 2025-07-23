import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock data for when Zendesk credentials are not available
const mockTickets = [
  {
    id: 14975,
    subject: "Bug - Wissel - v2025.11.10",
    description: "Bijsturingsgeluid werkt niet",
    status: "open",
    priority: "normal",
    type: "incident",
    created_at: "2025-07-23T14:05:10Z",
    updated_at: "2025-07-23T14:09:11Z",
    submitter_id: 26623239142557,
    assignee_id: null,
  },
  {
    id: 14974,
    subject: "Vraag - Login probleem",
    description: "Kan niet inloggen met mijn account",
    status: "pending",
    priority: "high",
    type: "question",
    created_at: "2025-07-23T13:30:15Z",
    updated_at: "2025-07-23T13:45:22Z",
    submitter_id: 26623239142558,
    assignee_id: 12345,
  },
  {
    id: 14973,
    subject: "Compliment - Geweldige service",
    description: "Heel tevreden met de snelle hulp!",
    status: "solved",
    priority: "low",
    type: "task",
    created_at: "2025-07-23T12:15:30Z",
    updated_at: "2025-07-23T12:20:45Z",
    submitter_id: 26623239142559,
    assignee_id: 12346,
  },
  {
    id: 14972,
    subject: "Klacht - Trage website",
    description: "De website laadt heel langzaam",
    status: "open",
    priority: "normal",
    type: "problem",
    created_at: "2025-07-23T11:45:12Z",
    updated_at: "2025-07-23T11:50:33Z",
    submitter_id: 26623239142560,
    assignee_id: null,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const perPage = searchParams.get("per_page") || "25"
    const page = searchParams.get("page") || "1"

    try {
      // Try to fetch real tickets from Zendesk
      const response = await zendeskClient.listTickets({
        per_page: Number.parseInt(perPage),
        page: Number.parseInt(page),
        sort_by: "created_at",
        sort_order: "desc",
      })

      return NextResponse.json({
        tickets: response.tickets || [],
        mocked: false,
      })
    } catch (error) {
      console.error("Failed to fetch tickets from Zendesk:", error)

      // Return mock data when Zendesk is not available
      return NextResponse.json({
        tickets: mockTickets,
        mocked: true,
      })
    }
  } catch (error) {
    console.error("Tickets API error:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
