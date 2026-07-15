import { Camera, Map as MapLibreMap, Marker, type CameraRef } from '@maplibre/maplibre-react-native'
import type { Circle, PingKind } from '@family7/shared'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { Redirect, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BatteryIcon } from '../components/BatteryIcon'
import { ChevronDownIcon, CopyIcon, RecenterIcon, SlidersIcon } from '../components/icons'
import { MemberAvatar } from '../components/MemberAvatar'
import { Toggle } from '../components/Toggle'
import { sendPing } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useCircleLive } from '../lib/circle-live'
import { speedKmh, speedLabel, timeAgo } from '../lib/format'
import { subscribeLive } from '../lib/live'
import { useLocationTracking } from '../lib/location'
import { memberColor, pausedColor, type MemberColor } from '../lib/memberColors'
import { MAP_STYLE_URL } from '../lib/mapStyle'
import { useSelfPresence } from '../lib/presence'
import { colors, fonts, gradients, radii } from '../lib/theme'

type Member = Circle['members'][number]

const STATUS_PRESETS = ['🏃', '💼', '😴', '❤️']

const PING_LABELS: Record<PingKind, string> = {
  on_my_way: '🚗 On my way',
  call_me: '📞 Call me',
  arrived: '✅ Arrived',
}

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data, isPending, isError } = useCircleLive()
  useLocationTracking(Boolean(data?.circle))
  const { setStatus, setPaused } = useSelfPresence()
  const cameraRef = useRef<CameraRef>(null)
  const fitted = useRef(false)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sentPing, setSentPing] = useState<PingKind | null>(null)
  const [ping, setPing] = useState<{ name: string; kind: PingKind } | null>(null)

  const circle = data?.circle ?? null
  const members = useMemo(() => circle?.members ?? [], [circle])
  const memberIds = useMemo(() => members.map((member) => member.id), [members])
  const self = members.find((member) => member.id === user?.id) ?? null
  const located = useMemo(
    () =>
      members.flatMap((member) => (member.location ? [{ member, location: member.location }] : [])),
    [members],
  )

  useEffect(() => {
    if (!circle) return
    return subscribeLive((message) => {
      if (message.type !== 'member:ping') return
      const sender = circle.members.find((member) => member.id === message.userId)
      setPing({ name: sender?.name ?? 'Someone', kind: message.kind })
    })
  }, [circle])

  useEffect(() => {
    if (!ping) return
    const timer = setTimeout(() => setPing(null), 4000)
    return () => clearTimeout(timer)
  }, [ping])

  useEffect(() => {
    if (fitted.current || located.length === 0) return
    fitted.current = true
    const timer = setTimeout(fitMap, 600)
    return () => clearTimeout(timer)
  })

  function fitMap() {
    if (!cameraRef.current || located.length === 0) return
    const first = located[0]
    if (located.length === 1 && first) {
      cameraRef.current.easeTo({
        center: [first.location.lng, first.location.lat],
        zoom: 14,
        duration: 600,
      })
      return
    }
    const lats = located.map(({ location }) => location.lat)
    const lngs = located.map(({ location }) => location.lng)
    cameraRef.current.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      { padding: { top: 160, right: 90, bottom: 340, left: 90 }, duration: 600 },
    )
  }

  async function copyCode() {
    if (!circle) return
    await Clipboard.setStringAsync(circle.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function firePing(kind: PingKind) {
    setSentPing(kind)
    await sendPing(kind).catch(() => null)
    setTimeout(() => setSentPing(null), 1200)
  }

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
        <Text style={styles.centerText}>Could not load your circle</Text>
      </View>
    )
  }

  if (!circle) return <Redirect href="/circle-setup" />

  return (
    <View style={styles.container}>
      <MapLibreMap
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE_URL}
        compass={false}
        logo={false}
      >
        <Camera ref={cameraRef} initialViewState={{ center: [29.03, 41.0], zoom: 10.5 }} />
        {located.map(({ member, location }) => (
          <Marker key={member.id} lngLat={[location.lng, location.lat]}>
            <MarkerContent
              member={member}
              isSelf={member.id === user?.id}
              color={memberColor(member.id, user?.id, memberIds)}
              kmh={member.sharingPaused ? null : speedKmh(location.speed)}
            />
          </Marker>
        ))}
      </MapLibreMap>

      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <View style={styles.namePill}>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.memberCount}>{members.length}</Text>
        </View>
        <Pressable style={styles.codeChip} onPress={copyCode}>
          <Text style={styles.codeText}>{copied ? 'Copied!' : circle.inviteCode}</Text>
          <CopyIcon />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
          <SlidersIcon />
        </Pressable>
      </View>

      {ping ? (
        <View style={[styles.pingBanner, { top: insets.top + 62 }]}>
          <Text style={styles.pingText}>
            {ping.name} · {PING_LABELS[ping.kind]}
          </Text>
        </View>
      ) : null}

      {!expanded ? (
        <Pressable style={[styles.fab, { bottom: insets.bottom + 158 }]} onPress={fitMap}>
          <RecenterIcon />
        </Pressable>
      ) : null}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.handleZone} onPress={() => setExpanded((value) => !value)}>
          <View style={styles.handle} />
        </Pressable>
        {expanded ? (
          <View>
            <Pressable style={styles.sheetHeader} onPress={() => setExpanded(false)}>
              <Text style={styles.sheetTitle}>
                {circle.name}
                <Text style={styles.sheetCount}> {members.length} members</Text>
              </Text>
              <ChevronDownIcon />
            </Pressable>
            <View style={styles.quickRow}>
              <QuickAction kind="on_my_way" primary sent={sentPing} onPress={firePing} />
              <QuickAction kind="call_me" sent={sentPing} onPress={firePing} />
              <QuickAction kind="arrived" sent={sentPing} onPress={firePing} />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.sectionLabel}>MY STATUS</Text>
              {STATUS_PRESETS.map((emoji) => {
                const selected = self?.statusEmoji === emoji
                return (
                  <Pressable
                    key={emoji}
                    style={[styles.statusChip, selected && styles.statusChipSelected]}
                    onPress={() => setStatus(selected ? null : emoji)}
                  >
                    <Text style={styles.statusEmoji}>{emoji}</Text>
                  </Pressable>
                )
              })}
              <View style={styles.pauseGroup}>
                <Text style={styles.pauseLabel}>Pause</Text>
                <Toggle
                  value={self?.sharingPaused ?? false}
                  onPress={() => setPaused(!(self?.sharingPaused ?? false))}
                />
              </View>
            </View>
            <View style={styles.memberCard}>
              {members.map((member, index) => (
                <MemberListRow
                  key={member.id}
                  member={member}
                  isSelf={member.id === user?.id}
                  color={memberColor(member.id, user?.id, memberIds)}
                  last={index === members.length - 1}
                />
              ))}
            </View>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {members.map((member) => (
              <MemberChip
                key={member.id}
                member={member}
                isSelf={member.id === user?.id}
                color={memberColor(member.id, user?.id, memberIds)}
                onPress={() => setExpanded(true)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

function MarkerContent({
  member,
  isSelf,
  color,
  kmh,
}: {
  member: Member
  isSelf: boolean
  color: MemberColor
  kmh: number | null
}) {
  const paused = member.sharingPaused
  const shown = paused ? pausedColor : color
  return (
    <View style={styles.markerWrap}>
      {kmh != null ? (
        <View style={styles.speedBubble}>
          <Text style={styles.speedBubbleText}>{kmh} km/h</Text>
        </View>
      ) : null}
      <MemberAvatar
        initial={member.name.charAt(0).toUpperCase()}
        color={shown}
        size={isSelf ? 44 : 38}
        ringWidth={2.5}
        gapColor={colors.map}
        emoji={member.statusEmoji}
      />
      <View style={styles.nameChip}>
        <Text style={styles.nameChipText}>
          {paused ? '⏸ ' : ''}
          {isSelf ? 'You' : member.name}
        </Text>
      </View>
    </View>
  )
}

function MemberChip({
  member,
  isSelf,
  color,
  onPress,
}: {
  member: Member
  isSelf: boolean
  color: MemberColor
  onPress: () => void
}) {
  const paused = member.sharingPaused
  const shown = paused ? pausedColor : color
  const line = paused
    ? 'Paused'
    : member.location
      ? speedLabel(member.location.speed)
      : 'No location'
  return (
    <Pressable style={[styles.chip, paused && styles.chipPaused]} onPress={onPress}>
      <MemberAvatar
        initial={member.name.charAt(0).toUpperCase()}
        color={shown}
        size={34}
        showRing={false}
        emoji={member.statusEmoji}
      />
      <View>
        <Text style={styles.chipName}>{isSelf ? 'You' : member.name}</Text>
        <Text style={[styles.chipLine, { color: paused ? colors.muted : shown.tint }]}>{line}</Text>
      </View>
    </Pressable>
  )
}

function MemberListRow({
  member,
  isSelf,
  color,
  last,
}: {
  member: Member
  isSelf: boolean
  color: MemberColor
  last: boolean
}) {
  const paused = member.sharingPaused
  const shown = paused ? pausedColor : color
  const line = paused
    ? '⏸ Sharing paused'
    : member.location
      ? speedLabel(member.location.speed)
      : 'No location yet'
  return (
    <View style={[styles.memberRow, !last && styles.memberRowBorder]}>
      <MemberAvatar
        initial={member.name.charAt(0).toUpperCase()}
        color={shown}
        size={42}
        ringWidth={2}
        gapColor={colors.surface}
        emoji={member.statusEmoji}
      />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, paused && { color: colors.textSoft }]}>
          {member.name}
          {isSelf ? <Text style={styles.memberYou}> · you</Text> : null}
        </Text>
        <Text style={[styles.memberLine, { color: paused ? colors.muted : shown.tint }]}>
          {line}
        </Text>
      </View>
      <View style={styles.memberMeta}>
        {member.location?.battery != null ? (
          <View style={styles.batteryRow}>
            <BatteryIcon level={member.location.battery} />
            <Text
              style={[
                styles.batteryText,
                member.location.battery <= 20 && { color: colors.dangerSoft },
              ]}
            >
              {member.location.battery}%
            </Text>
          </View>
        ) : null}
        <Text style={styles.updatedText}>
          {member.location ? timeAgo(member.location.recordedAt) : '—'}
        </Text>
      </View>
    </View>
  )
}

function QuickAction({
  kind,
  primary,
  sent,
  onPress,
}: {
  kind: PingKind
  primary?: boolean
  sent: PingKind | null
  onPress: (kind: PingKind) => void
}) {
  const label = sent === kind ? 'Sent ✓' : PING_LABELS[kind]
  if (primary) {
    return (
      <Pressable
        style={({ pressed }) => [styles.quickWrap, pressed && styles.dim]}
        onPress={() => onPress(kind)}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickPrimary}
        >
          <Text style={styles.quickPrimaryText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    )
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.quickWrap, styles.quickSecondary, pressed && styles.dim]}
      onPress={() => onPress(kind)}
    >
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.map,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.map,
  },
  centerText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  namePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
  },
  circleName: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.text,
  },
  memberCount: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.muted,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 13,
    backgroundColor: colors.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    borderRadius: radii.pill,
  },
  codeText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    letterSpacing: 2.5,
    color: colors.accentSoft,
  },
  iconButton: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingBanner: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
  },
  pingText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 16,
  },
  handleZone: {
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.handle,
  },
  chipsRow: {
    gap: 10,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 13,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
  },
  chipPaused: {
    opacity: 0.75,
    backgroundColor: '#1C2438',
    borderColor: colors.border,
  },
  chipName: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.text,
  },
  chipLine: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.text,
  },
  sheetCount: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.muted,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickWrap: {
    flex: 1,
  },
  quickPrimary: {
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPrimaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  quickSecondary: {
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  statusChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipSelected: {
    backgroundColor: 'rgba(76,141,255,0.18)',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  statusEmoji: {
    fontSize: 15,
  },
  pauseGroup: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pauseLabel: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.muted,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    color: colors.text,
  },
  memberYou: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.muted,
  },
  memberLine: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  memberMeta: {
    alignItems: 'flex-end',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  batteryText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.textSoft,
  },
  updatedText: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: colors.faint,
  },
  markerWrap: {
    alignItems: 'center',
    gap: 7,
  },
  speedBubble: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(26,34,51,0.94)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
  },
  speedBubbleText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
  },
  nameChip: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    backgroundColor: 'rgba(12,19,34,0.8)',
    borderRadius: radii.pill,
  },
  nameChipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#DDE5F4',
  },
  dim: {
    opacity: 0.7,
  },
})
