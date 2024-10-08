import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx"

export const processDocX = async (doc: Blob): Promise<FileItemChunk[]> => {
  const loader = new DocxLoader(doc)
  const docs = await loader.load()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP
  })
  const splitDocs = await splitter.splitDocuments(docs)

  let chunks: FileItemChunk[] = []

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i]
    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
      type: "docx",
      source: "",
      line_from: doc.metadata.loc.lines.from,
      line_to: doc.metadata.loc.lines.to
    })
  }

  return chunks
}
