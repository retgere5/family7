import { Prisma } from '../../generated/prisma/client'
import { db } from '../../db'
import { generateInviteCode } from '../../lib/inviteCode'
import { toPublicUser } from '../auth/service'
import { toLocationPayload } from '../locations/service'

export class CircleError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export async function createCircle(userId: string, name: string) {
  await ensureNotInCircle(userId)
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.circle.create({
        data: {
          name,
          inviteCode: generateInviteCode(),
          members: { create: { userId, role: 'OWNER' } },
        },
      })
      return await getMyCircle(userId)
    } catch (error) {
      if (!isInviteCodeCollision(error)) throw error
    }
  }
  throw new CircleError('could not allocate an invite code', 500)
}

export async function joinCircle(userId: string, code: string) {
  await ensureNotInCircle(userId)
  const circle = await db.circle.findUnique({ where: { inviteCode: code } })
  if (!circle) throw new CircleError('invalid invite code', 404)
  await db.circleMember.create({ data: { circleId: circle.id, userId } })
  return getMyCircle(userId)
}

export async function getMyCircle(userId: string) {
  const membership = await db.circleMember.findFirst({
    where: { userId },
    include: {
      circle: {
        include: {
          members: {
            include: { user: { include: { latestLocation: true } } },
            orderBy: { joinedAt: 'asc' },
          },
        },
      },
    },
  })
  if (!membership) return null
  const { circle } = membership
  return {
    id: circle.id,
    name: circle.name,
    inviteCode: circle.inviteCode,
    members: circle.members.map((member) => ({
      ...toPublicUser(member.user),
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      sharingPaused: member.user.sharingPaused,
      location: member.user.latestLocation ? toLocationPayload(member.user.latestLocation) : null,
    })),
  }
}

async function ensureNotInCircle(userId: string) {
  const existing = await db.circleMember.findFirst({ where: { userId } })
  if (existing) throw new CircleError('already in a circle', 409)
}

function isInviteCodeCollision(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
