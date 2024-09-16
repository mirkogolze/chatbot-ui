import { JSONLoader } from "langchain/document_loaders/fs/json"

export const processJSON = async (json: Blob): Promise<string> => {
  const loader = new JSONLoader(json)
  const docs = await loader.load()
  let completeText = docs.map(doc => doc.pageContent).join(" ")

  return completeText
}
