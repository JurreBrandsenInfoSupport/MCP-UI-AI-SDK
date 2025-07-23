import { openai } from "@ai-sdk/openai"
import { streamText, convertToCoreMessages } from "ai"
import { spawn } from "child_process"

interface MCPConfig {
  type: "none" | "stdio" | "sse"
  url?: string
  command?: string
  args?: string[]
}

interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

interface MCPMessage {
  jsonrpc: string
  id: number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: string
  id: number
  result?: any
  error?: any
}

class MCPClient {
  private process: any = null
  private messageId = 1
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>()
  private tools: MCPTool[] = []
  private initialized = false

  constructor(private config: MCPConfig) {}

  async initialize(): Promise<void> {
    if (this.config.type !== "stdio" || this.initialized) return

    try {
      this.process = spawn(this.config.command!, this.config.args!, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      })

      this.process.stdout.on("data", (data: Buffer) => {
        const lines = data
          .toString()
          .split("\n")
          .filter((line) => line.trim())
        for (const line of lines) {
          try {
            const response: MCPResponse = JSON.parse(line)
            this.handleResponse(response)
          } catch (error) {
            console.error("Fout bij parsen MCP response:", error)
          }
        }
      })

      this.process.stderr.on("data", (data: Buffer) => {
        console.error("MCP stderr:", data.toString())
      })

      // Initialize MCP connection
      await this.sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
        clientInfo: {
          name: "zendesk-chat-client",
          version: "1.0.0",
        },
      })

      // Get available tools
      const toolsResponse = await this.sendRequest("tools/list", {})
      this.tools = toolsResponse.tools || []

      this.initialized = true
      console.log(
        "MCP client geïnitialiseerd met tools:",
        this.tools.map((t) => t.name),
      )
    } catch (error) {
      console.error("Fout bij initialiseren MCP client:", error)
      throw error
    }
  }

  private handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id)
    if (pending) {
      this.pendingRequests.delete(response.id)
      if (response.error) {
        pending.reject(new Error(response.error.message || "MCP fout"))
      } else {
        pending.resolve(response.result)
      }
    }
  }

  private sendRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.messageId++
      const message: MCPMessage = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      }

      this.pendingRequests.set(id, { resolve, reject })

      if (this.process && this.process.stdin) {
        this.process.stdin.write(JSON.stringify(message) + "\n")
      } else {
        reject(new Error("MCP proces niet beschikbaar"))
      }

      // Timeout na 30 seconden
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error("MCP request timeout"))
        }
      }, 30000)
    })
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const result = await this.sendRequest("tools/call", {
        name,
        arguments: arguments_,
      })
      return result
    } catch (error) {
      console.error(`Fout bij aanroepen tool ${name}:`, error)
      throw error
    }
  }

  getTools(): MCPTool[] {
    return this.tools
  }

  cleanup(): void {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
    this.pendingRequests.clear()
    this.initialized = false
  }
}

export async function POST(req: Request) {
  try {
    const { messages, mcpConfig } = await req.json()

    let mcpClient: MCPClient | null = null
    let availableTools: any[] = []

    // Initialize MCP client if configured
    if (mcpConfig && mcpConfig.type === "stdio") {
      try {
        mcpClient = new MCPClient(mcpConfig)
        await mcpClient.initialize()

        const mcpTools = mcpClient.getTools()
        availableTools = mcpTools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        }))
      } catch (error) {
        console.error("Fout bij initialiseren MCP:", error)
        // Continue zonder MCP tools
      }
    }

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: convertToCoreMessages(messages),
      tools:
        availableTools.length > 0
          ? Object.fromEntries(
              availableTools.map((tool) => [
                tool.function.name,
                {
                  description: tool.function.description,
                  parameters: tool.function.parameters,
                  execute: async (args: any) => {
                    if (mcpClient) {
                      try {
                        const result = await mcpClient.callTool(tool.function.name, args)
                        return result
                      } catch (error) {
                        console.error(`Fout bij uitvoeren tool ${tool.function.name}:`, error)
                        return { error: `Fout bij uitvoeren tool: ${error.message}` }
                      }
                    }
                    return { error: "MCP client niet beschikbaar" }
                  },
                },
              ]),
            )
          : undefined,
      maxTokens: 4000,
      temperature: 0.7,
    })

    // Cleanup MCP client when done
    if (mcpClient) {
      // Don't cleanup immediately, let it persist for the stream
      setTimeout(() => {
        mcpClient?.cleanup()
      }, 60000) // Cleanup after 1 minute
    }

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API fout:", error)
    return new Response(
      JSON.stringify({
        error: "Er is een interne serverfout opgetreden",
        details: error instanceof Error ? error.message : "Onbekende fout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
