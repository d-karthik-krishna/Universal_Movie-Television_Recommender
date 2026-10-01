import { API_URL } from './constants'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async fetchWithLogging<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
    console.log(`[API REQUEST] ${method} ${url}`, data ? { payload: data } : '')
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      })

      const status = response.status
      let json
      const text = await response.text()
      try {
        json = text ? JSON.parse(text) : {}
      } catch (e) {
        json = { rawText: text }
      }

      console.log(`[API RESPONSE] ${method} ${url} -> ${status}`, json)

      if (!response.ok) {
        throw new Error(`API error: ${status} ${response.statusText} | ${JSON.stringify(json)}`)
      }

      return json as T
    } catch (err: any) {
      console.error(`[API FATAL] ${method} ${url} failed!`, err.message, err.stack)
      throw err
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.fetchWithLogging<T>('GET', endpoint)
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetchWithLogging<T>('POST', endpoint, data)
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetchWithLogging<T>('PUT', endpoint, data)
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithLogging<T>('DELETE', endpoint)
  }
}

export const api = new ApiClient(API_URL)
