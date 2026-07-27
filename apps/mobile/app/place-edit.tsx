import { Camera, GeoJSONSource, Layer, Map as MapLibreMap } from '@maplibre/maplibre-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackIcon, PinIcon } from '../components/icons'
import { RadiusSlider } from '../components/RadiusSlider'
import { Toggle } from '../components/Toggle'
import { createPlace, deletePlace, getMyCircle, getPlaces, updatePlace } from '../lib/api'
import { useAuth } from '../lib/auth'
import { MAP_STYLE_URL } from '../lib/mapStyle'
import { colors, fonts, gradients, radii } from '../lib/theme'

const ICON_PRESETS = ['🏠', '💼', '🎒', '☕', '📍']

function circlePolygon(lat: number, lng: number, radiusM: number) {
  const points = 48
  const dLat = radiusM / 111320
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180))
  const coordinates = Array.from({ length: points + 1 }, (_, index) => {
    const angle = (index / points) * 2 * Math.PI
    return [lng + dLng * Math.sin(angle), lat + dLat * Math.cos(angle)]
  })
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coordinates] },
    properties: {},
  }
}

export default function PlaceEdit() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const params = useLocalSearchParams<{ id?: string }>()
  const { data: placesData } = useQuery({ queryKey: ['places'], queryFn: getPlaces })
  const { data: circleData } = useQuery({ queryKey: ['circle'], queryFn: getMyCircle })

  const editing = placesData?.places.find((place) => place.id === params.id) ?? null
  const selfLocation = circleData?.circle?.members.find(
    (member) => member.id === user?.id,
  )?.location

  const [name, setName] = useState(editing?.name ?? '')
  const [icon, setIcon] = useState(editing?.icon ?? '🏠')
  const [radiusM, setRadiusM] = useState(editing?.radiusM ?? 150)
  const [notify, setNotify] = useState(editing?.notify ?? true)
  const [center, setCenter] = useState<[number, number]>([
    editing?.lng ?? selfLocation?.lng ?? 29.03,
    editing?.lat ?? selfLocation?.lat ?? 41.0,
  ])
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      const input = {
        name: name.trim(),
        icon,
        lat: center[1],
        lng: center[0],
        radiusM,
        notify,
      }
      if (editing) await updatePlace(editing.id, input)
      else await createPlace(input)
      await queryClient.invalidateQueries({ queryKey: ['places'] })
      router.back()
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  function confirmDelete() {
    if (!editing) return
    Alert.alert('Delete place', `Remove ${editing.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deletePlace(editing.id).catch(() => null)
            await queryClient.invalidateQueries({ queryKey: ['places'] })
            router.back()
          })()
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.mapWrap}>
        <MapLibreMap
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE_URL}
          compass={false}
          logo={false}
          onRegionDidChange={(event) => setCenter(event.nativeEvent.center)}
        >
          <Camera initialViewState={{ center, zoom: 15 }} />
          <GeoJSONSource id="place-radius" data={circlePolygon(center[1], center[0], radiusM)}>
            <Layer
              type="fill"
              id="place-radius-fill"
              style={{ fillColor: 'rgba(76,141,255,0.13)' }}
            />
            <Layer
              type="line"
              id="place-radius-line"
              style={{ lineColor: 'rgba(76,141,255,0.45)', lineWidth: 1.5, lineDasharray: [2, 2] }}
            />
          </GeoJSONSource>
        </MapLibreMap>
        <View pointerEvents="none" style={styles.pinWrap}>
          <PinIcon />
        </View>
        <View pointerEvents="none" style={styles.pinHint}>
          <Text style={styles.pinHintText}>Drag the map to move the pin</Text>
        </View>
        <View style={[styles.mapHeader, { top: insets.top + 10 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <BackIcon color={colors.textSoft} />
          </Pressable>
          <View style={styles.titlePill}>
            <Text style={styles.titleText}>{editing ? 'Edit place' : 'Add place'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.fill} contentContainerStyle={styles.form}>
        <View style={styles.radiusHeader}>
          <Text style={styles.label}>Radius</Text>
          <Text style={styles.radiusValue}>{radiusM >= 1000 ? '1 km' : `${radiusM} m`}</Text>
        </View>
        <RadiusSlider value={radiusM} onChange={setRadiusM} />
        <View style={styles.radiusScale}>
          <Text style={styles.scaleText}>50 m</Text>
          <Text style={styles.scaleText}>1 km</Text>
        </View>

        <Text style={[styles.label, styles.section]}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Home"
          placeholderTextColor={colors.faint}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, styles.section]}>Icon</Text>
        <View style={styles.iconRow}>
          {ICON_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              style={[styles.iconOption, icon === preset && styles.iconSelected]}
              onPress={() => setIcon(preset)}
            >
              <Text style={styles.iconGlyph}>{preset}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.notifyCard}>
          <View style={styles.notifyInfo}>
            <Text style={styles.notifyTitle}>Notify the circle</Text>
            <Text style={styles.notifyHint}>When someone arrives or leaves</Text>
          </View>
          <Toggle value={notify} onPress={() => setNotify((value) => !value)} />
        </View>

        <Pressable
          disabled={busy || !name.trim()}
          onPress={save}
          style={({ pressed }) => [
            styles.saveWrap,
            (pressed || busy || !name.trim()) && styles.dim,
          ]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>Save place</Text>
          </LinearGradient>
        </Pressable>
        {editing ? (
          <Pressable onPress={confirmDelete}>
            <Text style={styles.deleteText}>Delete place</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    height: 330,
    backgroundColor: colors.map,
  },
  pinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 66,
    alignItems: 'center',
  },
  pinHintText: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSoft,
    overflow: 'hidden',
  },
  mapHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  titlePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
  },
  titleText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.text,
  },
  form: {
    padding: 20,
    paddingBottom: 46,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.text,
  },
  radiusValue: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.accentSoft,
  },
  radiusScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.faint,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 15,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOption: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: 'rgba(76,141,255,0.16)',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  iconGlyph: {
    fontSize: 20,
  },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 18,
  },
  notifyInfo: {
    flex: 1,
  },
  notifyTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.text,
  },
  notifyHint: {
    marginTop: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.muted,
  },
  saveWrap: {
    marginTop: 24,
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteText: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: colors.dangerSoft,
  },
  dim: {
    opacity: 0.6,
  },
})
