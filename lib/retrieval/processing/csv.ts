import { CSVLoader } from "langchain/document_loaders/fs/csv"

export const processCSV = async (csv: Blob): Promise<string> => {
  const loader = new CSVLoader(csv)
  const docs = await loader.load()
  let completeText = docs.map(doc => doc.pageContent).join("\n\n")

  return completeText
}
