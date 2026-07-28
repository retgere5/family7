import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg'
import { LockIcon } from '../components/icons'
import { getMyCircle } from '../lib/api'
import { useAuth } from '../lib/auth'
import {
  getBackgroundPermission,
  requestBackgroundPermission,
  syncBackgroundUpdates,
} from '../lib/background-location'
import { colors, fonts, gradients, radii } from '../lib/theme'

export default function BackgroundPermission() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { data } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })
  const [step, setStep] = useState<0 | 1>(0)
  const [granted, setGranted] = useState(false)
  const [denied, setDenied] = useState(false)

  const self = data?.circle?.members.find((member) => member.id === user?.id) ?? null
  const paused = self?.sharingPaused ?? false

  useEffect(() => {
    let active = true
    const check = () => {
      void getBackgroundPermission().then((permission) => {
        if (!active || permission?.status !== 'granted') return
        void syncBackgroundUpdates(paused)
        setGranted(true)
      })
    }
    check()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })
    return () => {
      active = false
      sub.remove()
    }
  }, [paused])

  async function allow() {
    const permission = await requestBackgroundPermission()
    if (permission?.status === 'granted') {
      void syncBackgroundUpdates(paused)
      setGranted(true)
    } else {
      setDenied(true)
    }
  }

  const showBattery = granted || step === 1

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 36 },
      ]}
    >
      {granted ? (
        <View style={styles.dots}>
          <View style={styles.dotActive} />
        </View>
      ) : (
        <View style={styles.dots}>
          <View style={step === 0 ? styles.dotActive : styles.dot} />
          <View style={step === 1 ? styles.dotActive : styles.dot} />
        </View>
      )}

      <View style={styles.spacerBig} />

      {showBattery ? <BatteryArt /> : <RadarArt />}

      <View style={styles.spacerSmall} />

      {granted ? (
        <>
          <Text style={styles.title}>Background location is on</Text>
          <Text style={styles.body}>
            Your circle keeps seeing you even while the app is closed — in battery-friendly
            adaptive mode.
          </Text>
        </>
      ) : step === 0 ? (
        <>
          <Text style={styles.title}>Arrival alerts, even{'\n'}with the app closed</Text>
          <Text style={styles.body}>
            Family7 needs <Text style={styles.bodyStrong}>{'"Always"'}</Text> location so your
            circle knows you arrived safely — without anyone opening the app.
          </Text>
          <View style={styles.privacyPill}>
            <LockIcon color={colors.accentSoft} />
            <Text style={styles.privacyText}>Only your circle can ever see you</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Easy on your battery</Text>
          <Text style={styles.body}>
            Family7 adapts to how you move — when you're still, we go quiet. No constant GPS
            drain, ever.
          </Text>
          {denied ? (
            <Text style={styles.deniedHint}>
              Pick {'"Allow all the time"'} for Family7 in your location settings.
            </Text>
          ) : null}
        </>
      )}

      <View style={styles.spacerBig} />

      <Pressable
        style={({ pressed }) => [styles.ctaWrap, pressed && styles.dim]}
        onPress={() => {
          if (granted) {
            router.back()
          } else if (step === 0) {
            setStep(1)
          } else if (denied) {
            void Linking.openSettings()
          } else {
            void allow()
          }
        }}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>
            {granted
              ? 'Done'
              : step === 0
                ? 'Allow location'
                : denied
                  ? 'Open settings'
                  : 'Allow'}
          </Text>
        </LinearGradient>
      </Pressable>
      {granted ? null : (
        <Pressable
          style={({ pressed }) => [styles.ghost, pressed && styles.dim]}
          onPress={() => router.back()}
        >
          <Text style={styles.ghostText}>Not now</Text>
        </Pressable>
      )}
    </View>
  )
}

function RadarArt() {
  return (
    <View style={styles.radarBox}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringMiddle]} />
      <View style={[styles.ring, styles.ringInner]} />
      <View style={styles.radarCenter}>
        <Text style={styles.radarEmoji}>🏠</Text>
      </View>
      <View style={styles.radarAvatarRing}>
        <LinearGradient
          colors={['#FFC178', '#F09B3C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.radarAvatar}
        >
          <Text style={styles.radarAvatarText}>B</Text>
        </LinearGradient>
      </View>
      <View style={styles.radarToast}>
        <Text style={styles.radarToastText}>Baba arrived home 🏠</Text>
      </View>
    </View>
  )
}

function BatteryArt() {
  return (
    <View style={styles.batteryBox}>
      <Text style={[styles.sleepZ, styles.sleepZSmall]}>z</Text>
      <Text style={[styles.sleepZ, styles.sleepZMedium]}>z</Text>
      <Text style={[styles.sleepZ, styles.sleepZLarge]}>z</Text>
      <Svg width={196} height={96} viewBox="0 0 196 96">
        <Defs>
          <SvgGradient id="charge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4CC38A" />
            <Stop offset="1" stopColor="#2E9D6A" />
          </SvgGradient>
        </Defs>
        <Rect
          x="3"
          y="3"
          width="172"
          height="90"
          rx="22"
          fill={colors.surface}
          stroke={colors.borderStrong}
          strokeWidth="3"
        />
        <Path
          d="M182 32v32c8-2.5 13.5-8.6 13.5-16S190 34.5 182 32z"
          fill={colors.borderStrong}
        />
        <Rect x="14" y="14" width="66" height="68" rx="14" fill="url(#charge)" />
      </Svg>
      <View style={styles.adaptiveBadge}>
        <Text style={styles.adaptiveText}>adaptive mode</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.accent,
  },
  spacerBig: {
    flex: 1,
  },
  spacerSmall: {
    flex: 0.4,
  },
  radarBox: {
    width: 250,
    height: 250,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ringOuter: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: 'rgba(76,141,255,0.1)',
  },
  ringMiddle: {
    top: 32,
    right: 32,
    bottom: 32,
    left: 32,
    borderColor: 'rgba(76,141,255,0.18)',
  },
  ringInner: {
    top: 64,
    right: 64,
    bottom: 64,
    left: 64,
    borderStyle: 'dashed',
    borderColor: 'rgba(76,141,255,0.3)',
  },
  radarCenter: {
    position: 'absolute',
    left: 79,
    top: 79,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  radarEmoji: {
    fontSize: 40,
  },
  radarAvatarRing: {
    position: 'absolute',
    left: 192,
    top: 32,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: '#FFAE5C',
    padding: 3,
    backgroundColor: colors.background,
  },
  radarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarAvatarText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  radarToast: {
    position: 'absolute',
    left: 96,
    top: -18,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    elevation: 8,
  },
  radarToastText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
  },
  batteryBox: {
    width: 250,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepZ: {
    position: 'absolute',
    fontFamily: fonts.extraBold,
  },
  sleepZSmall: {
    left: 24,
    top: 40,
    fontSize: 22,
    color: '#33405F',
  },
  sleepZMedium: {
    left: 52,
    top: 16,
    fontSize: 30,
    color: '#3E4A66',
  },
  sleepZLarge: {
    left: 92,
    top: -8,
    fontSize: 38,
    color: '#4A5878',
  },
  adaptiveBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    elevation: 8,
  },
  adaptiveText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: colors.success,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 25,
    letterSpacing: -0.5,
    lineHeight: 31,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  bodyStrong: {
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  deniedHint: {
    marginTop: 14,
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.accentSoft,
    textAlign: 'center',
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  privacyText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.accentSoft,
  },
  ctaWrap: {
    width: '100%',
  },
  cta: {
    height: 56,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  ghost: {
    height: 52,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.muted,
  },
  dim: {
    opacity: 0.7,
  },
})
