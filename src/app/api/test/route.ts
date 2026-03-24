import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await prisma.user.create({
    data: {
      name: 'Felipe',
      email: 'felipe@test.com',
      passwordHash: '123',
    },
  })

  return Response.json(user)
}