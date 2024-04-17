import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { TablesInsert } from "@/supabase/types"
import { FC, useContext, useState } from "react"

interface CreateCollectionProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateQdrant: FC<CreateCollectionProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  if (!profile) return null
  if (!selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="vectors"
      createState={
        {
          user_id: profile.user_id,
          name: name
        } as TablesInsert<"vectors">
      }
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Name</Label>

            <Input
              placeholder="Qdrant Collection name..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </>
      )}
    />
  )
}
