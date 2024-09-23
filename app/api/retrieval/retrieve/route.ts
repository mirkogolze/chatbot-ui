import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

import { qDrant } from "@/lib/qdrant"
import { withErrorHandler } from "@/lib/middleware"

export const POST = withErrorHandler(async (json: any) => {
  // const json = await request.json()
  const { userInput, fileIds, vectorNames, embeddingsProvider, sourceCount } =
    json as {
      userInput: string
      fileIds: string[]
      vectorNames: string[]
      embeddingsProvider:
        | "openai"
        | "local"
        | "multilingual-e5-large"
      sourceCount: number
    }
  // throw Error("BLA BLA");
  const uniqueFileIds = [...new Set(fileIds)]
  const uniqueVectorNames = [...new Set(vectorNames)]
  // try {
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const profile = await getServerProfile()

  if (embeddingsProvider === "openai") {
    if (profile.use_azure_openai) {
      checkApiKey(profile.azure_openai_api_key, "Azure OpenAI")
    } else {
      checkApiKey(profile.openai_api_key, "OpenAI")
    }
  }

  let chunks: any[] = []

  let openai
  if (profile.use_azure_openai) {
    openai = new OpenAI({
      apiKey: profile.azure_openai_api_key || "",
      baseURL: `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`,
      defaultQuery: { "api-version": "2023-12-01-preview" },
      defaultHeaders: { "api-key": profile.azure_openai_api_key }
    })
  } else {
    openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })
  }

  if (embeddingsProvider === "openai") {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userInput
    })
    const openaiEmbedding = response.data.map(item => item.embedding)[0]
    if (process.env.EMBEDDING_STORAGE == "qdrant") {
      const qclient = new qDrant()
      chunks = await qclient.searchEmbeddings(
        uniqueFileIds,
        uniqueVectorNames,
        profile.user_id,
        openaiEmbedding,
        embeddingsProvider
      )
    } else {
      const { data: openaiFileItems, error: openaiError } =
        await supabaseAdmin.rpc("match_file_items_openai", {
          query_embedding: openaiEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueFileIds
        })

      if (openaiError) {
        throw openaiError
      }
      chunks = openaiFileItems
    }
  } else if (embeddingsProvider === "local") {
    const localEmbedding = await generateLocalEmbedding(userInput)

    if (process.env.EMBEDDING_STORAGE == "qdrant") {
      const qclient = new qDrant()
      chunks = await qclient.searchEmbeddings(
        uniqueFileIds,
        uniqueVectorNames,
        profile.user_id,
        localEmbedding,
        embeddingsProvider
      )
    } else {
      const { data: localFileItems, error: localFileItemsError } =
        await supabaseAdmin.rpc("match_file_items_local", {
          query_embedding: localEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueFileIds
        })

      if (localFileItemsError) {
        throw localFileItemsError
      }
      chunks = localFileItems
    }
  } else if (
    embeddingsProvider === "multilingual-e5-large" 
  ) {
    const customOpenai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: "DUMMY"
    })
    const response = await customOpenai.embeddings.create({
      model: embeddingsProvider,
      input: userInput
    })

    const openaiEmbedding = response.data.map(item => item.embedding)[0]
    if (process.env.EMBEDDING_STORAGE == "qdrant") {
      const qclient = new qDrant()
      chunks = await qclient.searchEmbeddings(
        uniqueFileIds,
        uniqueVectorNames,
        profile.user_id,
        openaiEmbedding,
        embeddingsProvider
      )
    } else {
      const { data: openaiFileItems, error: openaiError } =
        await supabaseAdmin.rpc("match_file_items_openai", {
          query_embedding: openaiEmbedding as any,
          match_count: sourceCount,
          file_ids: uniqueFileIds
        })
      if (openaiError) {
        throw openaiError
      }
      chunks = openaiFileItems
    }
  }

  const mostSimilarChunks = chunks?.sort((a, b) => b.similarity - a.similarity)

  return new Response(JSON.stringify({ results: mostSimilarChunks }), {
    status: 200
  })
  //} catch (error: any) {
  //  const errorMessage = error.error?.message || "An unexpected error occurred"
  //  const errorCode = error.status || 500
  //return new Response(JSON.stringify({ message: errorMessage }), {
  //  status: errorCode
  //})
  //  console.error(error);
  //  return new Response(JSON.stringify({ message: errorMessage }), {
  //     status: errorCode
  //    })
  //}
})
