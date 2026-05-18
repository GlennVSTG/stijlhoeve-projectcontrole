interface Props {
  value: string
  small?: boolean
}

const STYLES: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  // Severity
  kritiek:    { bg: 'var(--red-dim)',   color: 'var(--red-bright)',   border: 'var(--red-border)',   dot: 'var(--red-bright)',   label: 'Kritiek' },
  controle:   { bg: 'var(--amber-dim)', color: 'var(--amber-bright)', border: 'var(--amber-border)', dot: 'var(--amber-bright)', label: 'Controle' },
  waarschuwing: { bg: 'var(--amber-dim)', color: 'var(--amber)',       border: 'var(--amber-border)', dot: 'var(--amber)',         label: 'Waarschuwing' },
  info:       { bg: 'var(--blue-dim)',  color: 'var(--blue-bright)',  border: 'var(--blue-border)',  dot: 'var(--blue-bright)',  label: 'Info' },

  // On-hold status
  'open':                   { bg: 'var(--green-dim)',  color: 'var(--green-bright)', border: 'var(--green-border)',           dot: 'var(--green-bright)', label: 'Open' },
  'on-hold-netbeheerder':   { bg: 'var(--red-dim)',    color: 'var(--red-bright)',   border: 'var(--red-border)',             dot: 'var(--red-bright)',   label: 'On hold netbeheerder' },
  'on-hold-klant':          { bg: 'var(--amber-dim)',  color: 'var(--amber-bright)', border: 'var(--amber-border)',           dot: 'var(--amber-bright)', label: 'On hold klant' },
  'on-hold-planning':       { bg: 'var(--amber-dim)',  color: 'var(--amber)',         border: 'var(--amber-border)',           dot: 'var(--amber)',         label: 'On hold planning intern' },
  'klaar-om-te-factureren': { bg: 'var(--blue-dim)',   color: 'var(--blue-bright)',  border: 'var(--blue-border)',            dot: 'var(--blue-bright)',  label: 'Klaar om te factureren' },

  // Order status
  'Open':         { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'rgba(255,255,255,0.10)', dot: 'var(--text-muted)',   label: 'Open' },
  'Gedeeltelijk': { bg: 'var(--amber-dim)',        color: 'var(--amber-bright)',   border: 'var(--amber-border)',    dot: 'var(--amber-bright)', label: 'Deels betaald' },
  'Volledig':     { bg: 'var(--green-dim)',         color: 'var(--green-bright)',   border: 'var(--green-border)',    dot: 'var(--green-bright)', label: 'Volledig' },
  'Geannuleerd':  { bg: 'var(--red-dim)',           color: 'var(--red-bright)',     border: 'var(--red-border)',      dot: 'var(--red-bright)',   label: 'Geannuleerd' },

  // Categorie
  service:     { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',     border: 'rgba(255,255,255,0.08)', dot: 'var(--text-muted)',   label: 'Service/Garantie' },
  commercieel: { bg: 'var(--green-dim)',        color: 'var(--green)',          border: 'var(--green-border)',    dot: 'var(--green)',        label: 'Commercieel' },
  geannuleerd: { bg: 'var(--red-dim)',           color: 'var(--red-bright)',     border: 'var(--red-border)',      dot: 'var(--red-bright)',   label: 'Geannuleerd' },
}

const DEFAULT_STYLE = { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'rgba(255,255,255,0.08)', dot: 'var(--text-muted)', label: '' }

export function StatusBadge({ value, small }: Props) {
  const cfg = STYLES[value] ?? { ...DEFAULT_STYLE, label: value }
  const label = cfg.label || value

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 7px 2px 6px' : '3px 10px 3px 8px',
      borderRadius: 20,
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: small ? 9.5 : 10.5,
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      letterSpacing: '0.025em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: small ? 5 : 6, height: small ? 5 : 6,
        borderRadius: '50%', backgroundColor: cfg.dot,
        flexShrink: 0, display: 'inline-block',
      }} />
      {label}
    </span>
  )
}
