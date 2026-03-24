import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

export async function POST(
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
    });

    if (!post) {
      return Response.json(
        { error: "Post não encontrado." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileOrderValue = formData.get("fileOrder");

    if (!file) {
      return Response.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = path.extname(file.name) || "";
    const fileName = `${uuidv4()}${extension}`;
    const relativeFilePath = `/uploads/${fileName}`;
    const absoluteFilePath = path.join(process.cwd(), "public", "uploads", fileName);

    await writeFile(absoluteFilePath, buffer);

    const media = await prisma.postMedia.create({
      data: {
        postId,
        filePath: relativeFilePath,
        fileType: file.type || "unknown",
        fileOrder: Number(fileOrderValue ?? 0),
      },
    });

    return Response.json(media, { status: 201 });
  } catch {
    return Response.json(
      { error: "Erro ao enviar mídia." },
      { status: 500 }
    );
  }
}