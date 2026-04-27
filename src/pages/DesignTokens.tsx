import { useState } from 'react';
import './DesignTokens.css';

/* ── Token data pulled from variables.css ── */

interface ColorToken {
  token: string;
  light: string;
  dark: string;
  usage: string;
}

interface ValueToken {
  token: string;
  value: string;
  usage: string;
}

const backgrounds: ColorToken[] = [
  { token: 'bg-primary', light: '#FFFFFF', dark: '#121212', usage: 'Main app background' },
  { token: 'bg-secondary', light: '#F5F2EF', dark: '#1E1E1E', usage: 'Cards, sheets, grouped sections' },
  { token: 'bg-tertiary', light: '#EBE7E2', dark: '#2A2A2A', usage: 'Nested containers, input fields' },
  { token: 'bg-elevated', light: '#FFFFFF', dark: '#242424', usage: 'Modals, popovers, floating elements' },
  { token: 'bg-grouped', light: '#F2F2F7', dark: '#1C1C1E', usage: 'Grouped table view background' },
];

const surfaces: ColorToken[] = [
  { token: 'sf-accent', light: '#D4734A', dark: '#E0845A', usage: 'Primary action fills, active tab indicator' },
  { token: 'sf-accent-sub', light: '#FDF0EB', dark: '#2E1F17', usage: 'Accent tinted backgrounds, badges' },
  { token: 'sf-success', light: '#E8F5E9', dark: '#1B2E1C', usage: 'Success states, confirmation banners' },
  { token: 'sf-warning', light: '#FFF3E0', dark: '#2E2214', usage: 'Warning banners, caution states' },
  { token: 'sf-error', light: '#FDECEA', dark: '#2E1717', usage: 'Error states, destructive action bg' },
  { token: 'sf-info', light: '#E3F2FD', dark: '#162638', usage: 'Informational banners, tips' },
  { token: 'sf-selected', light: '#FDF0EB', dark: '#2E1F17', usage: 'Selected list row, active filter chip' },
  { token: 'sf-disabled', light: '#F5F5F5', dark: '#1A1A1A', usage: 'Disabled button/card backgrounds' },
];

const texts: ColorToken[] = [
  { token: 'tx-primary', light: '#1A1714', dark: '#F0ECE7', usage: 'Main body text, headings' },
  { token: 'tx-secondary', light: '#6B6560', dark: '#9E9893', usage: 'Subtitles, captions, timestamps' },
  { token: 'tx-tertiary', light: '#A39E99', dark: '#5E5955', usage: 'Placeholder text, hints' },
  { token: 'tx-on-accent', light: '#FFFFFF', dark: '#FFFFFF', usage: 'Text on accent-colored surfaces' },
  { token: 'tx-link', light: '#D4734A', dark: '#E0845A', usage: 'Hyperlinks, tappable text actions' },
  { token: 'tx-success', light: '#2E7D32', dark: '#66BB6A', usage: 'Success messages' },
  { token: 'tx-warning', light: '#E65100', dark: '#FFA726', usage: 'Warning messages' },
  { token: 'tx-error', light: '#C62828', dark: '#EF5350', usage: 'Error messages, validation text' },
];

const icons: ColorToken[] = [
  { token: 'ic-primary', light: '#1A1714', dark: '#F0ECE7', usage: 'Default icon color' },
  { token: 'ic-secondary', light: '#8A8480', dark: '#7A7470', usage: 'Secondary icons, tab bar inactive' },
  { token: 'ic-tertiary', light: '#B5B0AB', dark: '#4A4540', usage: 'Decorative, low-emphasis icons' },
  { token: 'ic-accent', light: '#D4734A', dark: '#E0845A', usage: 'Active tab, selected icon' },
  { token: 'ic-on-accent', light: '#FFFFFF', dark: '#FFFFFF', usage: 'Icons on accent backgrounds' },
  { token: 'ic-success', light: '#2E7D32', dark: '#66BB6A', usage: 'Checkmarks, success indicators' },
  { token: 'ic-error', light: '#C62828', dark: '#EF5350', usage: 'Error, delete icons' },
];

const borders: ColorToken[] = [
  { token: 'bd-default', light: '#E5E0DB', dark: '#333333', usage: 'Standard dividers, separators' },
  { token: 'bd-subtle', light: '#F0EDE9', dark: '#262626', usage: 'Light dividers between list items' },
  { token: 'bd-strong', light: '#C8C3BE', dark: '#484848', usage: 'Prominent borders, active outlines' },
  { token: 'bd-accent', light: '#D4734A', dark: '#E0845A', usage: 'Focused input border, accent line' },
  { token: 'bd-error', light: '#C62828', dark: '#EF5350', usage: 'Error input border' },
  { token: 'bd-disabled', light: '#EBEBEB', dark: '#222222', usage: 'Disabled input/card border' },
];

const spacing: ValueToken[] = [
  { token: 'sp-2xs', value: '2px', usage: 'Hairline gaps' },
  { token: 'sp-xs', value: '4px', usage: 'Tight inner padding' },
  { token: 'sp-sm', value: '8px', usage: 'Small gaps, icon margins' },
  { token: 'sp-md', value: '12px', usage: 'Medium inner padding' },
  { token: 'sp-base', value: '16px', usage: 'Default body spacing' },
  { token: 'sp-lg', value: '20px', usage: 'Section padding' },
  { token: 'sp-xl', value: '24px', usage: 'Card padding, large gaps' },
  { token: 'sp-2xl', value: '32px', usage: 'Section margins' },
  { token: 'sp-3xl', value: '40px', usage: 'Page padding' },
  { token: 'sp-4xl', value: '48px', usage: 'Large layout spacing' },
  { token: 'sp-safe-bot', value: '34px', usage: 'Bottom safe area inset' },
  { token: 'sp-safe-top', value: '59px', usage: 'Top safe area inset (status bar)' },
];

const radii: ValueToken[] = [
  { token: 'rd-none', value: '0px', usage: 'No rounding' },
  { token: 'rd-xs', value: '4px', usage: 'Badges, progress bars' },
  { token: 'rd-sm', value: '8px', usage: 'Inputs, searchbar, segments' },
  { token: 'rd-md', value: '12px', usage: 'Cards, lists, accordions' },
  { token: 'rd-lg', value: '16px', usage: 'Large cards, panels' },
  { token: 'rd-xl', value: '20px', usage: 'Column containers' },
  { token: 'rd-2xl', value: '24px', usage: 'Sheets, modals' },
  { token: 'rd-full', value: '9999px', usage: 'Chips, pills, circles' },
];

const shadows: ValueToken[] = [
  { token: 'sh-xs', value: '0 1px 2px rgba(0,0,0,0.04)', usage: 'Datetime, subtle elevation' },
  { token: 'sh-sm', value: '0 2px 4px rgba(0,0,0,0.06)', usage: 'Cards' },
  { token: 'sh-md', value: '0 4px 12px rgba(0,0,0,0.08)', usage: 'FAB buttons' },
  { token: 'sh-lg', value: '0 8px 24px rgba(0,0,0,0.12)', usage: 'Column containers, panels' },
  { token: 'sh-xl', value: '0 16px 48px rgba(0,0,0,0.16)', usage: 'Modals, dialogs' },
  { token: 'sh-glow', value: '0 4px 16px rgba(212,115,74,0.25)', usage: 'Accent glow effect' },
  { token: 'sh-inner', value: 'inset 0 1px 2px rgba(0,0,0,0.06)', usage: 'Inset inputs, pressed states' },
];

const fonts: ValueToken[] = [
  { token: 'ft-cap2', value: '11px', usage: 'Smallest caption text' },
  { token: 'ft-cap1', value: '12px', usage: 'Section titles, labels' },
  { token: 'ft-foot', value: '13px', usage: 'Footnotes, fine print' },
  { token: 'ft-subhead', value: '15px', usage: 'Subheadings, list subtitles' },
  { token: 'ft-callout', value: '16px', usage: 'Callout text, button labels' },
  { token: 'ft-body', value: '17px', usage: 'Default body text' },
  { token: 'ft-headline', value: '17px', usage: 'List item headlines' },
  { token: 'ft-title3', value: '20px', usage: 'Small titles' },
  { token: 'ft-title2', value: '22px', usage: 'Medium titles' },
  { token: 'ft-title1', value: '28px', usage: 'Page titles' },
  { token: 'ft-large', value: '34px', usage: 'Large display headings' },
  { token: 'ft-display', value: '48px', usage: 'Hero / splash text' },
];

/* ── Swatch component ── */
const Swatch: React.FC<{ color: string }> = ({ color }) => (
  <span
    className="swatch"
    style={{ background: color, border: isLight(color) ? '1px solid #E5E0DB' : 'none' }}
  />
);

function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
}

/* ── Color Table ── */
const ColorTable: React.FC<{ title: string; tokens: ColorToken[] }> = ({ title, tokens }) => (
  <div className="token-group">
    <h3 className="token-group-title">{title}</h3>
    <div className="token-table-header color-row">
      <span className="col-token">Token</span>
      <span className="col-light">Light</span>
      <span className="col-dark">Dark</span>
      <span className="col-usage">Usage</span>
    </div>
    {tokens.map((t) => (
      <div key={t.token} className="token-table-row color-row">
        <span className="col-token token-name">{t.token}</span>
        <span className="col-light">
          <Swatch color={t.light} /> {t.light}
        </span>
        <span className="col-dark">
          <Swatch color={t.dark} /> {t.dark}
        </span>
        <span className="col-usage">{t.usage}</span>
      </div>
    ))}
  </div>
);

/* ── Value Table ── */
const ValueTable: React.FC<{ title: string; tokens: ValueToken[]; preview?: 'spacing' | 'radius' | 'shadow' | 'font' }> = ({
  title,
  tokens,
  preview,
}) => (
  <div className="token-group">
    <h3 className="token-group-title">{title}</h3>
    <div className="token-table-header value-row">
      <span className="col-token">Token</span>
      <span className="col-value">Value</span>
      <span className="col-preview">Preview</span>
      <span className="col-usage">Usage</span>
    </div>
    {tokens.map((t) => (
      <div key={t.token} className="token-table-row value-row">
        <span className="col-token token-name">{t.token}</span>
        <span className="col-value">{t.value}</span>
        <span className="col-preview">
          {preview === 'spacing' && (
            <span className="spacing-bar" style={{ width: t.value }} />
          )}
          {preview === 'radius' && (
            <span
              className="radius-box"
              style={{ borderRadius: t.value }}
            />
          )}
          {preview === 'shadow' && (
            <span className="shadow-box" style={{ boxShadow: t.value }} />
          )}
          {preview === 'font' && (
            <span className="font-preview" style={{ fontSize: t.value }}>Ag</span>
          )}
        </span>
        <span className="col-usage">{t.usage}</span>
      </div>
    ))}
  </div>
);

/* ── Main Page ── */
const DesignTokens: React.FC = () => {
  const [filter, setFilter] = useState('');

  const matchFilter = (token: { token: string; usage: string }) =>
    !filter ||
    token.token.toLowerCase().includes(filter.toLowerCase()) ||
    token.usage.toLowerCase().includes(filter.toLowerCase());

  const filterColorTokens = (tokens: ColorToken[]) => tokens.filter(matchFilter);
  const filterValueTokens = (tokens: ValueToken[]) => tokens.filter(matchFilter);

  return (
    <div className="design-tokens-page">
      <div className="dt-container">
        <h1 className="dt-title">iOS App Design Tokens</h1>
        <p className="dt-subtitle">
          Semantic tokens for todo lists, calendars, diaries, mood trackers, dashboards &amp; timers
          — warm neutral palette with earthy orange accent
        </p>

        <div className="dt-filter-wrap">
          <input
            className="dt-filter"
            type="text"
            placeholder="Filter tokens..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Colors */}
        <h2 className="dt-section-heading">Colors</h2>
        <div className="dt-card">
          {filterColorTokens(backgrounds).length > 0 && (
            <ColorTable title="Backgrounds" tokens={filterColorTokens(backgrounds)} />
          )}
          {filterColorTokens(surfaces).length > 0 && (
            <ColorTable title="Surfaces" tokens={filterColorTokens(surfaces)} />
          )}
          {filterColorTokens(texts).length > 0 && (
            <ColorTable title="Text" tokens={filterColorTokens(texts)} />
          )}
          {filterColorTokens(icons).length > 0 && (
            <ColorTable title="Icons" tokens={filterColorTokens(icons)} />
          )}
          {filterColorTokens(borders).length > 0 && (
            <ColorTable title="Borders" tokens={filterColorTokens(borders)} />
          )}
        </div>

        {/* Spacing */}
        <h2 className="dt-section-heading">Spacing</h2>
        <div className="dt-card">
          {filterValueTokens(spacing).length > 0 && (
            <ValueTable title="Spacing Scale" tokens={filterValueTokens(spacing)} preview="spacing" />
          )}
        </div>

        {/* Radius */}
        <h2 className="dt-section-heading">Radius</h2>
        <div className="dt-card">
          {filterValueTokens(radii).length > 0 && (
            <ValueTable title="Border Radius" tokens={filterValueTokens(radii)} preview="radius" />
          )}
        </div>

        {/* Shadows */}
        <h2 className="dt-section-heading">Shadows</h2>
        <div className="dt-card">
          {filterValueTokens(shadows).length > 0 && (
            <ValueTable title="Box Shadows" tokens={filterValueTokens(shadows)} preview="shadow" />
          )}
        </div>

        {/* Typography */}
        <h2 className="dt-section-heading">Typography</h2>
        <div className="dt-card">
          {filterValueTokens(fonts).length > 0 && (
            <ValueTable title="Font Sizes" tokens={filterValueTokens(fonts)} preview="font" />
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignTokens;
