import { LinearGradient } from 'expo-linear-gradient'
import * as Updates from 'expo-updates'
import { useEffect, useRef, useState } from 'react'
import { Animated, AppState, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, gradients, radii } from '../lib/theme'

const CHECK_INTERVAL_MS = 15 * 60 * 1000

export function UpdateGate() {
  const [stage, setStage] = useState<'hidden' | 'available' | 'updating'>('hidden')
  const stageRef = useRef(stage)
  stageRef.current = stage
  const lastCheck = useRef(0)
  const pulse = useRef(new Animated.Value(0)).current
  const sweep = useRef(new Animated.Value(0)).current

  async function check() {
    if (__DEV__ || !Updates.isEnabled) return
    if (Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return
    lastCheck.current = Date.now()
    const result = await Updates.checkForUpdateAsync().catch(() => null)
    if (result?.isAvailable && stageRef.current === 'hidden') setStage('available')
  }

  useEffect(() => {
    void check()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check()
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (stage !== 'updating') return
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    )
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    )
    pulseLoop.start()
    sweepLoop.start()
    return () => {
      pulseLoop.stop()
      sweepLoop.stop()
      pulse.setValue(0)
      sweep.setValue(0)
    }
  }, [stage, pulse, sweep])

  async function applyUpdate() {
    setStage('updating')
    const started = Date.now()
    try {
      await Updates.fetchUpdateAsync()
      const elapsed = Date.now() - started
      if (elapsed < 1800) {
        await new Promise((resolve) => setTimeout(resolve, 1800 - elapsed))
      }
      await Updates.reloadAsync()
    } catch {
      setStage('hidden')
    }
  }

  if (stage === 'hidden') return null

  if (stage === 'available') {
    return (
      <Modal transparent animationType="fade" onRequestClose={() => setStage('hidden')}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoTile}
            >
              <Text style={styles.logoSeven}>7</Text>
            </LinearGradient>
            <Text style={styles.title}>Update ready ✨</Text>
            <Text style={styles.body}>A fresh version of family7 just landed.</Text>
            <Pressable
              style={({ pressed }) => [styles.updateWrap, pressed && styles.dim]}
              onPress={() => void applyUpdate()}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.updateButton}
              >
                <Text style={styles.updateText}>Update now</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => setStage('hidden')}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    )
  }

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] })
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] })
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-90, 230] })

  return (
    <Modal transparent animationType="fade" onRequestClose={() => null}>
      <View style={styles.updatingScreen}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoTileBig}
          >
            <Text style={styles.logoSevenBig}>7</Text>
          </LinearGradient>
        </View>
        <Text style={styles.updatingTitle}>Updating…</Text>
        <Text style={styles.updatingHint}>family7 is getting better</Text>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { transform: [{ translateX: sweepX }] }]}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barGradient}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,22,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  logoTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSeven: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  title: {
    marginTop: 14,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
  },
  updateWrap: {
    width: '100%',
    marginTop: 18,
  },
  updateButton: {
    height: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  laterText: {
    marginTop: 14,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.faint,
  },
  updatingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStage: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(76,141,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(76,141,255,0.35)',
  },
  logoTileBig: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSevenBig: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    color: '#FFFFFF',
  },
  updatingTitle: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.text,
  },
  updatingHint: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  barTrack: {
    width: 220,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: 26,
  },
  barFill: {
    width: 90,
    height: 6,
  },
  barGradient: {
    flex: 1,
    borderRadius: 3,
  },
  dim: {
    opacity: 0.7,
  },
})
