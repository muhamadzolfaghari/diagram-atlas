import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import Studio from './pages/Studio.jsx'
import Templates from './pages/Templates.jsx'
import Saved from './pages/Saved.jsx'
import Compare from './pages/Compare.jsx'
import NotFound from './pages/NotFound.jsx'

const PAGE_TITLES = {
  '/': 'Universal Diagram & Chart Studio',
  '/studio': 'Studio',
  '/templates': 'Templates',
  '/saved': 'My diagrams',
  '/formats': 'Formats & features',
}

function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `DiagramAtlas — ${PAGE_TITLES[pathname] || 'Page not found'}`
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Landing />} />
          <Route path="studio" element={<Studio />} />
          <Route path="templates" element={<Templates />} />
          <Route path="saved" element={<Saved />} />
          <Route path="formats" element={<Compare />} />
          <Route path="compare" element={<Navigate to="/formats" replace />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
