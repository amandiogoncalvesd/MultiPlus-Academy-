export async function updateSession(request: any) {
  return {
    authenticated: true,
    user: null,
    message: "Middleware active"
  };
}
