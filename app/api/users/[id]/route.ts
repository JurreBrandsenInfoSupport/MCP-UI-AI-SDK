import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock gebruikersdata
const mockUsers = {
  26623239142557: {
    id: 26623239142557,
    name: "Brandsen, Jurre",
    email: "jurre.brandsen@ns.nl",
    created_at: "2025-04-14T10:00:00Z",
    updated_at: "2025-01-23T14:05:10Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142558: {
    id: 26623239142558,
    name: "Jansen, Piet",
    email: "piet.jansen@bedrijf.nl",
    created_at: "2025-03-10T08:30:00Z",
    updated_at: "2025-01-23T11:15:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142559: {
    id: 26623239142559,
    name: "Vries, Anna de",
    email: "anna.devries@organisatie.nl",
    created_at: "2025-02-20T14:45:00Z",
    updated_at: "2025-01-23T12:30:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142560: {
    id: 26623239142560,
    name: "Berg, Jan van den",
    email: "jan.vandenberg@firma.nl",
    created_at: "2025-01-15T09:20:00Z",
    updated_at: "2025-01-22T16:25:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Ongeldig gebruiker ID" }, { status: 400 })
    }

    try {
      // Probeer echte Zendesk gebruikersdata op te halen
      const response = await zendeskClient.getUser(userId)

      return NextResponse.json({
        user: response.user,
        mocked: false,
      })
    } catch (error) {
      console.error(`Fout bij ophalen gebruiker ${userId}, gebruik mock data:`, error)

      // Gebruik mock data als fallback
      const mockUser = mockUsers[userId]
      if (mockUser) {
        return NextResponse.json({
          user: mockUser,
          mocked: true,
        })
      } else {
        return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 })
      }
    }
  } catch (error) {
    console.error("API fout:", error)
    return NextResponse.json({ error: "Ophalen van gebruiker mislukt" }, { status: 500 })
  }
}
