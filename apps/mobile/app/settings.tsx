import type { Circle } from '@family7/shared'
import * as Clipboard from 'expo-clipboard'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackIcon, CopyIcon } from '../components/icons'
import { MemberAvatar } from '../components/MemberAvatar'
import { Toggle } from '../components/Toggle'
import { getMyCircle } from '../lib/api'
import { useAuth } from '../lib/auth'
import { memberColor } from '../lib/memberColors'
import { useSelfPresence } from '../lib/presence'
import { colors, fonts, radii } from '../lib/theme'

type Member = Circle['members'][number]

export default function Settings() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setPaused } = useSelfPresence()
  const { data } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })
  const [copied, setCopied] = useState(false)

  const circle = data?.circle ?? null
  const members: Member[] = circle?.members ?? []
  const memberIds = members.map((member) => member.id)
  const self = members.find((member) => member.id === user?.id) ?? null
  const isOwner = self?.role === 'OWNER'

  async function copyCode() {
    if (!circle) return
    await Clipboard.setStringAsync(circle.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 18 }]}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      {user ? (
        <View style={styles.profileCard}>
          <MemberAvatar
            initial={user.name.charAt(0).toUpperCase()}
            color={memberColor(user.id, user.id, memberIds)}
            size={52}
            ringWidth={2.5}
            gapColor={colors.surface}
            emoji={self?.statusEmoji}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileRole}>
              {circle ? `${isOwner ? 'Owner' : 'Member'} of ${circle.name}` : 'No circle yet'}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>SHARING</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Pause my sharing</Text>
            <Text style={styles.rowHint}>Circle sees your last location only</Text>
          </View>
          <Toggle
            value={self?.sharingPaused ?? false}
            onPress={() => setPaused(!(self?.sharingPaused ?? false))}
          />
        </View>
      </View>

      {circle ? (
        <>
          <Text style={styles.sectionLabel}>CIRCLE · {circle.name.toUpperCase()}</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowTitle}>Invite code</Text>
              <Text style={styles.codeText}>{copied ? 'Copied!' : circle.inviteCode}</Text>
              <Pressable style={styles.copyButton} onPress={copyCode}>
                <CopyIcon />
              </Pressable>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Members</Text>
              <View style={styles.memberStack}>
                {members.map((member, index) => (
                  <View key={member.id} style={index > 0 ? styles.stackedAvatar : null}>
                    <MemberAvatar
                      initial={member.name.charAt(0).toUpperCase()}
                      color={memberColor(member.id, user?.id, memberIds)}
                      size={24}
                      showRing={false}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.dim]}
        onPress={async () => {
          await signOut()
          router.replace('/login')
        }}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      <Text style={styles.version}>family7 · v0.1</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.3,
    color: colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.text,
  },
  profileRole: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginTop: 13,
    marginBottom: 7,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.text,
  },
  rowHint: {
    marginTop: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.muted,
  },
  codeText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 2.5,
    color: colors.accentSoft,
  },
  copyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    marginLeft: -7,
  },
  signOut: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A2733',
    backgroundColor: 'rgba(255,93,93,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    color: colors.dangerSoft,
  },
  version: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#3E4A66',
  },
  dim: {
    opacity: 0.7,
  },
})
