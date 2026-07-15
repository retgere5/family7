import type { Circle, WsServerMessage } from '@family7/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getMyCircle } from './api'
import { startLive, stopLive, subscribeLive } from './live'

type CircleData = { circle: Circle | null }
type MemberMessage = Extract<
  WsServerMessage,
  { type: 'member:location' | 'member:status' | 'member:sharing' }
>

function applyUpdate(data: CircleData | undefined, message: MemberMessage) {
  if (!data?.circle) return data
  const members = data.circle.members.map((member) => {
    if (member.id !== message.userId) return member
    switch (message.type) {
      case 'member:location':
        return {
          ...member,
          location: {
            lat: message.lat,
            lng: message.lng,
            speed: message.speed ?? null,
            heading: message.heading ?? null,
            accuracy: message.accuracy ?? null,
            battery: message.battery ?? null,
            recordedAt: message.recordedAt,
          },
        }
      case 'member:status':
        return { ...member, statusEmoji: message.statusEmoji }
      case 'member:sharing':
        return { ...member, sharingPaused: message.paused }
    }
  })
  return { circle: { ...data.circle, members } }
}

export function useCircleLive() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })
  const hasCircle = Boolean(query.data?.circle)

  useEffect(() => {
    if (!hasCircle) return
    const unsubscribe = subscribeLive((message) => {
      if (
        message.type !== 'member:location' &&
        message.type !== 'member:status' &&
        message.type !== 'member:sharing'
      ) {
        return
      }
      queryClient.setQueryData<CircleData>(['circle'], (data) => applyUpdate(data, message))
    })
    startLive()
    return () => {
      unsubscribe()
      stopLive()
    }
  }, [hasCircle, queryClient])

  return query
}
