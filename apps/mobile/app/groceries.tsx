import type { GroceryItem } from '@family7/shared'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
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
import Svg, { Path } from 'react-native-svg'
import { BackIcon } from '../components/icons'
import { MemberAvatar } from '../components/MemberAvatar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { addGrocery, deleteGrocery, getGroceries, getMyCircle, setGroceryChecked } from '../lib/api'
import { useAuth } from '../lib/auth'
import { memberColor } from '../lib/memberColors'
import { colors, fonts, gradients, radii } from '../lib/theme'

export default function Groceries() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data } = useQuery({ queryKey: ['groceries'], queryFn: getGroceries })
  const { data: circleData } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const circle = circleData?.circle ?? null
  const memberIds = circle?.members.map((member) => member.id) ?? []
  const items = data?.items ?? []
  const toBuy = items.filter((item) => !item.checkedAt)
  const inCart = items.filter((item) => item.checkedAt)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['groceries'] })
  }

  async function submit() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await addGrocery(name.trim())
      setName('')
      await refresh()
    } catch (error) {
      Alert.alert('Could not add', error instanceof Error ? error.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(item: GroceryItem) {
    await setGroceryChecked(item.id, !item.checkedAt).catch(() => null)
    await refresh()
  }

  function confirmRemove(item: GroceryItem) {
    Alert.alert('Remove item', `Remove ${item.name} from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteGrocery(item.id).catch(() => null)
            await refresh()
          })()
        },
      },
    ])
  }

  function avatarFor(item: GroceryItem, checked: boolean) {
    const who = checked ? item.checkedBy : item.addedBy
    if (!who) return null
    return (
      <View style={checked ? styles.avatarFaded : null}>
        <MemberAvatar
          initial={who.name.charAt(0).toUpperCase()}
          color={memberColor(who.id, user?.id, memberIds)}
          size={22}
          showRing={false}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text style={styles.title}>Groceries</Text>
        {circle ? (
          <View style={styles.circleChip}>
            <View style={styles.liveDot} />
            <Text style={styles.circleChipText}>{circle.name}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add an item…"
          placeholderTextColor={colors.faint}
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => void submit()}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [(pressed || busy || !name.trim()) && styles.dim]}
          disabled={busy || !name.trim()}
          onPress={() => void submit()}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1.5v13M1.5 8h13"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView style={styles.fill} contentContainerStyle={styles.listArea}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧺</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Add the first item — everyone sees it instantly.</Text>
          </View>
        ) : (
          <>
            {toBuy.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>TO BUY · {toBuy.length}</Text>
                <View style={styles.card}>
                  {toBuy.map((item, index) => (
                    <Pressable
                      key={item.id}
                      style={[styles.row, index < toBuy.length - 1 && styles.rowBorder]}
                      onPress={() => void toggle(item)}
                      onLongPress={() => confirmRemove(item)}
                    >
                      <View style={styles.checkbox} />
                      <Text style={styles.itemName}>{item.name}</Text>
                      {avatarFor(item, false)}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.doneBanner}>
                <Text style={styles.doneText}>Everything's in the cart 🎉</Text>
              </View>
            )}
            {inCart.length > 0 ? (
              <>
                <View style={styles.cartLabelRow}>
                  <Text style={styles.sectionLabel}>IN THE CART · {inCart.length}</Text>
                  <View style={styles.cartLabelLine} />
                </View>
                <View style={[styles.card, styles.cardChecked]}>
                  {inCart.map((item, index) => (
                    <Pressable
                      key={item.id}
                      style={[styles.row, index < inCart.length - 1 && styles.rowBorderChecked]}
                      onPress={() => void toggle(item)}
                      onLongPress={() => confirmRemove(item)}
                    >
                      <View style={styles.checkboxChecked}>
                        <Svg width={12} height={10} viewBox="0 0 12 10" fill="none">
                          <Path
                            d="M1 5.2L4.2 8.5 11 1.5"
                            stroke={colors.background}
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                      <Text style={styles.itemNameChecked}>{item.name}</Text>
                      {avatarFor(item, true)}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
        <Text style={styles.footer}>
          Tap to check off · hold to remove
          {circle ? ` · everyone in ${circle.name} sees this list` : ''}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 6,
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
  circleChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  circleChipText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.muted,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: colors.text,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listArea: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: 18,
  },
  cardChecked: {
    backgroundColor: '#161D2E',
    borderColor: '#202A42',
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
  rowBorderChecked: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E2740',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A4763',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  itemNameChecked: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  avatarFaded: {
    opacity: 0.7,
  },
  cartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cartLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1C2438',
    marginBottom: 8,
  },
  doneBanner: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 18,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.handle,
  },
  doneText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.accentSoft,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 46,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    marginTop: 12,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.text,
  },
  emptyBody: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.faint,
  },
  dim: {
    opacity: 0.6,
  },
})
