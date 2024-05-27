import { qDrant } from "@/lib/qdrant"
import { withErrorHandler } from "@/lib/middleware"

export const POST = withErrorHandler(async (json: any) => {
  const { userId, fileId, embeddingsProvider } = json as {
    userId: string
    fileId: string
    embeddingsProvider: string
  }

  const qclient = new qDrant()
  qclient.deleteFile(userId, fileId, embeddingsProvider)
  return new Response(JSON.stringify({}), {
    status: 200
  })
})
