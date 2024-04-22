import { ChatbotUIContext } from "@/context/context"
import { FC, useContext } from "react"
import { AssistantPicker } from "./assistant-picker"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { FilePicker } from "./file-picker"
import { PromptPicker } from "./prompt-picker"
import { ToolPicker } from "./tool-picker"
import { VectorPicker } from "./vector-picker"

interface ChatCommandInputProps {}

export const ChatCommandInput: FC<ChatCommandInputProps> = ({}) => {
  const {
    newMessageFiles,
    chatFiles,
    newMessageVectors,
    chatVectors,
    slashCommand,
    isFilePickerOpen,
    setIsFilePickerOpen,
    isVectorPickerOpen,
    setIsVectorPickerOpen,
    dollorCommand,
    hashtagCommand,
    focusPrompt,
    focusFile,
    focusVector
  } = useContext(ChatbotUIContext)

  const { handleSelectUserFile, handleSelectUserCollection, hadleSelectVectors } =
    usePromptAndCommand()
  return (
    <>
      <PromptPicker />

      <FilePicker
        isOpen={isFilePickerOpen}
        searchQuery={hashtagCommand}
        onOpenChange={setIsFilePickerOpen}
        selectedFileIds={[...newMessageFiles, ...chatFiles].map(
          file => file.id
        )}
        selectedCollectionIds={[]}
        onSelectFile={handleSelectUserFile}
        onSelectCollection={handleSelectUserCollection}
        isFocused={focusFile}
      />
      <ToolPicker />

      <AssistantPicker />

      <VectorPicker isOpen={isVectorPickerOpen} 
      searchQuery={dollorCommand}
      onOpenChange={setIsVectorPickerOpen}
      selectedVectorIds={[...newMessageVectors, ...chatVectors].map(
        vector => vector.id
      )}
      onSelectVector={hadleSelectVectors}
      isFocused={focusVector}
      />
    </>
  )
}
