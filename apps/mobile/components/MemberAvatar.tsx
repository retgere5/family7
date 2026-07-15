import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { MemberColor } from '../lib/memberColors'
import { colors, fonts } from '../lib/theme'

type Props = {
  initial: string
  color: MemberColor
  size?: number
  ringWidth?: number
  gapColor?: string
  emoji?: string | null
  showRing?: boolean
}

export function MemberAvatar({
  initial,
  color,
  size = 42,
  ringWidth = 2.5,
  gapColor = colors.background,
  emoji,
  showRing = true,
}: Props) {
  const ring = showRing ? ringWidth : 0
  const outer = size + ring * 4
  const inner = size + ring * 2
  return (
    <View
      style={{
        width: outer,
        height: outer,
        borderRadius: outer / 2,
        backgroundColor: showRing ? color.ring : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: showRing ? gapColor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearGradient
          colors={[color.start, color.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.extraBold, fontSize: size * 0.38, color: '#FFFFFF' }}>
            {initial}
          </Text>
        </LinearGradient>
      </View>
      {emoji ? (
        <View style={styles.badge}>
          <Text style={{ fontSize: 11 }}>{emoji}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -4,
    top: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.map,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
