import { LinearGradient } from 'expo-linear-gradient'
import type { Circle } from '@family7/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { MemberAvatar } from '../components/MemberAvatar'
import { createCircle, joinCircle } from '../lib/api'
import { useAuth } from '../lib/auth'
import { selfColor } from '../lib/memberColors'
import { colors, fonts, gradients } from '../lib/theme'

const CODE_LENGTH = 6

export default function CircleSetup() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [codeFocused, setCodeFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const codeInput = useRef<TextInput>(null)

  const firstName = user?.name.split(' ')[0] ?? 'there'

  async function run(action: () => Promise<Circle>) {
    setBusy(true)
    try {
      const circle = await action()
      queryClient.setQueryData(['circle'], { circle })
      router.replace('/home')
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarRow}>
          <MemberAvatar
            initial={firstName.charAt(0).toUpperCase()}
            color={selfColor}
            size={40}
            ringWidth={2}
          />
          <View style={[styles.ghostAvatar, { backgroundColor: colors.border }]}>
            <Text style={styles.ghostPlus}>+</Text>
          </View>
          <View style={[styles.ghostAvatar, { backgroundColor: '#1C2438' }]}>
            <Text style={[styles.ghostPlus, { color: colors.faint }]}>+</Text>
          </View>
        </View>
        <Text style={styles.title}>
          Hi {firstName} 👋{'\n'}Set up your circle
        </Text>
        <Text style={styles.subtitle}>
          A circle is your family's private space — only members can see each other.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a circle</Text>
          <TextInput
            style={[styles.input, nameFocused && styles.inputFocused]}
            placeholder="Circle name"
            placeholderTextColor={colors.faint}
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
          <Text style={styles.helper}>You'll get an invite code to share with family.</Text>
          <Pressable
            disabled={busy || !name.trim()}
            onPress={() => run(() => createCircle(name.trim()))}
            style={({ pressed }) => [
              styles.primaryWrap,
              (pressed || busy || !name.trim()) && styles.dim,
            ]}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>Create circle</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join with invite code</Text>
          <Pressable style={styles.codeRow} onPress={() => codeInput.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }, (_, index) => {
              const char = code[index] ?? ''
              const active = codeFocused && index === code.length
              return (
                <View key={index} style={[styles.codeBox, active && styles.codeBoxActive]}>
                  <Text style={[styles.codeChar, char !== '' && styles.codeCharFilled]}>
                    {char}
                  </Text>
                </View>
              )
            })}
          </Pressable>
          <TextInput
            ref={codeInput}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(value) => setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            autoCapitalize="characters"
            maxLength={CODE_LENGTH}
          />
          <Pressable
            disabled={busy || code.length !== CODE_LENGTH}
            onPress={() => run(() => joinCircle(code))}
            style={({ pressed }) => [
              styles.secondaryButton,
              (pressed || busy || code.length !== CODE_LENGTH) && styles.dim,
            ]}
          >
            <Text style={styles.secondaryText}>Join circle</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 84,
    paddingBottom: 40,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ghostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3A4763',
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostPlus: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.muted,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginTop: 26,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.text,
  },
  input: {
    marginTop: 12,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  helper: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.muted,
  },
  primaryWrap: {
    marginTop: 14,
  },
  primaryButton: {
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.extraBold,
    fontSize: 11.5,
    letterSpacing: 1.5,
    color: colors.faint,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
  },
  codeBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: {
    borderColor: colors.accent,
  },
  codeChar: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    color: colors.text,
  },
  codeCharFilled: {
    color: colors.accentSoft,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  secondaryButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.text,
  },
  dim: {
    opacity: 0.6,
  },
})
