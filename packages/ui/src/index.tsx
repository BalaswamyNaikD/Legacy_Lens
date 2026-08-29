import type { ReactNode } from 'react';

export function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e5eefb' }}>{title}</h3>
      {badge ? (
        <span style={{ background: '#27385d', color: '#b4d0ff', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function StatCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    neutral: { bg: '#15233f', border: '#2f4567', accent: '#8eb7ff' },
    success: { bg: '#123026', border: '#2f6f5a', accent: '#5ed9a8' },
    warning: { bg: '#352c18', border: '#7a6032', accent: '#f4c35d' },
    danger: { bg: '#331a20', border: '#6d2f3a', accent: '#ff7f8a' }
  };

  const style = colors[tone];

  return (
    <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 12, padding: 16, minHeight: 108 }}>
      <div style={{ color: style.accent, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#f5f8ff', lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#8ea0c1', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
