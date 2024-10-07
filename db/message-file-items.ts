import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert } from "@/supabase/types"

export const getMessageFileItemsByMessageId = async (messageId: string) => {
  const { data: messageFileItems, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      file_items!file_items_message_id_fkey (*)
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
  messageFileItems: TablesInsert<"file_items">[]
) => {
  const { data: messageFileItemsCreated, error } = await supabase
    .from("file_items")
    .insert(messageFileItems)
    .select("*")
  console.log(error);

  if (error) {
    throw new Error(error.message)
  }
  return messageFileItemsCreated
}
