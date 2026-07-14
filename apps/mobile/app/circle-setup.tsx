import { useQueryClient } from '@tanstack/react-query'
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
import { createCircle, joinCircle } from '../lib/api'
import { colors } from '../lib/theme'

export default function CircleSetup() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ['circle'] })
      router.replace('/home')
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Set up your circle</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a new circle</Text>
        <TextInput
          style={styles.input}
          placeholder="Circle name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
        <Pressable
          style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonDim]}
          disabled={busy || !name.trim()}
          onPress={() => run(() => createCircle(name.trim()))}
        >
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>
      <Text style={styles.divider}>or</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join with an invite code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="ABC123"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        <Pressable
          style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonDim]}
          disabled={busy || code.trim().length !== 6}
          onPress={() => run(() => joinCircle(code.trim().toUpperCase()))}
        >
          <Text style={styles.buttonText}>Join</Text>
        </Pressable>
      </View>
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
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  codeInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDim: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 16,
  },
})
