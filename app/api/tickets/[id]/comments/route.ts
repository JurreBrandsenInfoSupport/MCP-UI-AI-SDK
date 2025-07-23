import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock comments data
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
  14975: [
    {
      id: 1007,
      body: "Bijsturingsgeluid werkt niet. Gebruiker meldt geen audio feedback bij wissel operaties.",
      author_id: 26623239142561,
      created_at: "2025-07-23T14:05:00Z",
      public: true,
    },
  ],
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    try {
      // Try to fetch comments from Zendesk using the correct method
      const response = await zendeskClient.getTicketComments(Number.parseInt(ticketId))

      return NextResponse.json({
        comments: response.comments || [],
        mocked: false,
      })
    } catch (error) {
      console.error("Failed to fetch comments from Zendesk:", error)

      // Return mock data when Zendesk fails
      const comments = mockComments[Number.parseInt(ticketId) as keyof typeof mockComments] || []

      return NextResponse.json({
        comments,
        mocked: true,
      })
    }
  } catch (error) {
    console.error("Comments API error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
