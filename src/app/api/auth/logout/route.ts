export async function POST() {
  const response = Response.json(
    { message: "Logout realizado com sucesso." },
    { status: 200 }
  );

  response.headers.set(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  return response;
}