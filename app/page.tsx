"use client"

import { useChat } from "ai/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageSquare, Wrench, AlertCircle } from "lucide-react"

interface MCPConfig {
  type: "none" | "stdio" | "sse"
  url?: string
  command?: string
  args?: string[]
}

export default function MCPToolsChat() {
  const [mcpConfig, setMcpConfig] = useState<MCPConfig>({ type: "none" })
  const [sseUrl, setSseUrl] = useState("http://localhost:3000/sse")
  const [stdioCommand, setStdioCommand] = useState("node")
  const [stdioArgs, setStdioArgs] = useState("scripts/echo-mcp-server.js")

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { mcpConfig },
    onError: (error) => {
      console.error("Chat error:", error)
    },
    onFinish: (message) => {
      console.log("Message finished:", message)
    },
  })

  const updateMcpConfig = () => {
    const config: MCPConfig = { type: mcpConfig.type }

    if (mcpConfig.type === "sse") {
      config.url = sseUrl
    } else if (mcpConfig.type === "stdio") {
      config.command = stdioCommand
      config.args = stdioArgs.split(" ").filter((arg) => arg.trim())
    }

    setMcpConfig(config)
    console.log("Updated MCP config:", config)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-blue-600" />
            MCP Tools Chat
          </h1>
          <p className="text-gray-600">Chat with AI using Model Context Protocol (MCP) tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                MCP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mcp-type">Transport Type</Label>
                <Select
                  value={mcpConfig.type}
                  onValueChange={(value: "none" | "stdio" | "sse") => setMcpConfig({ ...mcpConfig, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No MCP Tools</SelectItem>
                    <SelectItem value="sse">Server-Sent Events</SelectItem>
                    <SelectItem value="stdio">Standard I/O</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mcpConfig.type === "sse" && (
                <div>
                  <Label htmlFor="sse-url">SSE Server URL</Label>
                  <Input
                    id="sse-url"
                    value={sseUrl}
                    onChange={(e) => setSseUrl(e.target.value)}
                    placeholder="http://localhost:3000/sse"
                  />
                </div>
              )}

              {mcpConfig.type === "stdio" && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="stdio-command">Command</Label>
                    <Input
                      id="stdio-command"
                      value={stdioCommand}
                      onChange={(e) => setStdioCommand(e.target.value)}
                      placeholder="node"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stdio-args">Arguments</Label>
                    <Input
                      id="stdio-args"
                      value={stdioArgs}
                      onChange={(e) => setStdioArgs(e.target.value)}
                      placeholder="scripts/echo-mcp-server.js"
                    />
                  </div>
                </div>
              )}

              <Button onClick={updateMcpConfig} className="w-full" size="sm">
                Apply Configuration
              </Button>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium">Status:</span>
                  <Badge variant={mcpConfig.type === "none" ? "secondary" : "default"}>
                    {mcpConfig.type === "none" ? "No MCP" : `MCP ${mcpConfig.type.toUpperCase()}`}
                  </Badge>
                </div>
                {mcpConfig.type !== "none" && (
                  <p className="text-xs text-gray-500">MCP tools will be available to the AI assistant</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
                {error && (
                  <Badge variant="destructive" className="ml-auto">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{error.message}</p>
                  </div>
                )}

                {messages.length === 0 && !error && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with the AI assistant</p>
                    {mcpConfig.type !== "none" && (
                      <p className="text-sm mt-2">MCP tools are enabled and ready to use</p>
                    )}
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Try: "Hello, can you help me?"</p>
                      {mcpConfig.type === "stdio" && <p>Or: "Echo the text 'Hello World'"</p>}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-900 shadow-sm border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.toolInvocations && message.toolInvocations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Tools used:</p>
                          {message.toolInvocations.map((tool, index) => (
                            <Badge key={index} variant="outline" className="mr-1 mb-1">
                              {tool.toolName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 shadow-sm border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask the AI assistant anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Use MCP Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Quick Test</h4>
              <p className="text-sm text-gray-600 mb-2">Try these simple prompts first to test the connection:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Hello, how are you?"</li>
                <li>• "What can you help me with?"</li>
                <li>• "Tell me a joke"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">With Echo MCP Server</h4>
              <p className="text-sm text-gray-600 mb-2">If you have the echo server running, try:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Can you echo the text 'Hello World'?"</li>
                <li>• "Reverse the text 'OpenAI'"</li>
                <li>• "Convert 'hello world' to uppercase"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
