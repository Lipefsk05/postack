import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = {
  id: string;
  email: string;
  name: string;
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

export async function POST(req: Request) {
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

    const body = await req.json();
    const { title, generalCaption } = body;

    const post = await prisma.post.create({
      data: {
        userId: decoded.id,
        title: title || null,
        generalCaption: generalCaption || null,
      },
    });

    return Response.json(post, { status: 201 });
  } catch {
    return Response.json(
      { error: "Erro ao criar post." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
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

    const posts = await prisma.post.findMany({
      where: {
        userId: decoded.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(posts);
  } catch {
    return Response.json(
      { error: "Erro ao buscar posts." },
      { status: 500 }
    );
  }
}