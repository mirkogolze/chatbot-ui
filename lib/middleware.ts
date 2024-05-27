import { NextRequest, NextResponse } from "next/server"
import * as winston from "winston"

const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" })
  ]
})

interface ErrorData {
  error: any
  requestBody: NextRequest
  location: string
}

export function withErrorHandler(
  fn: (request: NextRequest, ...args: any[]) => Promise<any>
) {
  return async function (request: NextRequest, ...args: any[]): Promise<any> {
    const body = await request.json()
    try {
      return await fn(body, ...args)
    } catch (error: any) {
      // Log the error to a logging system
      logError({ error, requestBody: body, location: fn.name } as ErrorData)

      // Respond with a generic 500 Internal Server Error
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    }
  }
}

async function logError(data: ErrorData) {
  // const body = await  data.requestBody.json();
  logger.error(
    `Error stack: ${data.error.stack}, Request Body: ${JSON.stringify(data.requestBody)}, Location: ${data.location}`
  )
}
