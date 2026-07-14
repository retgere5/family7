import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../lib/theme'

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>family7</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
})
