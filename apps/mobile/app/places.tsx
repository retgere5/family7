import type { Place } from '@family7/shared'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackIcon } from '../components/icons'
import { getMyCircle, getPlaces } from '../lib/api'
import { colors, fonts, radii } from '../lib/theme'

const ICON_TINTS: Record<string, { background: string; border: string }> = {
  '🏠': { background: 'rgba(76,141,255,0.14)', border: 'rgba(76,141,255,0.25)' },
  '💼': { background: 'rgba(255,174,92,0.13)', border: 'rgba(255,174,92,0.25)' },
  '🎒': { background: 'rgba(255,143,163,0.12)', border: 'rgba(255,143,163,0.22)' },
}

const DEFAULT_TINT = { background: 'rgba(138,148,173,0.12)', border: 'rgba(138,148,173,0.22)' }

export default function Places() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data } = useQuery({ queryKey: ['places'], queryFn: getPlaces })
  const { data: circleData } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })

  const places = data?.places ?? []
  const members = circleData?.circle?.members ?? []

  function whoIsAt(place: Place) {
    const names = members
      .filter((member) => member.place?.id === place.id)
      .map((member) => member.name)
    if (names.length === 0) return null
    return `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} here`
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
        <Text style={styles.title}>Places</Text>
      </View>
      <Text style={styles.subtitle}>
        Arrival & departure alerts for spots your family cares about.
      </Text>
      <View style={styles.list}>
        {places.map((place) => {
          const tint = ICON_TINTS[place.icon] ?? DEFAULT_TINT
          const presence = whoIsAt(place)
          return (
            <Pressable
              key={place.id}
              style={({ pressed }) => [styles.row, pressed && styles.dim]}
              onPress={() => router.push({ pathname: '/place-edit', params: { id: place.id } })}
            >
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: tint.background, borderColor: tint.border },
                ]}
              >
                <Text style={styles.iconText}>{place.icon}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{place.name}</Text>
                <Text style={styles.rowLine}>
                  {place.radiusM} m radius ·{' '}
                  {presence ? (
                    <Text style={styles.presence}>{presence}</Text>
                  ) : place.notify ? (
                    'alerts on'
                  ) : (
                    'alerts off'
                  )}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )
        })}
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.dim]}
          onPress={() => router.push('/place-edit')}
        >
          <Text style={styles.addText}>+ Add a place</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>
        Alerts show up in the app for now — push notifications are on the way.
      </Text>
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
    paddingBottom: 46,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
  subtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 14,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 21,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15.5,
    color: colors.text,
  },
  rowLine: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  presence: {
    color: colors.accentSoft,
  },
  chevron: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.faint,
  },
  addButton: {
    height: 56,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.handle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.accentSoft,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.faint,
  },
  dim: {
    opacity: 0.7,
  },
})
