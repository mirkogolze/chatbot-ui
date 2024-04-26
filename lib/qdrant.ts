import { v4 as uuidv4 } from "uuid"
import { QdrantClient } from "@qdrant/js-client-rest"
import { FileItemChunk } from "@/types"

export interface FileItem {
  id: string
  vector: number[]
  payload: {
    file_id: string
    tokens: any // or replace 'any' with the appropriate type
    content: any // or replace 'any' with the appropriate type
    source: any
    type: any
  }
}
export interface SearchResult {
  id: string | number
  file_id: any
  content: any
  tokens: any // I assumed it could be an array of any type
  source: any
  type: any
  similarity: number
}

export class qDrant {
  public qclient: QdrantClient

  constructor() {
    this.qclient = new QdrantClient({
      url: process.env.QDRANT_URL!
    })
  }
  public async addEmbeddings(
    user_id: string,
    embeddings: number[][],
    file_id: string,
    chunks: FileItemChunk[],
    embeddingsProvider: string
  ): Promise<FileItem[]> {
    try {
      await this.qclient.getCollection(user_id + embeddingsProvider)
    } catch {
      await this.qclient.createCollection(user_id + embeddingsProvider, {
        vectors: { size: embeddings[0].length, distance: "Cosine" }
      })
    }
    const file_items = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: embeddings[index],
      payload: {
        file_id: file_id,
        tokens: chunk.tokens,
        content: chunk.content,
        type: chunk.type,
        source: chunk.source
      }
    }))
    this.qclient.upsert(user_id + embeddingsProvider, {
      wait: true,
      points: file_items
    })
    return file_items
  }
  public async searchEmbeddings(
    uniqueFileIds: string[],
    uniqueVectorNames: string[],
    user_id: string,
    localEmbedding: number[],
    embeddingsProvider: string
  ): Promise<SearchResult[]> {
    let result: any[] = []
    if (uniqueFileIds.length != 0) {
      const should = uniqueFileIds.map((x, index) => ({
        key: "file_id",
        match: { value: x }
      }))
      result = await this.qclient.search(user_id + embeddingsProvider, {
        vector: localEmbedding,
        filter: {
          should: should
        },
        with_payload: true,
        limit: 100
      })
    }

    for (const collection_name of uniqueVectorNames) {
      result = [
        ...result,
        ...(await this.qclient.search(collection_name, {
          vector: localEmbedding,
          with_payload: true,
          limit: 100
        }))
      ]
    }
    const ret = result.map((tmpDct, index) => ({
      id: tmpDct.id,
      file_id: "",
      content: tmpDct?.payload?.content,
      tokens: tmpDct?.payload?.tokens,
      similarity: tmpDct.score
    }))
    return ret
  }
  public async deleteFile(
    user_id: string,
    fileId: string,
    embeddingsProvider: string
  ) {
    this.qclient.delete(user_id + embeddingsProvider, {
      filter: {
        must: [
          {
            key: "file_id",
            match: {
              value: fileId
            }
          }
        ]
      }
    })
  }
}

export const qclient = new qDrant()
