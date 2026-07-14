import type { User } from '@family7/shared'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { restoreSession, signInWithDevLogin, signOut as apiSignOut } from './api'

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: User }

type AuthContextValue = AuthState & {
  signInDev: (email: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  useEffect(() => {
    restoreSession()
      .then((session) =>
        setState(
          session
            ? { status: 'signedIn', user: session.user }
            : { status: 'signedOut', user: null },
        ),
      )
      .catch(() => setState({ status: 'signedOut', user: null }))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signInDev: async (email, name) => {
        const session = await signInWithDevLogin(email, name)
        setState({ status: 'signedIn', user: session.user })
      },
      signOut: async () => {
        await apiSignOut()
        setState({ status: 'signedOut', user: null })
      },
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
