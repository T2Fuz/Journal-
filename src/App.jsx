import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, configReady, db } from './firebase.js'
import { emailToUsername, logOut } from './auth.js'
import { COLOR_KEYS } from './colors.js'
import AuthScreen from './components/AuthScreen.jsx'
import SectionTabs from './components/SectionTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import PageView from './components/PageView.jsx'
import SyncPill from './components/SyncPill.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import RecycleBin from './components/RecycleBin.jsx'
import { useTheme } from './theme.js'
import { useIsMobile } from './useMobile.js'
import { SectionsScreen, PagesScreen } from './components/MobileScreens.jsx'

function formatStamp(ms) {
  const d = new Date(ms)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
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
  const [theme, toggleTheme] = useTheme()
  const [user, setUser] = useState(undefined) // undefined = still checking, null = logged out
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), [])

  if (user === undefined) {
    return <div className="min-h-screen bg-cream text-muted p-10">Loading...</div>
  }
  if (user === null) return <AuthScreen theme={theme} onToggleTheme={toggleTheme} />
  return <Journal user={user} theme={theme} onToggleTheme={toggleTheme} />
}

function Journal({ user, theme, onToggleTheme }) {
  const uid = user.uid
  const [rawSections, setRawSections] = useState([])
  const [rawPages, setRawPages] = useState([])
  // Remember where I was last (section + page), so the app reopens right there.
  const lastKey = `journal-last-${uid}`
  const savedLast = (() => {
    try {
      return JSON.parse(localStorage.getItem(lastKey)) || {}
    } catch {
      return {}
    }
  })()
  const [activeSection, setActiveSection] = useState(savedLast.section ?? null)
  const [activePage, setActivePage] = useState(savedLast.page ?? null)
  const [ready, setReady] = useState(false) // first data has arrived
  const [dbError, setDbError] = useState('')
  const [sectionMeta, setSectionMeta] = useState({ total: 0, pending: 0 })
  const [pageMeta, setPageMeta] = useState({ total: 0, pending: 0 })
  const [online, setOnline] = useState(navigator.onLine)
  const nameKey = `journal-name-${uid}`
  const [notebookName, setNotebookName] = useState(() => {
    try {
      return localStorage.getItem(nameKey) || 'Journal'
    } catch {
      return 'Journal'
    }
  })
  const [editingNotebookName, setEditingNotebookName] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const mobile = useIsMobile()

  // Phone layout = 3 screens: all sections -> pages in a section -> editor.
  // We use the browser history so the phone's Back gesture/button works.
  const [view, setView] = useState(savedLast.page ? 'editor' : 'sections')
  useEffect(() => {
    window.history.replaceState({ v: 'sections' }, '')
    if (savedLast.page) {
      // so the phone's Back button goes editor -> pages -> sections
      window.history.pushState({ v: 'pages' }, '')
      window.history.pushState({ v: 'editor' }, '')
    }
    const onPop = (e) => setView(e.state?.v || 'sections')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  function go(v) {
    window.history.pushState({ v }, '')
    setView(v)
  }
  function goBack() {
    window.history.back()
  }

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Notebook name shown top-left. Synced the same way as everything else,
  // so renaming it on one device updates every other device too.
  useEffect(() => onSnapshot(doc(db, 'users', uid), (snap) => {
    const name = snap.data()?.notebookName
    if (name) {
      setNotebookName(name)
      try {
        localStorage.setItem(nameKey, name)
      } catch {
        /* ignore */
      }
    }
  }, (err) => setDbError(err.message)), [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  function renameNotebook(name) {
    const trimmed = name.trim()
    if (!trimmed || trimmed === notebookName) return
    setNotebookName(trimmed)
    try {
      localStorage.setItem(nameKey, trimmed)
    } catch {
      /* ignore */
    }
    setDoc(doc(db, 'users', uid), { notebookName: trimmed }, { merge: true }).catch((e) =>
      setDbError(e.message),
    )
  }

  const got = useRef({ sections: false, pages: false })

  // Live listeners: whenever data changes on ANY device, these run again.
  useEffect(() => {
    const unsubSections = onSnapshot(
      query(collection(db, 'users', uid, 'sections'), orderBy('order')),
      { includeMetadataChanges: true },
      (snap) => {
        setDbError('')
        setRawSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        got.current.sections = true
        if (got.current.pages) setReady(true)
        setSectionMeta({
          total: snap.size,
          pending: snap.docs.filter((d) => d.metadata.hasPendingWrites).length,
        })
      },
      (err) => setDbError(err.message),
    )
    const unsubPages = onSnapshot(
      collection(db, 'users', uid, 'pages'),
      { includeMetadataChanges: true },
      (snap) => {
        setDbError('')
        setPageMeta({
          total: snap.size,
          pending: snap.docs.filter((d) => d.metadata.hasPendingWrites).length,
        })
        got.current.pages = true
        if (got.current.sections) setReady(true)
        setRawPages(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: 'estimate' })
            return {
              id: d.id,
              sectionId: x.sectionId,
              title: x.title ?? '',
              content: x.content ?? '',
              blocks: Array.isArray(x.blocks) ? x.blocks : null,
              pageColor: x.pageColor ?? 'none',
              ruleStyle: x.ruleStyle ?? 'none',
              trashed: x.trashed ?? false,
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

  // "Trashed" items are just hidden from the normal views, not actually gone.
  const sections = rawSections.filter((s) => !s.trashed)
  const trashedSections = rawSections.filter((s) => s.trashed)
  const pages = rawPages.filter((p) => !p.trashed)
  const trashedPages = rawPages.filter((p) => p.trashed)

  const sectionId = sections.find((s) => s.id === activeSection)?.id ?? sections[0]?.id
  const sectionPages = pages
    .filter((p) => p.sectionId === sectionId)
    .sort((a, b) => a.createdMs - b.createdMs)
  const currentPage =
    sectionPages.find((p) => p.id === activePage) ?? sectionPages[sectionPages.length - 1]

  // save "where I am" (on the phone: only once I'm actually inside a page)
  useEffect(() => {
    if (!ready || !sectionId || !currentPage) return
    if (mobile && view !== 'editor') return
    try {
      localStorage.setItem(lastKey, JSON.stringify({ section: sectionId, page: currentPage.id }))
    } catch {
      /* storage full/blocked — not important */
    }
  }, [ready, sectionId, currentPage?.id, view, mobile]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Sections ----

  function addSection() {
    const name = window.prompt('Notun section er naam:')
    if (!name || !name.trim()) return
    const ref = doc(collection(db, 'users', uid, 'sections'))
    const maxOrder = rawSections.reduce((m, s) => Math.max(m, s.order ?? 0), -1)
    setDoc(ref, {
      name: name.trim(),
      color: COLOR_KEYS[rawSections.length % COLOR_KEYS.length],
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
    setActiveSection(ref.id)
  }

  // Phone version of "add section": name + color come from a bottom sheet.
  function createSection(name, color) {
    const ref = doc(collection(db, 'users', uid, 'sections'))
    const maxOrder = rawSections.reduce((m, s) => Math.max(m, s.order ?? 0), -1)
    setDoc(ref, { name, color, order: maxOrder + 1, createdAt: serverTimestamp() }).catch((e) =>
      setDbError(e.message),
    )
    setActiveSection(ref.id)
  }

  function updateSection(id, fields) {
    updateDoc(doc(db, 'users', uid, 'sections', id), fields).catch((e) => setDbError(e.message))
  }

  function moveSection(section, dir) {
    const ids = sections.map((s) => s.id)
    const i = ids.indexOf(section.id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    reorderSections(ids)
  }

  function renameSection(section) {
    const name = window.prompt('Notun naam:', section.name)
    if (!name || !name.trim()) return
    updateDoc(doc(db, 'users', uid, 'sections', section.id), { name: name.trim() }).catch((e) =>
      setDbError(e.message),
    )
  }

  async function copySection(section) {
    const ref = doc(collection(db, 'users', uid, 'sections'))
    const maxOrder = rawSections.reduce((m, s) => Math.max(m, s.order ?? 0), -1)
    await setDoc(ref, {
      name: section.name + ' (copy)',
      color: section.color,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
    })
    const toCopy = pages.filter((p) => p.sectionId === section.id)
    await Promise.all(
      toCopy.map((p) =>
        setDoc(doc(collection(db, 'users', uid, 'pages')), {
          sectionId: ref.id,
          title: p.title,
          content: p.content,
          ...(p.blocks ? { blocks: p.blocks } : {}),
          pageColor: p.pageColor,
          ruleStyle: p.ruleStyle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ),
    )
    setActiveSection(ref.id)
  }

  // orderedIds: the sections in their new left-to-right order (drag & drop).
  function reorderSections(orderedIds) {
    const batch = writeBatch(db)
    orderedIds.forEach((id, i) => {
      batch.update(doc(db, 'users', uid, 'sections', id), { order: i })
    })
    batch.commit().catch((e) => setDbError(e.message))
  }

  function trashSection(section) {
    if (!window.confirm(`"${section.name}" section ta Recycle Bin e pathabo? Pore restore kora jabe.`))
      return false
    updateDoc(doc(db, 'users', uid, 'sections', section.id), {
      trashed: true,
      trashedAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
    return true
  }

  function restoreSection(id) {
    updateDoc(doc(db, 'users', uid, 'sections', id), { trashed: false }).catch((e) =>
      setDbError(e.message),
    )
  }

  async function deleteSectionForever(id) {
    try {
      const snap = await getDocs(
        query(collection(db, 'users', uid, 'pages'), where('sectionId', '==', id)),
      )
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(db, 'users', uid, 'sections', id))
    } catch (e) {
      setDbError(e.message)
    }
  }

  // ---- Pages ----

  function addPage() {
    if (!sectionId) return
    const ref = doc(collection(db, 'users', uid, 'pages'))
    setDoc(ref, {
      sectionId,
      title: '', // blank on purpose — sidebar will show the first words typed instead
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

  function renamePage(page) {
    const title = window.prompt('Page er title (khali rakhle content theke title dekhabe):', page.title)
    if (title === null) return
    savePage(page.id, { title: title.trim() })
  }

  function copyPage(page) {
    setDoc(doc(collection(db, 'users', uid, 'pages')), {
      sectionId: page.sectionId,
      title: page.title ? page.title + ' (copy)' : '',
      content: page.content,
      ...(page.blocks ? { blocks: page.blocks } : {}),
      pageColor: page.pageColor,
      ruleStyle: page.ruleStyle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
  }

  // Used by the Sidebar's "⋮" menu — confirms itself.
  function trashPage(page) {
    if (!window.confirm('Ei page ta Recycle Bin e pathabo? Pore restore kora jabe.')) return
    trashPageSilently(page.id)
  }

  // Used by PageView's own "Delete this page" button, which already confirms.
  function trashPageSilently(id) {
    updateDoc(doc(db, 'users', uid, 'pages', id), {
      trashed: true,
      trashedAt: serverTimestamp(),
    }).catch((e) => setDbError(e.message))
  }

  function restorePage(id) {
    updateDoc(doc(db, 'users', uid, 'pages', id), { trashed: false }).catch((e) =>
      setDbError(e.message),
    )
  }

  function deletePageForever(id) {
    deleteDoc(doc(db, 'users', uid, 'pages', id)).catch((e) => setDbError(e.message))
  }

  if (mobile) {
    // wait for the first data, so we don't flash the sections list before jumping to the last page
    if (!ready) return <div className="min-h-screen bg-cream" />
    const section = sections.find((s) => s.id === sectionId)
    const syncProps = {
      total: sectionMeta.total + pageMeta.total,
      pending: sectionMeta.pending + pageMeta.pending,
      online,
    }
    // if the section/page vanished (deleted on another device) fall back safely
    const screen = view === 'editor' && currentPage ? 'editor' : view !== 'sections' && section ? 'pages' : 'sections'
    return (
      <div className="min-h-screen bg-cream text-ink">
        {dbError && (
          <div className="fixed left-3 right-3 top-3 z-[60] rounded-xl bg-red-100 px-4 py-2 text-sm text-red-800 shadow dark:bg-red-950 dark:text-red-200">
            Database problem: {dbError}
          </div>
        )}

        {screen === 'sections' && (
          <SectionsScreen
            notebookName={notebookName}
            onRenameNotebook={renameNotebook}
            sections={sections}
            pages={pages}
            username={emailToUsername(user.email)}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={logOut}
            trashCount={trashedSections.length + trashedPages.length}
            onOpenTrash={() => setShowTrash(true)}
            syncProps={syncProps}
            onOpen={(s) => {
              setActiveSection(s.id)
              go('pages')
            }}
            onCreate={createSection}
            onUpdate={updateSection}
            onCopy={copySection}
            onDelete={trashSection}
            onMove={moveSection}
          />
        )}

        {screen === 'pages' && section && (
          <PagesScreen
            section={section}
            pages={sectionPages}
            onBack={goBack}
            onOpen={(p) => {
              setActivePage(p.id)
              go('editor')
            }}
            onAdd={() => {
              addPage()
              go('editor')
            }}
            onRename={renamePage}
            onCopy={copyPage}
            onDelete={trashPage}
            onUpdateSection={updateSection}
            onCopySection={copySection}
            onDeleteSection={(sec) => {
              if (trashSection(sec)) goBack()
            }}
          />
        )}

        {screen === 'editor' && currentPage && (
          <PageView
            key={currentPage.id}
            mobile
            page={currentPage}
            sectionName={section?.name}
            dateLabel={formatStamp(currentPage.createdMs)}
            onSave={savePage}
            onBack={goBack}
            onDelete={(id) => {
              trashPageSilently(id)
              goBack()
            }}
          />
        )}

        {showTrash && (
          <RecycleBin
            trashedSections={trashedSections}
            trashedPages={trashedPages}
            onClose={() => setShowTrash(false)}
            onRestoreSection={restoreSection}
            onDeleteSectionForever={deleteSectionForever}
            onRestorePage={restorePage}
            onDeletePageForever={deletePageForever}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <div className="flex items-center gap-5 px-6 py-4 border-b border-line">
        {editingNotebookName ? (
          <input
            autoFocus
            defaultValue={notebookName}
            onBlur={(e) => {
              renameNotebook(e.target.value)
              setEditingNotebookName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur()
            }}
            className="font-bold text-lg bg-transparent outline-none border-b border-line"
          />
        ) : (
          <button
            onClick={() => setEditingNotebookName(true)}
            className="font-bold text-lg hover:underline"
            title="Click to rename"
          >
            {notebookName}
          </button>
        )}
        <SectionTabs
          sections={sections}
          activeId={sectionId}
          onSelect={setActiveSection}
          onAdd={addSection}
          onRename={renameSection}
          onCopy={copySection}
          onDelete={trashSection}
          onReorder={reorderSections}
        />
        <div className="ml-auto flex items-center gap-3 text-xs text-muted">
          <SyncPill
            total={sectionMeta.total + pageMeta.total}
            pending={sectionMeta.pending + pageMeta.pending}
            online={online}
          />
          <span>{emailToUsername(user.email)}</span>
          <button onClick={logOut} className="underline">
            Logout
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {dbError && (
        <div className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 text-sm px-6 py-2 border-b border-red-300 dark:border-red-900">
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
            onDelete={trashPageSilently}
          />
        ) : (
          <main className="flex-1 p-10 text-muted">
            {sectionId
              ? 'Ei section e kono page nei. Dan pashe "+ Add Page" chapun.'
              : 'Prothome ekta section banan (uporer + chapun).'}
          </main>
        )}
        <Sidebar
          pages={sectionPages}
          activeId={currentPage?.id}
          onSelect={setActivePage}
          onAdd={addPage}
          onRename={renamePage}
          onCopy={copyPage}
          onDelete={trashPage}
          trashCount={trashedSections.length + trashedPages.length}
          onOpenTrash={() => setShowTrash(true)}
        />
      </div>

      {showTrash && (
        <RecycleBin
          trashedSections={trashedSections}
          trashedPages={trashedPages}
          onClose={() => setShowTrash(false)}
          onRestoreSection={restoreSection}
          onDeleteSectionForever={deleteSectionForever}
          onRestorePage={restorePage}
          onDeletePageForever={deletePageForever}
        />
      )}
    </div>
  )
}
