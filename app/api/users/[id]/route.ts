import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const data = await zendeskClient.getUser(userId)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching user:", error)

    // Check if it's a credentials issue
    if (error.message.includes("credentials not configured")) {
      // Return mock user data
      return NextResponse.json({
        mocked: true,
        user: {
          id: Number.parseInt(params.id),
          name: "Mock User",
          email: "mock.user@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          time_zone: "UTC",
          role: "end-user",
        },
      })
    }

    return NextResponse.json({ error: "Failed to fetch user", details: error.message }, { status: 500 })
  }
}
