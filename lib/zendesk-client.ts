import axios from "axios"

class ZendeskClient {
  private _credentials: any = null

  constructor() {
    // Don't load credentials in constructor - load them lazily
  }

  getCredentials() {
    if (!this._credentials) {
      this._credentials = {
        subdomain: process.env.ZENDESK_SUBDOMAIN,
        email: process.env.ZENDESK_EMAIL,
        apiToken: process.env.ZENDESK_API_TOKEN,
      }
      if (!this._credentials.subdomain || !this._credentials.email || !this._credentials.apiToken) {
        console.warn(
          "Zendesk credentials not found in environment variables. Please set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN.",
        )
      }
    }
    return this._credentials
  }

  getBaseUrl() {
    const { subdomain } = this.getCredentials()
    return `https://${subdomain}.zendesk.com/api/v2`
  }

  getAuthHeader() {
    const { email, apiToken } = this.getCredentials()
    const auth = Buffer.from(`${email}/token:${apiToken}`).toString("base64")
    return `Basic ${auth}`
  }

  async request(method: string, endpoint: string, data: any = null, params: any = null) {
    try {
      const { subdomain, email, apiToken } = this.getCredentials()
      if (!subdomain || !email || !apiToken) {
        throw new Error("Zendesk credentials not configured. Please set environment variables.")
      }

      const url = `${this.getBaseUrl()}${endpoint}`
      const headers = {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
      }

      const response = await axios({
        method,
        url,
        headers,
        data,
        params,
      })

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Zendesk API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw error
    }
  }

  // Tickets
  async listTickets(params?: any) {
    return this.request("GET", "/tickets.json", null, params)
  }

  async getTicket(id: number) {
    return this.request("GET", `/tickets/${id}.json`)
  }

  async createTicket(data: any) {
    return this.request("POST", "/tickets.json", { ticket: data })
  }

  async updateTicket(id: number, data: any) {
    return this.request("PUT", `/tickets/${id}.json`, {
      ticket: data,
      public: false,
    })
  }

  async deleteTicket(id: number) {
    return this.request("DELETE", `/tickets/${id}.json`)
  }

  // Users
  async listUsers(params?: any) {
    return this.request("GET", "/users.json", null, params)
  }

  async getUser(id: number) {
    return this.request("GET", `/users/${id}.json`)
  }

  async createUser(data: any) {
    return this.request("POST", "/users.json", { user: data })
  }

  async updateUser(id: number, data: any) {
    return this.request("PUT", `/users/${id}.json`, { user: data })
  }

  async deleteUser(id: number) {
    return this.request("DELETE", `/users/${id}.json`)
  }

  // Organizations
  async listOrganizations(params?: any) {
    return this.request("GET", "/organizations.json", null, params)
  }

  async getOrganization(id: number) {
    return this.request("GET", `/organizations/${id}.json`)
  }

  async createOrganization(data: any) {
    return this.request("POST", "/organizations.json", { organization: data })
  }

  async updateOrganization(id: number, data: any) {
    return this.request("PUT", `/organizations/${id}.json`, {
      organization: data,
    })
  }

  async deleteOrganization(id: number) {
    return this.request("DELETE", `/organizations/${id}.json`)
  }

  // Groups
  async listGroups(params?: any) {
    return this.request("GET", "/groups.json", null, params)
  }

  async getGroup(id: number) {
    return this.request("GET", `/groups/${id}.json`)
  }

  async createGroup(data: any) {
    return this.request("POST", "/groups.json", { group: data })
  }

  async updateGroup(id: number, data: any) {
    return this.request("PUT", `/groups/${id}.json`, { group: data })
  }

  async deleteGroup(id: number) {
    return this.request("DELETE", `/groups/${id}.json`)
  }

  // Search
  async search(query: string, params: any = {}) {
    return this.request("GET", "/search.json", null, { query, ...params })
  }

  // Test connection
  async testConnection() {
    try {
      const { subdomain, email, apiToken } = this.getCredentials()
      if (!subdomain || !email || !apiToken) {
        throw new Error(
          "Zendesk credentials not configured. Please set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN environment variables.",
        )
      }

      console.log(`Testing connection to ${subdomain}.zendesk.com...`)
      // Test connection by fetching current user info
      const response = await this.request("GET", "/users/me.json")
      if (response && response.user) {
        console.log(`✓ Successfully connected to Zendesk as ${response.user.name} (${response.user.email})`)
        return { success: true, user: response.user }
      } else {
        throw new Error("Unexpected response from Zendesk API")
      }
    } catch (error: any) {
      console.error(`✗ Failed to connect to Zendesk: ${error.message}`)
      throw error
    }
  }
}

export const zendeskClient = new ZendeskClient()
