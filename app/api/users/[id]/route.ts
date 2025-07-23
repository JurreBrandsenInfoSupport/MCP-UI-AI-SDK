import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

// Mock users data
const mockUsers = {
  26623239142557: {
    id: 26623239142557,
    name: "Brandsen, Jurre",
    email: "jurre.brandsen@ns.nl",
    created_at: "2025-04-14T10:30:00Z",
    updated_at: "2025-07-23T14:00:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142558: {
    id: 26623239142558,
    name: "Jansen, Piet",
    email: "piet.jansen@example.com",
    created_at: "2025-03-10T09:15:00Z",
    updated_at: "2025-07-23T13:30:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142559: {
    id: 26623239142559,
    name: "De Vries, Anna",
    email: "anna.devries@example.com",
    created_at: "2025-02-20T14:45:00Z",
    updated_at: "2025-07-23T12:15:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
  26623239142560: {
    id: 26623239142560,
    name: "Bakker, Jan",
    email: "jan.bakker@example.com",
    created_at: "2025-01-15T11:20:00Z",
    updated_at: "2025-07-23T11:45:00Z",
    time_zone: "Amsterdam",
    role: "end-user",
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    try {
      // Try to fetch real user from Zendesk
      const response = await zendeskClient.getUser(userId)

      return NextResponse.json({
        user: response.user,
        mocked: false,
      })
    } catch (error) {
      console.error(`Failed to fetch user ${userId} from Zendesk:`, error)

      // Return mock data when Zendesk is not available
      const mockUser = mockUsers[userId]
      if (mockUser) {
        return NextResponse.json({
          user: mockUser,
          mocked: true,
        })
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }
  } catch (error) {
    console.error("User API error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
