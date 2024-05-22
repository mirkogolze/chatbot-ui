import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert } from "@/supabase/types"

export const getMessageFileItemsByMessageId = async (messageId: string) => {

  const { data: messageFileItems, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      file_items (*)
    `
    )
    .eq("id", messageId)
    .single()

  if (!messageFileItems) {
    throw new Error(error.message)
  }

  return messageFileItems
}

export const createMessageFileItems = async (
  messageFileItems: TablesInsert<"message_file_items">[]
) => {
  


  return messageFileItems
}
