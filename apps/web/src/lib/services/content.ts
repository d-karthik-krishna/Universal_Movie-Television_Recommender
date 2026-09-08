import { api } from '../api'

export interface ContentItem {
  id: string | number
  content_type: 'movie' | 'tv'
  title: string
  name?: string
  original_title?: string
  overview?: string
  release_date?: string
  first_air_date?: string
  popularity?: number
  vote_average?: number
  vote_count?: number
  poster_path?: string
  backdrop_path?: string
  original_language?: string
  media_type?: string
  genre_ids?: number[]
}

export interface ContentResponse {
  results: ContentItem[]
  total_results: number
}

export interface ContentDetail {
  id: number
  title?: string
  name?: string
  overview?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  poster_path?: string
  backdrop_path?: string
  original_language?: string
  runtime?: number
  number_of_seasons?: number
  seasons?: Season[]
  genres?: { id: number; name: string }[]
  tagline?: string
  status?: string
  credits: { cast: CastMember[] }
  trailers: Trailer[]
  similar: ContentItem[]
}

export interface Season {
  id: number
  name: string
  episode_count: number
  season_number: number
  poster_path: string | null
  air_date: string | null
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Trailer {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export async function getTrendingContent(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day'): Promise<ContentResponse> {
  return api.get<ContentResponse>(`/api/v1/content/trending?media_type=${mediaType}&time_window=${timeWindow}`)
}

export async function discoverContent(
  mediaType: 'movie' | 'tv' = 'movie',
  filters: { with_original_language?: string; with_genres?: string; sort_by?: string; page?: number; vote_count_gte?: number } = {}
): Promise<ContentResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('media_type', mediaType)
  
  if (filters.with_original_language) queryParams.append('with_original_language', filters.with_original_language)
  if (filters.with_genres) queryParams.append('with_genres', filters.with_genres)
  if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
  if (filters.page) queryParams.append('page', String(filters.page))
  if (filters.vote_count_gte) queryParams.append('vote_count_gte', String(filters.vote_count_gte))

  return api.get<ContentResponse>(`/api/v1/content/discover?${queryParams.toString()}`)
}

export async function getContentDetail(mediaType: string, tmdbId: number): Promise<ContentDetail> {
  return api.get<ContentDetail>(`/api/v1/content/${mediaType}/${tmdbId}`)
}

export async function searchContent(query: string, page: number = 1): Promise<any> {
  return api.get(`/api/v1/content/search?q=${encodeURIComponent(query)}&page=${page}`)
}

