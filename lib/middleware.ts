export const custom_middleware =
  (...handlers: Function[]) =>
  async (req: Request) => {
    try {


      for (const handler of handlers) {
        await handler(req);
      }
    } catch (error:any) {

    const errorMessage = error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    console.error(error);
    return new Response(JSON.stringify(
        { message: errorMessage }),
        { status: errorCode }
        );
      
    }
  };