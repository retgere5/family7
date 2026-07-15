import { View } from 'react-native'
import { colors } from '../lib/theme'

export function BatteryIcon({ level, size = 20 }: { level: number; size?: number }) {
  const low = level <= 20
  const frame = low ? colors.danger : colors.muted
  const fill = low ? colors.danger : colors.success
  const height = size * 0.55
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: frame,
          padding: 1.5,
        }}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(6, level))}%`,
            height: '100%',
            borderRadius: 1.5,
            backgroundColor: fill,
          }}
        />
      </View>
      <View
        style={{
          width: 2,
          height: height * 0.45,
          backgroundColor: frame,
          marginLeft: 1,
          borderRadius: 1,
        }}
      />
    </View>
  )
}
