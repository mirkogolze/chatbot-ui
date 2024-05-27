import { Tables } from "@/supabase/types"
import { ChatPayload, MessageImage } from "@/types"
import { encode } from "gpt-tokenizer"
import { franc } from "franc-min"

interface langDefintion {
  BEGIN_SOURCE: string
  END_SOURCE: string
  SOURCE_INSTRUCT: string
  SOURCE_LINK: string
  SOURCE_TOKEN: number
  ROLE: string
  ROLE_TEXT: string
  TODAY: string
  USER_INFO: string
  SYSTEM_INSTRUCT: string
  USER_INSTRUCT: string
}

const languageCache = new Map<string, string>()

const sourcesMAP = new Map<string, langDefintion>()
sourcesMAP.set("deu", {
  ROLE: "INJIZIERE ROLLE",
  BEGIN_SOURCE: "BEGIN DOKUMENT",
  END_SOURCE: "ENDE DOKUMENT",
  SOURCE_TOKEN: 12,
  SOURCE_LINK: "QUELLE",
  SOURCE_INSTRUCT: `Verwende die folgenden Quellen, um die Frage des Benutzers zu beantworten. Wenn du die Antwort aus den Quellen nicht beantworten kannst, 
    sage: "Ich weiß es nicht."\nJedes Dokument kann eine <QUELLE> enthalten. Gib je einen Link auf die von dir verwendete Quelle zurück. 
    Achte jedoch darauf, jede Quelle nur EINMAL aufzuzählen! Liste die Quellen als Markdown-Liste auf.`,
  TODAY: "Heute ist der",
  ROLE_TEXT: "Du bist keine KI. Du bist",
  USER_INFO: "Nutzer Information",
  SYSTEM_INSTRUCT: "System Anweisungen",
  USER_INSTRUCT: "Nutzer Anweisungen"
})
sourcesMAP.set("eng", {
  ROLE: "INJECT ROLE",
  BEGIN_SOURCE: "BEGIN SOURCE",
  END_SOURCE: "END SOURCE",
  SOURCE_TOKEN: 10,
  SOURCE_LINK: "SOURCE_HREF",
  SOURCE_INSTRUCT: `You may use the following sources if needed to answer the user's question. If you don't know the answer, say "I don't know.`,
  TODAY: "Today is",
  ROLE_TEXT: "You are not an AI. You are",
  USER_INFO: "User Info",
  SYSTEM_INSTRUCT: "System Instructions",
  USER_INSTRUCT: "Nutzer Anweisungen"
})

const buildBasePrompt = (
  prompt: string,
  profileContext: string,
  workspaceInstructions: string,
  assistant: Tables<"assistants"> | null
): [string, string] => {
  let language = "eng"
  const cachedLang = languageCache.get(prompt)
  language = cachedLang ? cachedLang : franc(prompt)
  languageCache.set(prompt, language)

  if (language != "deu") {
    language = "eng"
  }

  let fullPrompt = ""

  const mapping = sourcesMAP.get(language)
  if (assistant) {
    fullPrompt += `<${mapping?.ROLE}>\n${mapping?.ROLE_TEXT} ${assistant.name}.\n</${mapping?.ROLE}>\n\n`
  }

  fullPrompt += `${mapping?.TODAY} ${new Date().toLocaleDateString()}.\n\n`

  if (profileContext) {
    fullPrompt += `${mapping?.USER_INFO}:\n${profileContext}\n\n`
  }

  if (workspaceInstructions) {
    fullPrompt += `${mapping?.SYSTEM_INSTRUCT}:\n${workspaceInstructions}\n\n`
  }

  fullPrompt += `${mapping?.USER_INSTRUCT}:\n${prompt}`

  return [fullPrompt, language]
}

export async function buildFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  chatImages: MessageImage[],
  isRegeneration: boolean
) {
  const {
    chatSettings,
    workspaceInstructions,
    chatMessages,
    assistant,
    messageFileItems,
    chatFileItems
  } = payload
  const chatMessageRetrieve = isRegeneration
    ? [...chatMessages].slice(0, -1)
    : [...chatMessages]
  const [BUILT_PROMPT, language] = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || "" : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )
  const BUILD_PROMPT_TOKENS = encode(BUILT_PROMPT).length
  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS - BUILD_PROMPT_TOKENS
  const processedChatMessages = chatMessageRetrieve.map(
    (chatMessage, index) => {
      const nextChatMessage = chatMessageRetrieve[index + 1]
      if (nextChatMessage === undefined) {
        return chatMessage
      }

      const nextChatMessageFileItems = nextChatMessage.fileItems

      if (nextChatMessageFileItems.length > 0) {
        const findFileItems = nextChatMessageFileItems
          .map(fileItemId =>
            chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId)
          )
          .filter(item => item !== undefined) as Tables<"file_items">[]

        const [retrievalText, totalTokens] = buildRetrievalText(
          findFileItems,
          remainingTokens,
          language
        )
        return {
          message: {
            ...chatMessage.message,
            content:
              `${chatMessage.message.content}\n\n${retrievalText}` as string
          },
          fileItems: []
        }
      }

      return chatMessage
    }
  )

  let finalMessages = []

  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: processedChatMessages.length + "",
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: processedChatMessages.length,
    updated_at: "",
    user_id: ""
  }
  let additionalText = ""

  if (messageFileItems.length > 0) {
    const [retrievalText, totalTokens] = buildRetrievalText(
      messageFileItems,
      remainingTokens,
      language
    )
    remainingTokens = remainingTokens - totalTokens
    additionalText = retrievalText
  }

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  finalMessages.unshift(tempSystemMessage)

  finalMessages = finalMessages.map(message => {
    let content

    if (message.image_paths.length > 0) {
      content = [
        {
          type: "text",
          text: message.content
        },
        ...message.image_paths.map(path => {
          let formedUrl = ""

          if (path.startsWith("data")) {
            formedUrl = path
          } else {
            const chatImage = chatImages.find(image => image.path === path)

            if (chatImage) {
              formedUrl = chatImage.base64
            }
          }

          return {
            type: "image_url",
            image_url: {
              url: formedUrl
            }
          }
        })
      ]
    } else {
      content = message.content
    }

    return {
      role: message.role,
      content
    }
  })
  if (additionalText.length != 0) {
    finalMessages[finalMessages.length - 1] = {
      ...finalMessages[finalMessages.length - 1],
      content: `${
        finalMessages[finalMessages.length - 1].content
      }\n\n${additionalText}`
    }
  }

  return finalMessages
}

function buildRetrievalText(
  fileItems: Tables<"file_items">[],
  remainingTokens: number,
  language: string
): [string, number] {
  const retrievalText: string[] = []
  let totalTokens: number = 0
  const mapping = sourcesMAP.get(language)
  for (let item of fileItems) {
    const extraTokens = mapping?.SOURCE_TOKEN || 10
    const beginSource = mapping?.BEGIN_SOURCE || "BEGIN SOURCE"
    const endSource = mapping?.END_SOURCE || "END SOURCE"
    const soureceLink = mapping?.SOURCE_LINK || "SOURCE_LINK"
    if (remainingTokens < totalTokens + item.tokens + extraTokens) {
      break
    }
    totalTokens += item.tokens + extraTokens
    let source = ""
    if (item.source) {
      source = `\n<${soureceLink}>${item.source}</${soureceLink}>`
      totalTokens += encode(item.source).length + 10
    }

    retrievalText.push(
      `<${beginSource}>\n${item.content}\n${source}</${endSource}>`
    )
  }

  return [
    `${mapping?.SOURCE_INSTRUCT}\n\n${retrievalText.join("\n\n")}`,
    totalTokens
  ]
}

export async function buildGoogleGeminiFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  messageImageFiles: MessageImage[]
) {
  const { chatSettings, workspaceInstructions, chatMessages, assistant } =
    payload

  const [BUILT_PROMPT, language] = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || "" : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )

  let finalMessages = []

  let usedTokens = 0
  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length
  let REMAINING_TOKENS = CHUNK_SIZE - PROMPT_TOKENS

  usedTokens += PROMPT_TOKENS

  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const message = chatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= REMAINING_TOKENS) {
      REMAINING_TOKENS -= messageTokens
      usedTokens += messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: chatMessages.length + "",
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: chatMessages.length,
    updated_at: "",
    user_id: ""
  }

  finalMessages.unshift(tempSystemMessage)

  let GOOGLE_FORMATTED_MESSAGES = []

  if (chatSettings.model === "gemini-pro") {
    GOOGLE_FORMATTED_MESSAGES = [
      {
        role: "user",
        parts: finalMessages[0].content
      },
      {
        role: "model",
        parts: "I will follow your instructions."
      }
    ]

    for (let i = 1; i < finalMessages.length; i++) {
      GOOGLE_FORMATTED_MESSAGES.push({
        role: finalMessages[i].role === "user" ? "user" : "model",
        parts: finalMessages[i].content as string
      })
    }

    return GOOGLE_FORMATTED_MESSAGES
  } else if ((chatSettings.model = "gemini-pro-vision")) {
    // Gemini Pro Vision doesn't currently support messages
    async function fileToGenerativePart(file: File) {
      const base64EncodedDataPromise = new Promise(resolve => {
        const reader = new FileReader()

        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result.split(",")[1])
          }
        }

        reader.readAsDataURL(file)
      })

      return {
        inlineData: {
          data: await base64EncodedDataPromise,
          mimeType: file.type
        }
      }
    }

    let prompt = ""

    for (let i = 0; i < finalMessages.length; i++) {
      prompt += `${finalMessages[i].role}:\n${finalMessages[i].content}\n\n`
    }

    const files = messageImageFiles.map(file => file.file)
    const imageParts = await Promise.all(
      files.map(file =>
        file ? fileToGenerativePart(file) : Promise.resolve(null)
      )
    )

    // FIX: Hacky until chat messages are supported
    return [
      {
        prompt,
        imageParts
      }
    ]
  }

  return finalMessages
}
