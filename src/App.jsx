import { useState } from 'react'
import SectionTabs from './components/SectionTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import PageView from './components/PageView.jsx'
import { sections, pages as initialPages } from './data/sampleData.js'

export default function App() {
  const [activeSection, setActiveSection] = useState('365days')
  const [pages] = useState(initialPages)
  const sectionPages = pages.filter((p) => p.sectionId === activeSection)
  const [activePage, setActivePage] = useState(sectionPages[sectionPages.length - 1]?.id)

  const currentPage = pages.find((p) => p.id === activePage)

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <div className="flex items-center gap-5 px-6 py-4 border-b border-line">
        <span className="font-bold text-lg">Safi's Notebook</span>
        <SectionTabs sections={sections} activeId={activeSection} onSelect={setActiveSection} />
      </div>
      <div className="flex flex-1">
        <PageView page={currentPage} />
        <Sidebar
          pages={sectionPages}
          activeId={activePage}
          onSelect={setActivePage}
          onAdd={() => alert('Firebase connect hobe next step e (README dekho)')}
        />
      </div>
    </div>
  )
}
