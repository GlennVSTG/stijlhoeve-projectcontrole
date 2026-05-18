import { Activity } from 'lucide-react'
import type { Tab } from '../App'
import { useApp } from '../AppContext'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard',      label: 'Dashboard' },
  { id: 'actielijst',    label: 'Actielijst' },
  { id: 'orders',         label: 'Orders' },
  { id: 'importeer',      label: 'Importeer' },
  { id: 'datakwaliteit',  label: 'Datakwaliteit' },
]

export function Topbar({ activeTab, onTabChange }: Props) {
  const { state } = useApp()
  const kritiekCount = state.issues.filter(i => i.severity === 'kritiek').length
  const lastRun = state.pipelineStatus.lastRun

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, var(--green) 20%, #2A8C6A 60%, transparent 100%)',
        opacity: 0.9,
      }} />
      <div style={{
        backgroundColor: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-topbar)',
        height: 'var(--topbar-h)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 'var(--page-pad)', paddingRight: 'var(--page-pad)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 36, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(145deg, var(--green) 0%, #1E7A5A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
            color: '#fff', letterSpacing: '-0.04em',
            boxShadow: '0 0 0 1px var(--green-border), 0 4px 16px var(--green-glow)',
          }}>
            S
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Stijlhoeve
            </div>
            <div style={{ fontSize: 8.5, color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Projectcontrole
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)', marginRight: 28, flexShrink: 0 }} />

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'stretch', flex: 1, height: '100%' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
                style={{
                  position: 'relative', padding: '0 15px', border: 'none',
                  borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'var(--text-muted)',
                  backgroundColor: 'transparent',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {tab.id === 'actielijst' && kritiekCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 8, right: 4,
                    backgroundColor: 'var(--red)', color: '#fff',
                    borderRadius: 10, fontSize: 8.5, fontWeight: 700,
                    padding: '1px 5px', lineHeight: '14px',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: '0 0 8px var(--red-glow)',
                  }}>
                    {kritiekCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          padding: '5px 12px', borderRadius: 20,
          border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.025)',
        }}>
          {lastRun ? (
            <>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: 'var(--green)',
                animation: 'pulse-dot 2.4s ease infinite',
              }} />
              <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                {lastRun.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : (
            <>
              <Activity size={11} color="var(--text-muted)" />
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                geen data
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
