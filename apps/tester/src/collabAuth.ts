const JWT_KEY = 'oyasumi_collab_jwt'
const USER_KEY = 'oyasumi_collab_user'

export function getCollabJwt(): string | null {
  try {
    return sessionStorage.getItem(JWT_KEY)
  } catch {
    return null
  }
}

export function getCollabDisplayUser(): string | null {
  try {
    return sessionStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

export function setCollabSession(token: string, displayUser: string): void {
  sessionStorage.setItem(JWT_KEY, token)
  sessionStorage.setItem(USER_KEY, displayUser)
}

export function clearCollabSession(): void {
  sessionStorage.removeItem(JWT_KEY)
  sessionStorage.removeItem(USER_KEY)
}
