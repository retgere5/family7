import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../lib/theme'

export function Toggle({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.accent,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
    marginLeft: 3,
  },
  thumbOn: {
    backgroundColor: '#FFFFFF',
    marginLeft: 21,
  },
})
