import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processPdf = async (pdf: Blob): Promise<FileItemChunk[]> => {
  const loader = new PDFLoader(pdf)
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
      type: "pdf",
      source: "",
      page_number: doc.metadata.loc.pageNumber,
      line_from: doc.metadata.loc.lines.from,
      line_to: doc.metadata.loc.lines.to
    })
  }

  return chunks
}
