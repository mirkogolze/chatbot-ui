import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { JSONLoader } from "langchain/document_loaders/fs/json"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processJSON = async (
  json: Blob,
  summerize: boolean
): Promise<FileItemChunk[]> => {
  const loader = new JSONLoader(json)
  const docs = await loader.load()
  let completeText = docs.map(doc => doc.pageContent).join(" ")

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: !summerize ? CHUNK_SIZE : CHUNK_SIZE * 8,
    chunkOverlap: !summerize ? CHUNK_OVERLAP : CHUNK_OVERLAP * 4
  })
  const splitDocs = await splitter.createDocuments([completeText])

  let chunks: FileItemChunk[] = []

  splitDocs.forEach(doc => {
    const docTokens = encode(doc.pageContent).length
  })

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
      type: "json",
      source: ""
    })
  }

  return chunks
}
