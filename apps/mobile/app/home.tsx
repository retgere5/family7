import type { Circle } from '@family7/shared'
import { useQuery } from '@tanstack/react-query'
import { Redirect, useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { getMyCircle } from '../lib/api'
import { useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

type Member = Circle['members'][number]

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { data, isPending, isError } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Could not load your circle</Text>
      </View>
    )
  }

  if (!data.circle) return <Redirect href="/circle-setup" />

  const circle = data.circle

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.muted}>Invite code: {circle.inviteCode}</Text>
        </View>
        <Pressable
          onPress={async () => {
            await signOut()
            router.replace('/login')
          }}
        >
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      <FlatList
        data={circle.members}
        keyExtractor={(member) => member.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <MemberRow member={item} isMe={item.id === user?.id} />}
      />
    </View>
  )
}

function MemberRow({ member, isMe }: { member: Member; isMe: boolean }) {
  return (
    <View style={styles.member}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{member.statusEmoji ?? member.name.charAt(0)}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.name}
          {isMe ? ' (you)' : ''}
        </Text>
        <Text style={styles.muted}>{member.role === 'OWNER' ? 'Owner' : 'Member'}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 64,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  circleName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  signOut: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 24,
    gap: 10,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
})
