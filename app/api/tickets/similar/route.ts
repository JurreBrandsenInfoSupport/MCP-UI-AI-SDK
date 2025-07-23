import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock similar tickets data with more realistic closed tickets
const mockSimilarTickets = {
  14975: [
    {
      id: 14950,
      subject: "Bug - Wissel - v2025.10.15",
      description: "Bijsturingsgeluid werkt niet na update. Systeem geeft geen audio feedback bij wissel operaties.",
      status: "closed",
      priority: "normal",
      type: "incident",
      created_at: "2025-07-20T10:15:00Z",
      updated_at: "2025-07-20T15:30:00Z",
      submitter_id: 26623239142561,
      assignee_id: 12345,
      comments: [
        {
          id: 1001,
          body: "Ik heb hetzelfde probleem. Bijsturingsgeluid werkt niet meer sinds de laatste update.",
          author_id: 26623239142561,
          created_at: "2025-07-20T10:20:00Z",
          public: true,
        },
        {
          id: 1002,
          body: "Probleem opgelost door audio driver te updaten naar versie 3.2.1. Herstart van systeem vereist na installatie. Stappen: 1) Download driver van fabrikant website, 2) Installeer driver, 3) Herstart systeem, 4) Test bijsturingsgeluid.",
          author_id: 12345,
          created_at: "2025-07-20T15:30:00Z",
          public: true,
        },
      ],
    },
    {
      id: 14925,
      subject: "Vraag - Geluid problemen wissel",
      description: "Geen geluid bij wissel operaties. Audio systeem lijkt niet te reageren op wissel commando's.",
      status: "closed",
      priority: "high",
      type: "question",
      created_at: "2025-07-18T14:20:00Z",
      updated_at: "2025-07-18T16:45:00Z",
      submitter_id: 26623239142562,
      assignee_id: 12346,
      comments: [
        {
          id: 1003,
          body: "Gebruiker meldt geen geluid bij wissel operaties. Probleem lijkt software gerelateerd.",
          author_id: 12346,
          created_at: "2025-07-18T14:25:00Z",
          public: true,
        },
        {
          id: 1004,
          body: "Configuratie aangepast in wissel control panel. Audio output instellingen waren incorrect geconfigureerd. Oplossing: 1) Open control panel, 2) Ga naar Audio Settings, 3) Selecteer correct output device (meestal 'Primary Sound Driver'), 4) Test audio functionaliteit. Probleem opgelost.",
          author_id: 12346,
          created_at: "2025-07-18T16:45:00Z",
          public: true,
        },
      ],
    },
  ],
  14974: [
    {
      id: 14960,
      subject: "Vraag - Kan niet inloggen",
      description: "Login scherm accepteert wachtwoord niet. Gebruiker krijgt foutmelding bij inlogpoging.",
      status: "closed",
      priority: "high",
      type: "question",
      created_at: "2025-07-21T09:30:00Z",
      updated_at: "2025-07-21T10:15:00Z",
      submitter_id: 26623239142563,
      assignee_id: 12345,
      comments: [
        {
          id: 1005,
          body: "Gebruiker kan niet inloggen, wachtwoord wordt niet geaccepteerd.",
          author_id: 12345,
          created_at: "2025-07-21T09:35:00Z",
          public: true,
        },
        {
          id: 1006,
          body: "Wachtwoord reset uitgevoerd. Gebruiker had caps lock aan staan tijdens inlogpoging. Nieuwe tijdelijke wachtwoord verstuurd via email. Gebruiker kan nu succesvol inloggen. Advies gegeven om caps lock status te controleren bij toekomstige inlogproblemen.",
          author_id: 12345,
          created_at: "2025-07-21T10:15:00Z",
          public: true,
        },
      ],
    },
  ],
}

async function fetchTicketComments(ticketId: number) {
  try {
    const response = await zendeskClient.getTicketComments(ticketId)
    return response.comments || []
  } catch (error) {
    console.error(`Failed to fetch comments for ticket ${ticketId}:`, error)
    // Return mock comments if available
    const mockComments = {
      14950: [
        {
          id: 1001,
          body: "Ik heb hetzelfde probleem. Bijsturingsgeluid werkt niet meer sinds de laatste update.",
          author_id: 26623239142561,
          created_at: "2025-07-20T10:20:00Z",
          public: true,
        },
        {
          id: 1002,
          body: "Probleem opgelost door audio driver te updaten naar versie 3.2.1. Herstart van systeem vereist na installatie. Stappen: 1) Download driver van fabrikant website, 2) Installeer driver, 3) Herstart systeem, 4) Test bijsturingsgeluid.",
          author_id: 12345,
          created_at: "2025-07-20T15:30:00Z",
          public: true,
        },
      ],
      14925: [
        {
          id: 1003,
          body: "Gebruiker meldt geen geluid bij wissel operaties. Probleem lijkt software gerelateerd.",
          author_id: 12346,
          created_at: "2025-07-18T14:25:00Z",
          public: true,
        },
        {
          id: 1004,
          body: "Configuratie aangepast in wissel control panel. Audio output instellingen waren incorrect geconfigureerd. Oplossing: 1) Open control panel, 2) Ga naar Audio Settings, 3) Selecteer correct output device (meestal 'Primary Sound Driver'), 4) Test audio functionaliteit. Probleem opgelost.",
          author_id: 12346,
          created_at: "2025-07-18T16:45:00Z",
          public: true,
        },
      ],
      14960: [
        {
          id: 1005,
          body: "Gebruiker kan niet inloggen, wachtwoord wordt niet geaccepteerd.",
          author_id: 12345,
          created_at: "2025-07-21T09:35:00Z",
          public: true,
        },
        {
          id: 1006,
          body: "Wachtwoord reset uitgevoerd. Gebruiker had caps lock aan staan tijdens inlogpoging. Nieuwe tijdelijke wachtwoord verstuurd via email. Gebruiker kan nu succesvol inloggen. Advies gegeven om caps lock status te controleren bij toekomstige inlogproblemen.",
          author_id: 12345,
          created_at: "2025-07-21T10:15:00Z",
          public: true,
        },
      ],
    }
    return mockComments[ticketId as keyof typeof mockComments] || []
  }
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
      // Try to search for similar CLOSED tickets in Zendesk
      let searchQuery = ""
      if (subject) {
        // Extract key terms from subject for search, focusing on closed tickets
        const keyTerms = subject
          .toLowerCase()
          .split(/[\s\-_]+/)
          .filter((term) => term.length > 3 && !["bug", "vraag", "klacht", "compliment"].includes(term))
          .slice(0, 3)
          .join(" ")

        // Only search for closed tickets
        searchQuery = `type:ticket status:closed ${keyTerms}`
      }

      if (searchQuery) {
        const response = await zendeskClient.search(searchQuery, {
          type: "ticket",
          sort_by: "updated_at",
          sort_order: "desc",
        })

        // Filter out the current ticket and limit results
        const filteredTickets = (response.results || [])
          .filter((ticket: any) => ticket.id !== Number.parseInt(ticketId) && ticket.status === "closed")
          .slice(0, 5)

        // Fetch comments for each similar ticket
        const similarTicketsWithComments = await Promise.all(
          filteredTickets.map(async (ticket: any) => {
            const comments = await fetchTicketComments(ticket.id)

            // Get the last comment as the solution
            const lastComment = comments.length > 0 ? comments[comments.length - 1] : null
            const solution = lastComment ? lastComment.body : "Geen oplossing beschikbaar"

            // Calculate resolution time
            const createdTime = new Date(ticket.created_at).getTime()
            const updatedTime = new Date(ticket.updated_at).getTime()
            const diffHours = Math.round((updatedTime - createdTime) / (1000 * 60 * 60))
            const resolutionTime =
              diffHours > 24 ? `${Math.round(diffHours / 24)} dagen` : `${diffHours} uur${diffHours !== 1 ? "" : ""}`

            return {
              ...ticket,
              problem: ticket.description || "Geen probleem beschrijving beschikbaar",
              solution,
              resolution_time: resolutionTime,
              comments,
            }
          }),
        )

        return NextResponse.json({
          similarTickets: similarTicketsWithComments,
          mocked: false,
        })
      } else {
        throw new Error("No search terms available")
      }
    } catch (error) {
      console.error("Failed to search for similar tickets:", error)

      // Return mock data when search fails
      const mockTickets = mockSimilarTickets[Number.parseInt(ticketId) as keyof typeof mockSimilarTickets] || []

      // Process mock tickets to extract solution from last comment
      const processedMockTickets = mockTickets.map((ticket: any) => {
        const lastComment =
          ticket.comments && ticket.comments.length > 0 ? ticket.comments[ticket.comments.length - 1] : null

        const solution = lastComment ? lastComment.body : "Geen oplossing beschikbaar"

        // Calculate resolution time for mock data
        const createdTime = new Date(ticket.created_at).getTime()
        const updatedTime = new Date(ticket.updated_at).getTime()
        const diffHours = Math.round((updatedTime - createdTime) / (1000 * 60 * 60))
        const resolutionTime =
          diffHours > 24 ? `${Math.round(diffHours / 24)} dagen` : `${diffHours} uur${diffHours !== 1 ? "" : ""}`

        return {
          ...ticket,
          problem: ticket.description,
          solution,
          resolution_time: resolutionTime,
        }
      })

      return NextResponse.json({
        similarTickets: processedMockTickets,
        mocked: true,
      })
    }
  } catch (error) {
    console.error("Similar tickets API error:", error)
    return NextResponse.json({ error: "Failed to fetch similar tickets" }, { status: 500 })
  }
}
