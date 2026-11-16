import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, configReady, db } from './firebase.js'
import { emailToUsername, logOut } from './auth.js'
import { COLOR_KEYS } from './colors.js'
import AuthScreen from './components/AuthScreen.jsx'
import SectionTabs from './components/SectionTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import PageView from './components/PageView.jsx'

function formatStamp(ms) {
  const d = new Date(ms)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

function formatShort(ms) {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function App() {
  if (!configReady) return <ConfigMissing />
  return <Root />
}

function ConfigMissing() {
  return (
    <div className="min-h-screen bg-cream text-ink p-10">
      <h1 className="text-xl font-bold mb-2">Firebase config ekhono bosano hoyni</h1>
      <p className="text-sm text-muted">
        <code>src/firebaseConfig.js</code> file e "PASTE_..." gulo bodle Firebase er asol value boshan.
      </p>
    </div>
  )
}

function Root() {
  const [user, setUser] = useState(undefined) // undefined = still checking, null = logged out
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), [])

  if (user === undefined) {
    return <div className="min-h-screen bg-cream text-muted p-10">Loading...</div>
  }
  if (user === null) return <AuthScreen />
  return <Journal user={user} />
}

function Journal({ user }) {
  const uid = user.uid
  const [sections, setSections] = useState([])
  const [pages, setPages] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [activePage, setActivePage] = useState(null)
  const [dbError, setDbError] = useState('')

  // Live listeners: whenever data changes on ANY device, these run again.
  useEffect(() => {
    const unsubSections = onSnapshot(
      query(collection(db, 'users', uid, 'sections'), orderBy('order')),
      (snap) => {
        setDbError('')
        setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => setDbError(err.message),
    )
    const unsubPages = onSnapshot(
      collection(db, 'users', uid, 'pages'),
      (snap) => {
        setDbError('')
        setPages(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: 'estimate' })
            return {
              id: d.id,
              sectionId: x.sectionId,
              title: x.title ?? '',
              content: x.content ?? '',
              createdMs: x.createdAt ? x.createdAt.toMillis() : Date.now(),
            }
          }),
        )
      },
      (err) => setDbError(err.message),
    )
    return () => {
      unsubSections()
      unsubPages()
    }
  }, [uid])

  // Work out what is selected (fall back to something sensible).
  const sectionId = sections.find((s) => s.id === activeSection)?.id ?? sections[0]?.id
  const sectionPages = pages
    .filter((p) => p.sectionId === sectionId)
    .sort((a, b) => a.createdMs - b.createdMs)
  const currentPage =
    sectionPages.find((p) => p.id === activePage) ?? sectionPages[sectionPages.length - 1]

  function addSection() {
    const name = window.prompt('Notun section er naam:')
    if (!name || !name.trim()) return
    const ref = doc(collection(db, 'users', uid, 'sections'))
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.order ?? 0), -1)
    setDoc(ref, {
      name: name.trim(),
      color: COLOR_KEYS[sections.length % COLOR_KEYS.length],
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
    setActiveSection(ref.id)
  }

  function addPage() {
    if (!sectionId) return
    const ref = doc(collection(db, 'users', uid, 'pages'))
    setDoc(ref, {
      sectionId,
      title: formatShort(Date.now()),
      content: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
    setActivePage(ref.id)
  }

  function savePage(id, fields) {
    updateDoc(doc(db, 'users', uid, 'pages', id), { ...fields, updatedAt: serverTimestamp() }).catch(
      (e) => console.error('save failed', e),
    )
  }

  function deletePage(id) {
    deleteDoc(doc(db, 'users', uid, 'pages', id)).catch((e) => setDbError(e.message))
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <div className="flex items-center gap-5 px-6 py-4 border-b border-line">
        <span className="font-bold text-lg">Journal</span>
        <SectionTabs
          sections={sections}
          activeId={sectionId}
          onSelect={setActiveSection}
          onAdd={addSection}
        />
        <div className="ml-auto flex items-center gap-3 text-xs text-muted">
          <span>{emailToUsername(user.email)}</span>
          <button onClick={logOut} className="underline">
            Logout
          </button>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-50 text-red-800 text-sm px-6 py-2 border-b border-red-200">
          Database e problem: {dbError}
        </div>
      )}

      <div className="flex flex-1">
        {currentPage ? (
          <PageView
            key={currentPage.id}
            page={currentPage}
            dateLabel={formatStamp(currentPage.createdMs)}
            onSave={savePage}
            onDelete={deletePage}
          />
        ) : (
          <main className="flex-1 p-10 text-muted">
            {sectionId ? 'Ei section e kono page nei. Dan pashe "+ Add Page" chapun.' : 'Prothome ekta section banan (uporer + chapun).'}
          </main>
        )}
        <Sidebar
          pages={sectionPages}
          activeId={currentPage?.id}
          onSelect={setActivePage}
          onAdd={addPage}
        />
      </div>
    </div>
  )
}
