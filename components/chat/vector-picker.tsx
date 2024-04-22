import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { IconBooks } from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef } from "react"
import { FileIcon } from "../ui/file-icon"

interface VectorPickerProps {
  isOpen: boolean
  searchQuery: string
  onOpenChange: (isOpen: boolean) => void
  selectedVectorIds: string[]
  onSelectVector: (file: Tables<"vectors">) => void
  isFocused: boolean
}

export const VectorPicker: FC<VectorPickerProps> = ({
  isOpen,
  searchQuery,
  onOpenChange,
  selectedVectorIds,
  onSelectVector,
  isFocused
}) => {
  const { vectors, setIsVectorPickerOpen } = useContext(ChatbotUIContext)

  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (isFocused && itemsRef.current[0]) {
      itemsRef.current[0].focus()
    }
  }, [isFocused])

  const filteredVectors = vectors.filter(
    vector =>
      vector.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedVectorIds.includes(vector.id)
  )

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
  }

  const handleSelectVector = (vector: Tables<"vectors">) => {
    onSelectVector(vector)
    handleOpenChange(false)
  }

  const getKeyDownHandler =
    (index: number, type: "vector", item: any) =>
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setIsVectorPickerOpen(false)
      } else if (e.key === "Backspace") {
        e.preventDefault()
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleSelectVector(item)
      } else if (
        (e.key === "Tab" || e.key === "ArrowDown") &&
        !e.shiftKey &&
        index === filteredVectors.length
      ) {
        e.preventDefault()
        itemsRef.current[0]?.focus()
      } else if (e.key === "ArrowUp" && !e.shiftKey && index === 0) {
        // go to last element if arrow up is pressed on first element
        e.preventDefault()
        itemsRef.current[itemsRef.current.length - 1]?.focus()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prevIndex =
          index - 1 >= 0 ? index - 1 : itemsRef.current.length - 1
        itemsRef.current[prevIndex]?.focus()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        const nextIndex = index + 1 < itemsRef.current.length ? index + 1 : 0
        itemsRef.current[nextIndex]?.focus()
      }
    }

  return (
    <>
      {isOpen && (
        <div className="bg-background flex flex-col space-y-1 rounded-xl border-2 p-2 text-sm">
          {filteredVectors.length === 0 ? (
            <div className="text-md flex h-14 cursor-pointer items-center justify-center italic hover:opacity-50">
              No matching Vectors.
            </div>
          ) : (
            <>
              {[...filteredVectors].map((item, index) => (
                <div
                  key={item.id}
                  ref={ref => {
                    itemsRef.current[index] = ref
                  }}
                  tabIndex={0}
                  className="hover:bg-accent focus:bg-accent flex cursor-pointer items-center rounded p-2 focus:outline-none"
                  onClick={() => {
                    handleSelectVector(item as Tables<"vectors">)
                  }}
                  onKeyDown={e => getKeyDownHandler(index, "vector", item)(e)}
                >
                  {"type" in item ? (
                    <FileIcon type={(item as Tables<"files">).type} size={32} />
                  ) : (
                    <IconBooks size={32} />
                  )}

                  <div className="ml-3 flex flex-col">
                    <div className="font-bold">{item.name}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  )
}
