import { useState } from 'react'
import { AppProvider } from './AppContext'
import { Topbar } from './components/Topbar'
import { Dashboard } from './components/Dashboard'
import { Actielijst } from './components/Actielijst'
import { Orders } from './components/Orders'
import { ProjectKaart } from './components/ProjectKaart'
import { Importeer } from './components/Importeer'
import { Datakwaliteit } from './components/Datakwaliteit'
import './index.css'

export type Tab = 'dashboard' | 'actielijst' | 'orders' | 'importeer' | 'datakwaliteit'

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [selectedOrdnr, setSelectedOrdnr] = useState<string | null>(null)

  const openOrder = (ordnr: string) => setSelectedOrdnr(ordnr)
  const closeOrder = () => setSelectedOrdnr(null)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ paddingTop: '64px' }}>
        {activeTab === 'dashboard' && <Dashboard onSelectOrder={openOrder} />}
        {activeTab === 'actielijst' && (
          <Actielijst onSelectOrder={(ordnr) => { openOrder(ordnr); setActiveTab('orders') }} />
        )}
        {activeTab === 'orders' && <Orders onSelectOrder={openOrder} />}
        {activeTab === 'importeer' && <Importeer />}
        {activeTab === 'datakwaliteit' && (
          <Datakwaliteit onSelectOrder={(ordnr) => { openOrder(ordnr); setActiveTab('orders') }} />
        )}
      </main>

      <ProjectKaart ordnr={selectedOrdnr} onClose={closeOrder} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
