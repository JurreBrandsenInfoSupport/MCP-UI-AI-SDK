"use client"

import { useChat } from "ai/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Settings,
  MessageSquare,
  Wrench,
  AlertCircle,
  User,
  Ticket,
  RefreshCw,
  Clock,
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Send,
  Bot,
} from "lucide-react"

interface MCPConfig {
  type: "none" | "stdio" | "sse"
  url?: string
  command?: string
  args?: string[]
}

interface ZendeskTicket {
  id: number
  subject: string
  description: string
  status: string
  created_at: string
  updated_at: string
  submitter_id: number
  assignee_id?: number
  priority?: string
  type?: string
}

interface ZendeskUser {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
  time_zone?: string
  role?: string
}

interface ConnectionStatus {
  testing: boolean
  success: boolean | null
  error: string | null
  user?: any
}

export default function MCPToolsChat() {
  const [mcpConfig, setMcpConfig] = useState<MCPConfig>({ type: "none" })
  const [sseUrl, setSseUrl] = useState("http://localhost:3000/sse")
  const [stdioCommand, setStdioCommand] = useState("node")
  const [stdioArgs, setStdioArgs] = useState(
    "C:\\Users\\JurreB\\Documents\\innovation\\zendesk-mcp-server\\src\\index.js",
  )
  const [tickets, setTickets] = useState<ZendeskTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<ZendeskTicket | null>(null)
  const [selectedUser, setSelectedUser] = useState<ZendeskUser | null>(null)
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    testing: false,
    success: null,
    error: null,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isMocked, setIsMocked] = useState(false)
  const [activeTab, setActiveTab] = useState("tickets")

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, setInput } = useChat({
    api: "/api/chat",
    body: { mcpConfig },
    onError: (error) => {
      console.error("Chat error:", error)
    },
    onFinish: (message) => {
      console.log("Message finished:", message)
    },
  })

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets()
  }, [])

  const testZendeskConnection = async () => {
    setConnectionStatus({ testing: true, success: null, error: null })

    try {
      const response = await fetch("/api/zendesk/test")
      const data = await response.json()

      if (data.success) {
        setConnectionStatus({
          testing: false,
          success: true,
          error: null,
          user: data.user,
        })
      } else {
        setConnectionStatus({
          testing: false,
          success: false,
          error: data.error || "Connection failed",
        })
      }
    } catch (error: any) {
      setConnectionStatus({
        testing: false,
        success: false,
        error: error.message || "Connection test failed",
      })
    }
  }

  const fetchTickets = async () => {
    setLoadingTickets(true)
    setTicketsError(null)
    try {
      const response = await fetch("/api/tickets?per_page=50")
      if (!response.ok) {
        throw new Error("Failed to fetch tickets")
      }
      const data = await response.json()
      setTickets(data.tickets || [])
      setIsMocked(data.mocked || false)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      setTicketsError(error instanceof Error ? error.message : "Failed to fetch tickets")
    } finally {
      setLoadingTickets(false)
    }
  }

  const fetchUser = async (userId: number) => {
    setLoadingUser(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }
      const data = await response.json()
      setSelectedUser(data.user)
    } catch (error) {
      console.error("Error fetching user:", error)
      setSelectedUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  const searchZendesk = async () => {
    if (!searchQuery.trim()) return

    setLoadingTickets(true)
    setTicketsError(null)

    try {
      const response = await fetch(`/api/zendesk/search?q=${encodeURIComponent(searchQuery)}&type=ticket`)
      if (!response.ok) {
        throw new Error("Search failed")
      }
      const data = await response.json()
      setTickets(data.results || [])
    } catch (error) {
      console.error("Error searching:", error)
      setTicketsError(error instanceof Error ? error.message : "Search failed")
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleTicketClick = (ticket: ZendeskTicket) => {
    setSelectedTicket(ticket)
    setSelectedUser(null)
    fetchUser(ticket.submitter_id)
  }

  const sendTicketToChat = () => {
    if (!selectedTicket || !selectedUser) return

    // Create a comprehensive ticket context message
    const ticketContext = `Analyseer dit Zendesk ticket:

**Ticket #${selectedTicket.id}: ${selectedTicket.subject}**

**Status:** ${selectedTicket.status}
**Prioriteit:** ${selectedTicket.priority || "Niet ingesteld"}
**Type:** ${selectedTicket.type || "Niet ingesteld"}
**Aangemaakt:** ${new Date(selectedTicket.created_at).toLocaleString()}
**Bijgewerkt:** ${new Date(selectedTicket.updated_at).toLocaleString()}

**Beschrijving:**
${selectedTicket.description}

**Indiener Informatie:**
- Naam: ${formatUserName(selectedUser.name)}
- Email: ${selectedUser.email}
- Gebruiker ID: ${selectedUser.id}
- Rol: ${selectedUser.role || "Niet gespecificeerd"}
- Tijdzone: ${selectedUser.time_zone || "Niet gespecificeerd"}
- Lid sinds: ${new Date(selectedUser.created_at).toLocaleDateString()}

Geef inzichten over dit ticket, stel mogelijke oplossingen voor, en identificeer patronen of problemen die aandacht nodig hebben.`

    setInput(ticketContext)
    setActiveTab("chat")
  }

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

  const getSubjectType = (subject: string) => {
    const lowerSubject = subject.toLowerCase()
    if (lowerSubject.includes("bug")) return "bug"
    if (lowerSubject.includes("vraag")) return "vraag"
    if (lowerSubject.includes("compliment")) return "compliment"
    if (lowerSubject.includes("klacht")) return "klacht"
    return "unknown"
  }

  const formatUserName = (name: string) => {
    if (name.includes(",")) {
      const [last, first] = name.split(",").map((s: string) => s.trim())
      return `${first} ${last}`
    }
    return name
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-blue-600" />
            MCP Tools Chat & Zendesk Dashboard
          </h1>
          <p className="text-gray-600">Chat met AI met MCP tools en beheer Zendesk tickets</p>

          {/* Connection Status */}
          <div className="mt-4 flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={testZendeskConnection} disabled={connectionStatus.testing}>
              {connectionStatus.testing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Zendesk Verbinding
            </Button>

            {connectionStatus.success === true && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verbonden als {connectionStatus.user?.name}
              </Badge>
            )}

            {connectionStatus.success === false && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Verbinding Mislukt
              </Badge>
            )}

            {isMocked && (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Gebruikt Mock Data
              </Badge>
            )}
          </div>

          {connectionStatus.error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{connectionStatus.error}</p>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Zendesk Tickets
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              MCP Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tickets List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Ticket className="h-4 w-4" />
                      Recente Tickets
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loadingTickets}>
                      <RefreshCw className={`h-4 w-4 ${loadingTickets ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Zoek tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchZendesk()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={searchZendesk}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ticketsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Fout</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{ticketsError}</p>
                    </div>
                  )}

                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {loadingTickets ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Geen tickets gevonden</p>
                        </div>
                      ) : (
                        tickets.map((ticket) => {
                          const subjectType = getSubjectType(ticket.subject)
                          return (
                            <div
                              key={ticket.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-blue-50 ${
                                selectedTicket?.id === ticket.id ? "bg-blue-100 border-blue-300" : "bg-white"
                              }`}
                              onClick={() => handleTicketClick(ticket)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium">#{ticket.id}</span>
                                <div className="flex gap-1">
                                  <Badge
                                    variant={
                                      subjectType === "bug"
                                        ? "destructive"
                                        : subjectType === "compliment"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {subjectType}
                                  </Badge>
                                  <Badge
                                    variant={
                                      ticket.status === "open"
                                        ? "destructive"
                                        : ticket.status === "closed"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {ticket.status}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-900 mb-2 line-clamp-2">{ticket.subject}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Ticket Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      {selectedTicket ? `Ticket #${selectedTicket.id}` : "Selecteer een Ticket"}
                    </CardTitle>
                    {selectedTicket && selectedUser && (
                      <Button onClick={sendTicketToChat} className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Analyseer met AI
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTicket ? (
                    <div className="space-y-6">
                      {/* Ticket Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{selectedTicket.subject}</h3>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge
                              variant={
                                getSubjectType(selectedTicket.subject) === "bug"
                                  ? "destructive"
                                  : getSubjectType(selectedTicket.subject) === "compliment"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {getSubjectType(selectedTicket.subject)}
                            </Badge>
                            <Badge
                              variant={
                                selectedTicket.status === "open"
                                  ? "destructive"
                                  : selectedTicket.status === "closed"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {selectedTicket.status}
                            </Badge>
                            {selectedTicket.priority && <Badge variant="outline">{selectedTicket.priority}</Badge>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Aangemaakt:</span>
                            <p>{new Date(selectedTicket.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Bijgewerkt:</span>
                            <p>{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-gray-500 block mb-2">Beschrijving:</span>
                          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                            <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Indiener Informatie
                        </h4>
                        {loadingUser ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Gebruikersinformatie laden...
                          </div>
                        ) : selectedUser ? (
                          <div className="bg-white border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <User className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-2" />
                              <div>
                                <h5 className="font-semibold text-lg">{formatUserName(selectedUser.name)}</h5>
                                <p className="text-sm text-gray-500">Gebruiker ID: {selectedUser.id}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{selectedUser.email}</span>
                              </div>
                              {selectedUser.time_zone && (
                                <div>
                                  <span className="font-medium text-gray-500">Tijdzone:</span>
                                  <span className="ml-2">{selectedUser.time_zone}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-500">Lid sinds:</span>
                                <span className="ml-2">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                              </div>
                              {selectedUser.role && (
                                <div>
                                  <span className="font-medium text-gray-500">Rol:</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {selectedUser.role}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">Kon gebruikersinformatie niet laden</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Selecteer een ticket om details te bekijken</p>
                      <p className="text-sm">
                        Klik op een ticket uit de lijst om informatie en indiener details te zien
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Configuration Panel */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    MCP Configuratie
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
                        <SelectItem value="none">Geen MCP Tools</SelectItem>
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
                        <Label htmlFor="stdio-command">Commando</Label>
                        <Input
                          id="stdio-command"
                          value={stdioCommand}
                          onChange={(e) => setStdioCommand(e.target.value)}
                          placeholder="node"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stdio-args">Zendesk MCP Server Pad</Label>
                        <Input
                          id="stdio-args"
                          value={stdioArgs}
                          onChange={(e) => setStdioArgs(e.target.value)}
                          placeholder="C:\Users\JurreB\Documents\innovation\zendesk-mcp-server\src\index.js"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={updateMcpConfig} className="w-full" size="sm">
                    Configuratie Toepassen
                  </Button>

                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">Status:</span>
                      <Badge variant={mcpConfig.type === "none" ? "secondary" : "default"}>
                        {mcpConfig.type === "none" ? "Geen MCP" : `MCP ${mcpConfig.type.toUpperCase()}`}
                      </Badge>
                    </div>
                    {mcpConfig.type !== "none" && (
                      <p className="text-xs text-gray-500">Zendesk MCP tools zijn beschikbaar voor de AI assistent</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat met Zendesk MCP
                    {error && (
                      <Badge variant="destructive" className="ml-auto">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Fout
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
                          <span className="font-medium">Fout</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">{error.message}</p>
                      </div>
                    )}

                    {messages.length === 0 && !error && (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Start een gesprek met de AI assistent</p>
                        {mcpConfig.type !== "none" && (
                          <p className="text-sm mt-2">Zendesk MCP tools zijn ingeschakeld en klaar voor gebruik</p>
                        )}
                        <div className="mt-4 text-xs text-gray-400">
                          <p>Probeer: "Analyseer de huidige tickets" of "Wat zijn de meest voorkomende problemen?"</p>
                          <p>Of selecteer een ticket en klik "Analyseer met AI" voor gedetailleerde inzichten</p>
                        </div>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900 shadow-sm border"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {message.toolInvocations && message.toolInvocations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">Gebruikte Zendesk MCP Tools:</p>
                              {message.toolInvocations.map((tool, index) => {
                                let displayContent = "No result"

                                if (tool.result) {
                                  try {
                                    if (typeof tool.result === "string") {
                                      displayContent = tool.result
                                    } else if (tool.result.content) {
                                      if (Array.isArray(tool.result.content)) {
                                        displayContent = tool.result.content
                                          .map((item: any) => item.text || item.content || JSON.stringify(item))
                                          .join(" ")
                                      } else if (typeof tool.result.content === "string") {
                                        displayContent = tool.result.content
                                      } else {
                                        displayContent = JSON.stringify(tool.result.content)
                                      }
                                    } else if (tool.result.text) {
                                      displayContent = tool.result.text
                                    } else {
                                      displayContent = JSON.stringify(tool.result)
                                    }
                                  } catch (e) {
                                    displayContent = String(tool.result)
                                  }
                                }

                                return (
                                  <div key={index} className="mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {tool.toolName}
                                      </Badge>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-md border-l-2 border-blue-200">
                                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{displayContent}</div>
                                    </div>
                                  </div>
                                )
                              })}
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
                            <span>AI analyseert met Zendesk MCP...</span>
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
                      placeholder="Vraag over tickets, analyseer patronen, of krijg inzichten..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Setup Instructies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-yellow-800">Vereiste Omgevingsvariabelen</h4>
              <p className="text-sm text-yellow-700 mb-2">
                Om de Zendesk integratie te gebruiken, voeg deze toe aan je .env.local bestand:
              </p>
              <div className="bg-yellow-100 p-2 rounded text-xs font-mono text-yellow-800">
                ZENDESK_SUBDOMAIN=jouw-subdomain
                <br />
                ZENDESK_EMAIL=jouw-email@bedrijf.com
                <br />
                ZENDESK_API_TOKEN=jouw-api-token
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-800">Zendesk MCP Server Setup</h4>
              <p className="text-sm text-blue-700 mb-2">
                Je Zendesk MCP server pad is vooraf geconfigureerd. Zorg ervoor dat:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• De MCP server draait en toegankelijk is</li>
                <li>• Node.js is geïnstalleerd en in je PATH</li>
                <li>
                  • Het server pad is correct:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    C:\Users\JurreB\Documents\innovation\zendesk-mcp-server\src\index.js
                  </code>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Functies</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Ticket Analyse:</strong> Klik "Analyseer met AI" op elk ticket voor gedetailleerde inzichten
                </li>
                <li>
                  • <strong>MCP Integratie:</strong> Gebruik je Zendesk MCP server voor geavanceerde ticket operaties
                </li>
                <li>
                  • <strong>Context-Bewuste Chat:</strong> AI heeft toegang tot ticket beschrijvingen, gebruikersinfo en
                  status
                </li>
                <li>
                  • <strong>Patroon Herkenning:</strong> Vraag de AI om trends en veelvoorkomende problemen te
                  identificeren
                </li>
                <li>
                  • <strong>Oplossing Suggesties:</strong> Krijg AI-aangedreven aanbevelingen voor ticket oplossing
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
