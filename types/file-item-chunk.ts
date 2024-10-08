export type FileItemChunk = {
  content: string
  tokens: number
  source?: string
  type?: string
  page_number?: number
  line_from: number
  line_to: number
}
