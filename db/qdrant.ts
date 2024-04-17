import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getQdrantById = async (qdrantId: string) => {
  const { data: qdrant, error } = await supabase
    .from("vectors")
    .select("*")
    .eq("id", qdrantId)
    .single()

  if (!qdrant) {
    throw new Error(error.message)
  }

  return qdrant
}

export const getQdrantWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      vectors (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getQdrantWorkspacesByQdrantId = async (qdrantId: string) => {
  const { data: qdrant, error } = await supabase
    .from("vectors")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", qdrantId)
    .single()

  if (!qdrant) {
    throw new Error(error.message)
  }

  return qdrant
}

export const createQdrant = async (
  qdrant: TablesInsert<"vectors">,
  workspace_id: string
) => {
  const { data: createdQdrant, error } = await supabase
    .from("vectors")
    .insert([qdrant])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createQdrantWorkspace({
    user_id: createdQdrant.user_id,
    qdrant_id: createdQdrant.id,
    workspace_id
  })

  return createdQdrant
}

export const createQdrants = async (
  qdrant: TablesInsert<"vectors">[],
  workspace_id: string
) => {
  const { data: createdQdrant, error } = await supabase
    .from("vectors")
    .insert(qdrant)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createQdrantWorkspaces(
    createdQdrant.map(qdrant => ({
      user_id: qdrant.user_id,
      qdrant_id: qdrant.id,
      workspace_id
    }))
  )

  return createdQdrant
}

export const createQdrantWorkspace = async (item: {
  user_id: string
  qdrant_id: string
  workspace_id: string
}) => {
  const { data: createdQdrantWorkspace, error } = await supabase
    .from("vector_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdQdrantWorkspace
}

export const createQdrantWorkspaces = async (
  items: { user_id: string; qdrant_id: string; workspace_id: string }[]
) => {
  const { data: createdQdrantWorkspaces, error } = await supabase
    .from("vector_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdQdrantWorkspaces
}

export const updateQdrant = async (
  qdrantId: string,
  qdrant: TablesUpdate<"vectors">
) => {
  const { data: updatedQdrant, error } = await supabase
    .from("vectors")
    .update(qdrant)
    .eq("id", qdrantId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedQdrant
}

export const deleteQdrant = async (qdrantId: string) => {
  const { error } = await supabase.from("vectors").delete().eq("id", qdrantId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteQdrantWorkspace = async (
  qdrantId: string,
  workspaceId: string
) => {
  const { error } = await supabase
    .from("vector_workspaces")
    .delete()
    .eq("qdrant_id", qdrantId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
