export default function Error({
    error,
  }: {
    error: Error & { digest?: string }
  }) {
    const errorMessage = error.message || "An unexpected error occurred"
    //const errorCode = error?.status || 500
    //return new Response(JSON.stringify({ message: errorMessage }), {
    //  status: errorCode
    //})
    console.error(error);
    return new Response(JSON.stringify({ message: errorMessage }), {
       status: 500
      })
  }