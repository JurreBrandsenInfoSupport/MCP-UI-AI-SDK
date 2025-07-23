import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const data = await zendeskClient.getUser(userId)
    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    console.error("Error fetching user:", error)

    // Check if it's a credentials issue
    if (error.message.includes("credentials not configured")) {
      // Return mock user data
      return NextResponse.json({
        user: {
          id: params.id, // Updated to use params.id directly
          name: "Mock User",
          email: "mock.user@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          time_zone: "Amsterdam",
          role: "end-user",
        },
      })
    }

    return NextResponse.json({ error: "Failed to fetch user", details: error.message }, { status: 500 })
  }
}
