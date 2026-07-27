import { LinearGradient } from 'expo-linear-gradient'
import { useRef } from 'react'
import { PanResponder, StyleSheet, View } from 'react-native'
import { colors } from '../lib/theme'

type Props = {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function RadiusSlider({ value, min = 50, max = 1000, onChange }: Props) {
  const widthRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setFromX = (x: number) => {
    if (!widthRef.current) return
    const ratio = Math.min(1, Math.max(0, x / widthRef.current))
    const next = Math.round((min + ratio * (max - min)) / 10) * 10
    onChangeRef.current(next)
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => setFromX(event.nativeEvent.locationX),
      onPanResponderMove: (event) => setFromX(event.nativeEvent.locationX),
    }),
  ).current

  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)))

  return (
    <View
      style={styles.touchArea}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track} />
      <LinearGradient
        colors={['#3D74E8', '#5E9BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${ratio * 100}%` }]}
      />
      <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  touchArea: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
})
