import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { GoogleLogo, LockIcon } from '../components/icons'
import { MemberAvatar } from '../components/MemberAvatar'
import { useAuth } from '../lib/auth'
import { amberColor, roseColor, selfColor } from '../lib/memberColors'
import { colors, fonts } from '../lib/theme'

const devLoginEnabled = __DEV__ || process.env.EXPO_PUBLIC_DEV_LOGIN === '1'

export default function Login() {
  const { signInDev } = useAuth()
  const router = useRouter()
  const [devOpen, setDevOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  function onGoogle() {
    Alert.alert('Almost there', 'Google sign-in will be enabled once OAuth keys are configured.')
  }

  async function onDevSubmit() {
    if (!email.trim() || !name.trim()) return
    setBusy(true)
    try {
      await signInDev(email.trim(), name.trim())
      router.replace('/home')
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LinearGradient
      colors={['#1D2A4C', colors.background]}
      locations={[0, 0.58]}
      style={styles.fill}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.grow} />
        <View style={styles.logoTile}>
          <LinearGradient
            colors={['#5E9BFF', '#3560C9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoSeven}>7</Text>
          </LinearGradient>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.wordmark}>
          family<Text style={styles.wordmarkAccent}>7</Text>
        </Text>
        <Text style={styles.tagline}>Stay close to the people{'\n'}who matter.</Text>
        <View style={styles.constellation}>
          <Svg width={250} height={130} viewBox="0 0 250 130" style={StyleSheet.absoluteFill}>
            <Path
              d="M52 96 L125 38 L204 88"
              fill="none"
              stroke={colors.borderStrong}
              strokeWidth={1.5}
              strokeDasharray="3 6"
              strokeLinecap="round"
            />
          </Svg>
          <View style={[styles.node, { left: 125 - 31, top: 38 - 31 }]}>
            <MemberAvatar initial="M" color={selfColor} size={52} ringWidth={2.5} />
          </View>
          <View style={[styles.node, { left: 52 - 26, top: 96 - 26 }]}>
            <MemberAvatar initial="A" color={roseColor} size={42} ringWidth={2} />
          </View>
          <View style={[styles.node, { left: 204 - 26, top: 88 - 26 }]}>
            <MemberAvatar initial="B" color={amberColor} size={42} ringWidth={2} />
          </View>
        </View>
        <View style={styles.grow} />
        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.dim]}
          onPress={onGoogle}
        >
          <GoogleLogo />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
        <View style={styles.privacyRow}>
          <LockIcon />
          <Text style={styles.privacyText}>Your location is visible only to your circle.</Text>
        </View>
        {devLoginEnabled ? (
          devOpen ? (
            <View style={styles.devCard}>
              <TextInput
                style={styles.devInput}
                placeholder="Email"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.devInput}
                placeholder="Name"
                placeholderTextColor={colors.faint}
                value={name}
                onChangeText={setName}
              />
              <Pressable
                style={({ pressed }) => [styles.devButton, (pressed || busy) && styles.dim]}
                onPress={onDevSubmit}
                disabled={busy}
              >
                <Text style={styles.devButtonText}>{busy ? 'Signing in…' : 'Continue'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setDevOpen(true)}>
              <Text style={styles.devLink}>Developer sign-in</Text>
            </Pressable>
          )
        ) : null}
        <Text style={styles.footer}>Terms · Privacy</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  grow: {
    flex: 1,
  },
  logoTile: {
    width: 84,
    height: 84,
  },
  logoGradient: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSeven: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    color: '#FFFFFF',
  },
  logoDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: amberColor.ring,
    borderWidth: 3,
    borderColor: colors.background,
  },
  wordmark: {
    marginTop: 22,
    fontFamily: fonts.extraBold,
    fontSize: 37,
    letterSpacing: -1.3,
    color: colors.text,
  },
  wordmarkAccent: {
    color: '#6FA3FF',
  },
  tagline: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 15.5,
    lineHeight: 23,
    color: colors.body,
    textAlign: 'center',
  },
  constellation: {
    width: 250,
    height: 130,
    marginTop: 34,
  },
  node: {
    position: 'absolute',
  },
  googleButton: {
    width: '100%',
    height: 56,
    borderRadius: 15,
    backgroundColor: '#F5F7FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  googleText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#10141F',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
  },
  privacyText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  devLink: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.faint,
  },
  devCard: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  devInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14,
    paddingHorizontal: 14,
  },
  devButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.text,
  },
  dim: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 20,
    marginBottom: 44,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.faint,
  },
})
