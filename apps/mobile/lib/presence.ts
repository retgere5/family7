import type { Circle } from '@family7/shared'
import { useQueryClient } from '@tanstack/react-query'
import { updateSharing, updateStatus } from './api'
import { useAuth } from './auth'

type Member = Circle['members'][number]

export function useSelfPresence() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  function patchSelf(patch: Partial<Member>) {
    queryClient.setQueryData<{ circle: Circle | null }>(['circle'], (current) => {
      if (!current?.circle || !user) return current
      return {
        circle: {
          ...current.circle,
          members: current.circle.members.map((member) =>
            member.id === user.id ? { ...member, ...patch } : member,
          ),
        },
      }
    })
  }

  async function setStatus(statusEmoji: string | null) {
    const result = await updateStatus(statusEmoji).catch(() => null)
    if (result) patchSelf({ statusEmoji: result.user.statusEmoji })
    return result != null
  }

  async function setPaused(paused: boolean) {
    const result = await updateSharing(paused).catch(() => null)
    if (result) patchSelf({ sharingPaused: result.sharingPaused })
    return result != null
  }

  return { setStatus, setPaused }
}
