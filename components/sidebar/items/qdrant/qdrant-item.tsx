import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tables } from "@/supabase/types"
import { CollectionFile } from "@/types"
import { IconBooks } from "@tabler/icons-react"
import { FC, useState } from "react"
import { SidebarItem } from "../all/sidebar-display-item"

interface QdrantItemProps {
  vectors: Tables<"vectors">
}

export const QdrantItem: FC<QdrantItemProps> = ({ vectors }) => {
  const [name, setName] = useState(vectors.name)
  const [isTyping, setIsTyping] = useState(false)

  const handleFileSelect = (
    file: CollectionFile,
    setSelectedCollectionFiles: React.Dispatch<
      React.SetStateAction<CollectionFile[]>
    >
  ) => {
    setSelectedCollectionFiles(prevState => {
      const isFileAlreadySelected = prevState.find(
        selectedFile => selectedFile.id === file.id
      )

      if (isFileAlreadySelected) {
        return prevState.filter(selectedFile => selectedFile.id !== file.id)
      } else {
        return [...prevState, file]
      }
    })
  }

  return (
    <SidebarItem
      item={vectors}
      isTyping={isTyping}
      contentType="vectors"
      icon={<IconBooks size={30} />}
      updateState={{
        name
      }}
      renderInputs={(renderState: {}) => {
        return (
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
        )
      }}
    />
  )
}
