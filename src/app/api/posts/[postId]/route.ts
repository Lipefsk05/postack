import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = {
  id: string;
};

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  return (
    cookieHeader
      .split("; ")
      .find((item) => item.startsWith("token="))
      ?.split("=")[1] ?? null
  );
}

export async function GET(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    const { postId } = await context.params;

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: decoded.id,
      },
      include: {
        media: {
          orderBy: {
            fileOrder: "asc",
          },
        },
      },
    });

    if (!post) {
      return Response.json(
        { error: "Post não encontrado." },
        { status: 404 }
      );
    }

    return Response.json(post);
  } catch {
    return Response.json(
      { error: "Erro ao buscar post." },
      { status: 500 }
    );
  }
}