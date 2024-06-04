import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processMarkdown = async (
  markdown: Blob,
  summerize:boolean
): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await markdown.arrayBuffer())
  const textDecoder = new TextDecoder("utf-8")
  const textContent = textDecoder.decode(fileBuffer)

  const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: !summerize ? CHUNK_SIZE : CHUNK_SIZE*8,
    chunkOverlap: !summerize ?CHUNK_OVERLAP : CHUNK_OVERLAP*4,
  })

  const splitDocs = await splitter.createDocuments([textContent])

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
      type: "md",
      source: ""
    })
  }

  return chunks
}
