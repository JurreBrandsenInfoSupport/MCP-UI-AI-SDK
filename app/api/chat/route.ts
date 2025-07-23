import { experimental_createMCPClient, streamText } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import { azure } from "@ai-sdk/azure"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, mcpConfig } = await req.json()

    console.log("Received request:", { messages, mcpConfig })

    let mcpClient

    try {
      // Create MCP client based on configuration
      if (mcpConfig?.type === "stdio") {
        console.log("Creating stdio MCP client...")
        const transport = new Experimental_StdioMCPTransport({
          command: mcpConfig.command || "node",
          args: mcpConfig.args || ["server.js"],
        })
        mcpClient = await experimental_createMCPClient({ transport })
        console.log("MCP client created successfully")
      } else if (mcpConfig?.type === "sse") {
        console.log("Creating SSE MCP client...")
        mcpClient = await experimental_createMCPClient({
          transport: {
            type: "sse",
            url: mcpConfig.url || "http://localhost:3000/sse",
          },
        })
        console.log("MCP client created successfully")
      }

      // Get tools from MCP server if client is available
      const tools = mcpClient ? await mcpClient.tools() : {}
      console.log("Available tools:", Object.keys(tools))

      // Create system prompt based on tool permission settings
      let systemPrompt = "You are a helpful AI assistant."

      if (mcpConfig?.type !== "none" && Object.keys(tools).length > 0) {
        if (mcpConfig.autoApproveTools) {
          systemPrompt +=
            " You have access to various tools and can use them freely to help the user. Use tools when they would be helpful to answer the user's request."
        } else {
          systemPrompt +=
            " You have access to various tools, but you must ask for the user's permission before using any tool. When you want to use a tool, first explain what tool you want to use and why, then ask 'May I use the [tool name] tool to [purpose]?' and wait for the user's approval before proceeding."
        }
      }

      const result = streamText({
        model: azure("gpt-4o"),
        system: systemPrompt,
        messages,
        tools: mcpConfig?.autoApproveTools ? tools : {}, // Only provide tools if auto-approved
        onFinish: async () => {
          console.log("Stream finished")
          // Close MCP client when response is finished
          if (mcpClient) {
            await mcpClient.close()
          }
        },
        onError: async (error) => {
          console.error("Stream error:", error)
          // Close MCP client on error
          if (mcpClient) {
            await mcpClient.close()
          }
        },
      })

      return result.toDataStreamResponse()
    } catch (mcpError) {
      console.error("MCP Client Error:", mcpError)

      // Fallback to regular AI response without MCP tools
      console.log("Falling back to regular AI response")
      const result = streamText({
        model: azure("gpt-4o"),
        messages,
      })

      return result.toDataStreamResponse()
    }
  } catch (error) {
    console.error("API Route Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
