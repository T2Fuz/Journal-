import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig.js'

// true only after you pasted the real values into firebaseConfig.js
export const configReady = !Object.values(firebaseConfig).some((v) =>
  String(v).startsWith('PASTE_'),
)

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Offline-first: data is cached on the device, and syncs when internet returns.
// persistentMultipleTabManager = several browser tabs can share the same cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
