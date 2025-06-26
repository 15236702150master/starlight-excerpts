import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './contexts/DataContext'
import LandingPage from './components/LandingPage'
import LibraryView from './components/LibraryView'
import StarfieldView from './components/StarfieldView'
import ReaderView from './components/ReaderView'
import MemoryCapsule from './components/MemoryCapsule'
import LinkTestDemo from './components/LinkTestDemo'
import './App.css'

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/starfield" element={<StarfieldView />} />
            <Route path="/reader/:articleId" element={<ReaderView />} />
            <Route path="/capsules" element={<MemoryCapsule />} />
            <Route path="/link-demo" element={<LinkTestDemo />} />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  )
}

export default App
