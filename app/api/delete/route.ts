import { qDrant } from "@/lib/qdrant"

export async function POST(request: Request) {
  const json = await request.json()
  const { userId, fileId, embeddingsProvider } = json as {
    userId: string
    fileId: string
    embeddingsProvider: string
  }
  try {
    const qclient = new qDrant()
    qclient.deleteFile(userId, fileId, embeddingsProvider)
    return new Response(JSON.stringify({}), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
