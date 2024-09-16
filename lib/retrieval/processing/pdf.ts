import { PDFLoader } from "langchain/document_loaders/fs/pdf"

export const processPdf = async (
  pdf: Blob
): Promise<string> => {
  const loader = new PDFLoader(pdf)
  const docs = await loader.load()
  return docs.map(doc => doc.pageContent).join(" ")

}
