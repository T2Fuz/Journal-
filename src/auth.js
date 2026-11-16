import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase.js'
import { DEFAULT_SECTIONS } from './colors.js'

// Firebase wants an email. We secretly turn "safi" into "safi@journal.local".
// Nobody ever sees or verifies this email. Same trick as TimeLogger.
const DOMAIN = '@journal.local'

export const cleanUsername = (raw) => raw.trim().toLowerCase()
export const usernameToEmail = (u) => cleanUsername(u) + DOMAIN
export const emailToUsername = (email) => (email || '').replace(DOMAIN, '')

export async function signUp(username, password) {
  const u = cleanUsername(username)
  if (!/^[a-z0-9._-]{3,20}$/.test(u)) {
    throw new Error('Username 3 theke 20 okkhor hobe, shudhu english letter, number, . _ - cholbe.')
  }
  const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(u), password)
  const uid = cred.user.uid

  // First-time setup: user record + the 5 default section tabs.
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', uid), { username: u, createdAt: serverTimestamp() })
  DEFAULT_SECTIONS.forEach((s, i) => {
    batch.set(doc(collection(db, 'users', uid, 'sections')), {
      name: s.name,
      color: s.color,
      order: i,
      createdAt: serverTimestamp(),
    })
  })
  await batch.commit()
  return cred.user
}

export async function logIn(username, password) {
  const u = cleanUsername(username)
  const cred = await signInWithEmailAndPassword(auth, usernameToEmail(u), password)
  return cred.user
}

export const logOut = () => signOut(auth)

export function friendlyError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'Ei username ta ager theke ache. Onno ekta try korun.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Username ba password vul.'
    case 'auth/weak-password':
      return 'Password kompokkhe 6 ta okkhor hote hobe.'
    case 'auth/network-request-failed':
      return 'Internet connection nei. Abar try korun.'
    case 'auth/too-many-requests':
      return 'Onek beshi try hoyeche. Kichukkhon pore abar try korun.'
    default:
      return err?.message || 'Kichu ekta vul hoyeche.'
  }
}
