import { experimental_createMCPClient, streamText } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, mcpConfig } = await req.json()

  let mcpClient

  try {
    // Create MCP client based on configuration
    if (mcpConfig?.type === "stdio") {
      const transport = new Experimental_StdioMCPTransport({
        command: mcpConfig.command || "node",
        args: mcpConfig.args || ["server.js"],
      })
      mcpClient = await experimental_createMCPClient({ transport })
    } else if (mcpConfig?.type === "sse") {
      mcpClient = await experimental_createMCPClient({
        transport: {
          type: "sse",
          url: mcpConfig.url || "http://localhost:3000/sse",
        },
      })
    }

    // Get tools from MCP server if client is available
    const tools = mcpClient ? await mcpClient.tools() : {}

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      tools,
      onFinish: async () => {
        // Close MCP client when response is finished
        if (mcpClient) {
          await mcpClient.close()
        }
      },
      onError: async (error) => {
        // Close MCP client on error
        if (mcpClient) {
          await mcpClient.close()
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("MCP Client Error:", error)

    // Fallback to regular AI response without MCP tools
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
    })

    return result.toDataStreamResponse()
  }
}
