import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { CSVLoader } from "langchain/document_loaders/fs/csv"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processCSV = async (csv: Blob,summerize:boolean): Promise<FileItemChunk[]> => {
  const loader = new CSVLoader(csv)
  const docs = await loader.load()
  let completeText = docs.map(doc => doc.pageContent).join("\n\n")

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: !summerize ? CHUNK_SIZE : CHUNK_SIZE*8,
    chunkOverlap: !summerize ?CHUNK_OVERLAP : CHUNK_OVERLAP*4,
    separators: ["\n\n"]
  })
  const splitDocs = await splitter.createDocuments([completeText])

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
      type: "csv",
      source: ""
    })
  }

  return chunks
}
