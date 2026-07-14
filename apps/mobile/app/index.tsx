import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

export default function Index() {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }
  return <Redirect href={status === 'signedIn' ? '/home' : '/login'} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
