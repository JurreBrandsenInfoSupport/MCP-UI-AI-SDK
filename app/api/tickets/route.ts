import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock data voor wanneer Zendesk credentials niet beschikbaar zijn
const mockTickets = [
  {
    id: 14975,
    subject: "Bug - Wissel - v2025.11.10",
    description: "Bijsturingsgeluid werkt niet",
    status: "open",
    created_at: "2025-01-23T14:05:10Z",
    updated_at: "2025-01-23T14:09:11Z",
    submitter_id: 26623239142557,
    priority: "normal",
    type: "incident",
  },
  {
    id: 14976,
    subject: "Vraag - Installatie handleiding",
    description: "Waar kan ik de installatie handleiding vinden voor de nieuwe versie?",
    status: "pending",
    created_at: "2025-01-23T10:30:00Z",
    updated_at: "2025-01-23T11:15:00Z",
    submitter_id: 26623239142558,
    priority: "low",
    type: "question",
  },
  {
    id: 14977,
    subject: "Klacht - Trage responstijd",
    description: "De applicatie reageert zeer traag sinds de laatste update.",
    status: "open",
    created_at: "2025-01-23T09:45:00Z",
    updated_at: "2025-01-23T12:30:00Z",
    submitter_id: 26623239142559,
    priority: "high",
    type: "problem",
  },
  {
    id: 14978,
    subject: "Compliment - Uitstekende service",
    description: "Ik wil graag mijn waardering uitspreken voor de snelle en professionele hulp.",
    status: "solved",
    created_at: "2025-01-22T16:20:00Z",
    updated_at: "2025-01-22T16:25:00Z",
    submitter_id: 26623239142560,
    priority: "low",
    type: "task",
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const perPage = searchParams.get("per_page") || "25"

    try {
      // Probeer echte Zendesk data op te halen
      const response = await zendeskClient.listTickets({
        per_page: Number.parseInt(perPage),
        sort_by: "updated_at",
        sort_order: "desc",
      })

      return NextResponse.json({
        tickets: response.tickets || [],
        mocked: false,
      })
    } catch (error) {
      console.error("Fout bij ophalen Zendesk tickets, gebruik mock data:", error)

      // Gebruik mock data als fallback
      return NextResponse.json({
        tickets: mockTickets,
        mocked: true,
      })
    }
  } catch (error) {
    console.error("API fout:", error)
    return NextResponse.json(
      {
        error: "Ophalen van tickets mislukt",
        tickets: mockTickets,
        mocked: true,
      },
      { status: 500 },
    )
  }
}
