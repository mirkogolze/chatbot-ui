import { FileItemChunk } from "@/types"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."
import { encode } from "gpt-tokenizer"

export const chunking = async (
    text: string,
    fileExtension: string
  ): Promise<FileItemChunk[]> => {
    let splitter: RecursiveCharacterTextSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE ,
        chunkOverlap: CHUNK_OVERLAP
      });
    switch (fileExtension) {
        case "csv":
            splitter = new RecursiveCharacterTextSplitter({
                chunkSize: CHUNK_SIZE,
                chunkOverlap:  CHUNK_OVERLAP,
                separators: ["\n\n"]
              })
            break
        case "md":
            splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
                chunkSize: CHUNK_SIZE ,
                chunkOverlap: CHUNK_OVERLAP
              })
            break
    }

    const splitDocs = await splitter.createDocuments([text])

    let chunks: FileItemChunk[] = []
  
    for (let i = 0; i < splitDocs.length; i++) {
      const doc = splitDocs[i]
  
      chunks.push({
        content: doc.pageContent,
        tokens: encode(doc.pageContent).length,
        type: fileExtension,
        source: ""
      })
    }
    return chunks

}