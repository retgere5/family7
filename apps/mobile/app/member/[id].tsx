import { Camera, Map as MapLibreMap, Marker } from '@maplibre/maplibre-react-native'
import type { Circle, PingKind } from '@family7/shared'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackIcon } from '../../components/icons'
import { MemberAvatar } from '../../components/MemberAvatar'
import { getMemberEvents, getMyCircle, sendPing } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { speedKmh, speedLabel, timeAgo } from '../../lib/format'
import { subscribeLive } from '../../lib/live'
import { memberColor, pausedColor } from '../../lib/memberColors'
import { MAP_STYLE_URL } from '../../lib/mapStyle'
import { colors, fonts, gradients } from '../../lib/theme'

type Member = Circle['members'][number]

function localMidnightIso() {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  return midnight.toISOString()
}

function clockLabel(iso: string) {
  const date = new Date(iso)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function MemberDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const params = useLocalSearchParams<{ id: string }>()
  const { data: circleData } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })
  const circle = circleData?.circle ?? null
  const member: Member | null = circle?.members.find((entry) => entry.id === params.id) ?? null
  const memberIds = circle?.members.map((entry) => entry.id) ?? []

  const { data: eventsData, refetch: refetchEvents } = useQuery({
    queryKey: ['timeline', params.id],
    queryFn: () => getMemberEvents(params.id, localMidnightIso()),
    enabled: Boolean(circle && member),
  })

  const [address, setAddress] = useState<string | null>(null)
  const [pinged, setPinged] = useState(false)

  const location = member?.location ?? null
  const geoKey = location ? `${location.lat.toFixed(3)},${location.lng.toFixed(3)}` : null

  useEffect(() => {
    if (!location || !geoKey) return
    let cancelled = false
    void (async () => {
      const results = await Location.reverseGeocodeAsync({
        latitude: location.lat,
        longitude: location.lng,
      }).catch(() => [])
      if (cancelled) return
      const hit = results[0]
      if (!hit) return
      const line = [hit.street ?? hit.name, hit.district ?? hit.subregion ?? hit.city]
        .filter(Boolean)
        .join(' — ')
      if (line) setAddress(line)
    })()
    return () => {
      cancelled = true
    }
  }, [geoKey])

  useEffect(() => {
    return subscribeLive((message) => {
      if (message.type === 'place:transition' && message.userId === params.id) {
        void refetchEvents()
      }
    })
  }, [params.id, refetchEvents])

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Member not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const paused = member.sharingPaused
  const color = paused ? pausedColor : memberColor(member.id, user?.id, memberIds)
  const kmh = location && !paused ? speedKmh(location.speed) : null
  const motion = paused
    ? '⏸ Sharing paused'
    : !location
      ? 'No location yet'
      : kmh != null
        ? 'On the move'
        : member.place
          ? `At ${member.place.name} ${member.place.icon}`
          : 'Stationary'
  const statusText = member.statusEmoji ?? 'no status set'
  const events = eventsData?.events ?? []

  function pingMenu() {
    const options: { label: string; kind: PingKind }[] = [
      { label: '🚗 On my way', kind: 'on_my_way' },
      { label: '📞 Call me', kind: 'call_me' },
      { label: '✅ Arrived', kind: 'arrived' },
    ]
    Alert.alert('Send a ping', 'Everyone in the circle will see it.', [
      ...options.map((option) => ({
        text: option.label,
        onPress: () => {
          void sendPing(option.kind).catch(() => null)
          setPinged(true)
          setTimeout(() => setPinged(false), 1500)
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  function openInMaps() {
    if (!location) return
    const label = encodeURIComponent(member?.name ?? 'family7')
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${location.lat},${location.lng}&q=${label}`
        : `geo:${location.lat},${location.lng}?q=${location.lat},${location.lng}(${label})`
    void Linking.openURL(url).catch(() => null)
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      <View style={styles.mapWrap} pointerEvents="none">
        {location ? (
          <MapLibreMap
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE_URL}
            compass={false}
            logo={false}
          >
            <Camera initialViewState={{ center: [location.lng, location.lat], zoom: 13.5 }} />
            <Marker lngLat={[location.lng, location.lat]}>
              <MemberAvatar
                initial={member.name.charAt(0).toUpperCase()}
                color={color}
                size={38}
                ringWidth={2.5}
                gapColor={colors.map}
              />
            </Marker>
          </MapLibreMap>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.mapEmpty]}>
            <Text style={styles.mutedText}>No location yet</Text>
          </View>
        )}
        <LinearGradient colors={['rgba(15,20,32,0)', colors.background]} style={styles.mapFade} />
      </View>
      <View style={[styles.mapHeader, { top: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <BackIcon color={colors.textSoft} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.identityRow}>
          <MemberAvatar
            initial={member.name.charAt(0).toUpperCase()}
            color={color}
            size={76}
            ringWidth={3.5}
            emoji={member.statusEmoji}
          />
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={[styles.motionLine, { color: paused ? colors.muted : color.tint }]}>
              {motion} · {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Svg width={15} height={18} viewBox="0 0 15 18">
            <Path
              d="M7.5 0C3.4 0 0 3.4 0 7.5 0 13.1 7.5 18 7.5 18S15 13.1 15 7.5C15 3.4 11.6 0 7.5 0z"
              fill={colors.accent}
            />
            <SvgCircle cx={7.5} cy={7.2} r={2.8} fill={colors.background} />
          </Svg>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLine}>
              {address ?? (location ? 'Locating on the map…' : 'Waiting for a location')}
            </Text>
            <Text style={styles.addressHint}>
              Approximate area{location ? ` · updated ${timeAgo(location.recordedAt)}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>
              {paused ? '—' : location ? speedLabel(location.speed) : '—'}
            </Text>
            <Text style={styles.statLabel}>SPEED</Text>
          </View>
          <View style={styles.statTile}>
            <Text
              style={[
                styles.statValue,
                location?.battery != null &&
                  (location.battery <= 20
                    ? { color: colors.dangerSoft }
                    : { color: colors.success }),
              ]}
            >
              {location?.battery != null ? `${location.battery}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>BATTERY</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{location ? timeAgo(location.recordedAt) : '—'}</Text>
            <Text style={styles.statLabel}>UPDATED</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.pingWrap, pressed && styles.dim]}
            onPress={pingMenu}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pingButton}
            >
              <Text style={styles.pingText}>{pinged ? 'Sent ✓' : '👋 Send a ping'}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.mapsButton, pressed && styles.dim]}
            onPress={openInMaps}
            disabled={!location}
          >
            <Text style={styles.mapsText}>Maps</Text>
          </Pressable>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.sectionLabel}>TODAY</Text>
          <Text style={styles.sharingState}>{paused ? 'Sharing paused' : 'Sharing on'}</Text>
        </View>
        {events.length === 0 ? (
          <Text style={styles.emptyTimeline}>
            No place visits yet today — add places to see arrivals here.
          </Text>
        ) : (
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {events.map((event, index) => (
              <View key={event.id} style={styles.timelineRow}>
                <View style={[styles.timelineDot, index === 0 && styles.timelineDotLatest]} />
                <View style={styles.timelineInfo}>
                  <Text style={[styles.timelineTitle, index > 0 && { color: colors.textSoft }]}>
                    {event.transition === 'enter' ? 'Arrived' : 'Left'}{' '}
                    <Text style={index === 0 ? { color: color.tint } : null}>
                      {event.placeName} {event.placeIcon}
                    </Text>
                  </Text>
                  <Text style={styles.timelineTime}>{clockLabel(event.at)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 46,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.background,
  },
  mutedText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  backLink: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.accentSoft,
  },
  mapWrap: {
    height: 216,
    backgroundColor: colors.map,
    overflow: 'hidden',
  },
  mapEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  mapHeader: {
    position: 'absolute',
    left: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    marginTop: -34,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    marginBottom: 14,
  },
  identityInfo: {
    paddingBottom: 6,
    flex: 1,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: 23,
    letterSpacing: -0.3,
    color: colors.text,
  },
  motionLine: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  addressInfo: {
    flex: 1,
  },
  addressLine: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
  },
  addressHint: {
    marginTop: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  pingWrap: {
    flex: 1.4,
  },
  pingButton: {
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  mapsButton: {
    flex: 1,
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapsText: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: colors.text,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
  },
  sharingState: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.faint,
  },
  emptyTimeline: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.faint,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 8,
    bottom: 6,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.handle,
  },
  timelineRow: {
    marginBottom: 14,
  },
  timelineDot: {
    position: 'absolute',
    left: -20,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.handle,
  },
  timelineDotLatest: {
    backgroundColor: colors.accent,
  },
  timelineInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
    flex: 1,
  },
  timelineTime: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.muted,
  },
  dim: {
    opacity: 0.7,
  },
})
