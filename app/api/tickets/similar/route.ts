import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock similar tickets data
const mockSimilarTickets = {
  14975: [
    {
      id: 14950,
      subject: "Bug - Wissel - v2025.10.15",
      description: "Bijsturingsgeluid werkt niet na update",
      status: "solved",
      priority: "normal",
      type: "incident",
      created_at: "2025-07-20T10:15:00Z",
      updated_at: "2025-07-20T15:30:00Z",
      submitter_id: 26623239142561,
      assignee_id: 12345,
      solution:
        "Probleem opgelost door audio driver te updaten naar versie 3.2.1. Herstart van systeem vereist na installatie.",
      resolution_time: "5 uur 15 minuten",
    },
    {
      id: 14925,
      subject: "Vraag - Geluid problemen wissel",
      description: "Geen geluid bij wissel operaties",
      status: "solved",
      priority: "high",
      type: "question",
      created_at: "2025-07-18T14:20:00Z",
      updated_at: "2025-07-18T16:45:00Z",
      submitter_id: 26623239142562,
      assignee_id: 12346,
      solution:
        "Configuratie aangepast in wissel control panel. Audio output instellingen waren incorrect geconfigureerd. Stappen: 1) Open control panel, 2) Ga naar Audio Settings, 3) Selecteer correct output device, 4) Test audio.",
      resolution_time: "2 uur 25 minuten",
    },
  ],
  14974: [
    {
      id: 14960,
      subject: "Vraag - Kan niet inloggen",
      description: "Login scherm accepteert wachtwoord niet",
      status: "solved",
      priority: "high",
      type: "question",
      created_at: "2025-07-21T09:30:00Z",
      updated_at: "2025-07-21T10:15:00Z",
      submitter_id: 26623239142563,
      assignee_id: 12345,
      solution:
        "Wachtwoord reset uitgevoerd. Gebruiker had caps lock aan staan. Nieuwe tijdelijke wachtwoord verstuurd via email.",
      resolution_time: "45 minuten",
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")
    const subject = searchParams.get("subject")
    const description = searchParams.get("description")

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    try {
      // Try to search for similar tickets in Zendesk
      let searchQuery = ""
      if (subject) {
        // Extract key terms from subject for search
        const keyTerms = subject
          .toLowerCase()
          .split(/[\s\-_]+/)
          .filter((term) => term.length > 3 && !["bug", "vraag", "klacht", "compliment"].includes(term))
          .slice(0, 3)
          .join(" ")

        searchQuery = `type:ticket status<solved ${keyTerms}`
      }

      if (searchQuery) {
        const response = await zendeskClient.search(searchQuery, {
          type: "ticket",
          sort_by: "updated_at",
          sort_order: "desc",
        })

        // Filter out the current ticket and limit results
        const similarTickets = (response.results || [])
          .filter((ticket: any) => ticket.id !== Number.parseInt(ticketId))
          .slice(0, 5)
          .map((ticket: any) => ({
            ...ticket,
            solution: ticket.description || "Geen oplossing beschikbaar",
            resolution_time: "Onbekend",
          }))

        return NextResponse.json({
          similarTickets,
          mocked: false,
        })
      } else {
        throw new Error("No search terms available")
      }
    } catch (error) {
      console.error("Failed to search for similar tickets:", error)

      // Return mock data when search fails
      const mockTickets = mockSimilarTickets[Number.parseInt(ticketId) as keyof typeof mockSimilarTickets] || []

      return NextResponse.json({
        similarTickets: mockTickets,
        mocked: true,
      })
    }
  } catch (error) {
    console.error("Similar tickets API error:", error)
    return NextResponse.json({ error: "Failed to fetch similar tickets" }, { status: 500 })
  }
}
