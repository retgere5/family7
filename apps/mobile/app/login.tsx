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
} from 'react-native'
import { useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

export default function Login() {
  const { signInDev } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>family7</Text>
      <Text style={styles.subtitle}>Stay close to the people who matter</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />
      <Pressable
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonDim]}
        onPress={submit}
        disabled={busy}
      >
        <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Continue'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDim: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
})
