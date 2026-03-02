import React, { useState, useMemo } from 'react';
import './ExtractedDataPanel.css';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const isBarcodeKey    = (key) => /barcode/i.test(key);
const isSignatureKey  = (key) => /signature|sign/i.test(key);
const isSpecialKey    = (key) => isBarcodeKey(key) || isSignatureKey(key);
const hasCoords       = (v)   => Array.isArray(v?.coordinates) && v.coordinates.length === 4;

// Normalize a raw API entry into a display-friendly shape
const normalizeEntry = (key, raw) => {
  const isSpecial = isSpecialKey(key) && hasCoords(raw);
  return {
    key,
    isBarcode:   isBarcodeKey(key),
    isSignature: isSignatureKey(key),
    isSpecial,
    // For regular fields
    answer:       raw?.answer    ?? raw?.value    ?? '',
    original_value: raw?.original_value ?? '',
    page:         raw?.page_number ?? raw?.page ?? 0,
    confidence:   raw?.confidence_score ?? raw?.confidence ?? 0,
    // For barcode/signature fields
    coordinates:  raw?.coordinates ?? null,
    image_width:  raw?.image_width  ?? null,
    image_height: raw?.image_height ?? null,
    // raw for forwarding to click handler
    raw,
  };
};

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
function ConfidenceBadge({ score }) {
  // score is 0-1 from API, show as %
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  const cls = pct >= 90 ? 'score-high' : pct >= 70 ? 'score-mid' : 'score-low';
  return (
    <div className={`confidence-badge ${cls}`}>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="confidence-value">{pct}%</span>
    </div>
  );
}

// Badge shown in the Value column for barcode rows
function BarcodeValueBadge({ coordinates, page }) {
  const [x1, y1, x2, y2] = coordinates;
  return (
    <div className="special-value-cell">
      <span className="special-type-badge badge-barcode">
        {/* Barcode icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="7"  y1="7"  x2="7"  y2="17"/>
          <line x1="10" y1="7"  x2="10" y2="17"/>
          <line x1="13" y1="7"  x2="13" y2="17"/>
          <line x1="17" y1="7"  x2="17" y2="17"/>
        </svg>
        Barcode
      </span>
      <span className="special-coords">
        [{x1.toFixed(3)}, {y1.toFixed(3)}, {x2.toFixed(3)}, {y2.toFixed(3)}]
      </span>
    </div>
  );
}

// Badge shown in the Value column for signature rows
function SignatureValueBadge({ coordinates, page }) {
  const [x1, y1, x2, y2] = coordinates;
  return (
    <div className="special-value-cell">
      <span className="special-type-badge badge-signature">
        {/* Signature / pen icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 17c2-2 4-4 6-3s2 3 4 2 3-4 5-5"/>
          <line x1="3" y1="21" x2="21" y2="21"/>
        </svg>
        Signature
      </span>
      <span className="special-coords">
        [{x1.toFixed(3)}, {y1.toFixed(3)}, {x2.toFixed(3)}, {y2.toFixed(3)}]
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
export default function ExtractedDataPanel({
  data,          // raw API object  { key: valueObj, ... }
  activeKey,     // string key of the active row
  activeOverlay, // { key, type, page, ... } or null
  currentPage,
  pdfLoaded,
  onItemClick,   // (key, rawValueObj) => void
  onPageClick,   // (pageNum) => void
}) {
  const [filterText,      setFilterText]      = useState('');
  const [filterPage,      setFilterPage]      = useState('all');
  const [showBarcodes,    setShowBarcodes]    = useState(true);
  const [showSignatures,  setShowSignatures]  = useState(true);
  const [sortField,       setSortField]       = useState('page'); // 'page' | 'key' | 'confidence'
  const [sortAsc,         setSortAsc]         = useState(true);

  // Normalise all entries once
  const rows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([key, raw]) => normalizeEntry(key, raw));
  }, [data]);

  const hasBarcodes   = rows.some(r => r.isBarcode);
  const hasSignatures = rows.some(r => r.isSignature);

  // Unique pages (regular fields only)
  const uniquePages = useMemo(() => {
    const pages = rows
      .filter(r => !r.isSpecial && r.page > 0)
      .map(r => r.page);
    return [...new Set(pages)].sort((a, b) => a - b);
  }, [rows]);

  // Sort helper
  const handleSort = (field) => {
    if (sortField === field) { setSortAsc(p => !p); } else { setSortField(field); setSortAsc(true); }
  };
  const SortIcon = ({ field }) => (
    <svg
      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ opacity: sortField === field ? 1 : 0.3, transform: sortField === field && !sortAsc ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
    >
      <polyline points="6 9 12 3 18 9"/>
    </svg>
  );

  // Filter + sort
  const visibleRows = useMemo(() => {
    let list = rows.filter(r => {
      if (r.isBarcode   && !showBarcodes)   return false;
      if (r.isSignature && !showSignatures)  return false;

      const pageMatch = filterPage === 'all' || r.page === parseInt(filterPage);
      const q = filterText.toLowerCase();
      const textMatch = !q ||
        r.key.toLowerCase().includes(q) ||
        r.answer.toLowerCase().includes(q);
      return pageMatch && textMatch;
    });

    // Sort: specials always at bottom, then by chosen field
    list.sort((a, b) => {
      // special rows last
      const sa = a.isSpecial ? 1 : 0;
      const sb = b.isSpecial ? 1 : 0;
      if (sa !== sb) return sa - sb;

      let va, vb;
      if (sortField === 'key') { va = a.key; vb = b.key; return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortField === 'confidence') { va = a.confidence; vb = b.confidence; }
      else { va = a.page; vb = b.page; } // default: page

      // Push page:0 (not found) to bottom
      if (va === 0 && vb !== 0) return 1;
      if (vb === 0 && va !== 0) return -1;
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [rows, filterText, filterPage, showBarcodes, showSignatures, sortField, sortAsc]);

  const handleClick = (row) => {
    onItemClick(row.key, row.raw);
  };

  const handlePageClick = (e, page) => {
    e.stopPropagation();
    if (page > 0) onPageClick(page);
  };

  return (
    <aside className="data-panel">

      {/* ── Header ── */}
      <div className="panel-header">
        <div className="panel-title-row">
          <div className="panel-title">
            <div className="panel-title-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            Extracted Data
          </div>
          <div className="panel-badges">
            <span className="badge badge-blue">Profile: demo</span>
            <span className="badge badge-purple">Version: v2</span>
          </div>
        </div>

        {/* Show/hide toggles for barcodes & signatures */}
        {(hasBarcodes || hasSignatures) && (
          <div className="type-toggle-row">
            {hasBarcodes && (
              <label className="type-toggle">
                <input type="checkbox" checked={showBarcodes} onChange={e => setShowBarcodes(e.target.checked)} />
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="7" y1="7" x2="7" y2="17"/><line x1="10" y1="7" x2="10" y2="17"/>
                  <line x1="13" y1="7" x2="13" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/>
                </svg>
                Show Barcodes
              </label>
            )}
            {hasSignatures && (
              <label className="type-toggle">
                <input type="checkbox" checked={showSignatures} onChange={e => setShowSignatures(e.target.checked)} />
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 17c2-2 4-4 6-3s2 3 4 2 3-4 5-5"/>
                  <line x1="3" y1="21" x2="21" y2="21"/>
                </svg>
                Show Signatures
              </label>
            )}
          </div>
        )}

        {/* Filter row */}
        <div className="panel-filters">
          <div className="filter-search">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" placeholder="Filter fields..."
              value={filterText} onChange={e => setFilterText(e.target.value)}
              className="filter-input"
            />
          </div>
          <select className="filter-select" value={filterPage} onChange={e => setFilterPage(e.target.value)}>
            <option value="all">All pages</option>
            {uniquePages.map(p => <option key={p} value={p}>Page {p}</option>)}
          </select>
        </div>

        {/* Column headers */}
        <div className="table-header">
          <div className="col-key th-sortable" onClick={() => handleSort('key')}>
            KEY <SortIcon field="key" />
          </div>
          <div className="col-value">VALUE / LOCATION</div>
          <div className="col-page th-sortable" onClick={() => handleSort('page')}>
            PAGE <SortIcon field="page" />
          </div>
          <div className="col-score th-sortable" onClick={() => handleSort('confidence')}>
            CONF <SortIcon field="confidence" />
          </div>
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="panel-body">
        {visibleRows.length === 0 ? (
          <div className="no-results">No matching fields</div>
        ) : (
          visibleRows.map((row) => {
            const isActive        = activeKey === row.key;
            const isOverlayActive = activeOverlay?.key === row.key;

            return (
              <div
                key={row.key}
                className={[
                  'data-row',
                  isActive          ? 'row-active'          : '',
                  isOverlayActive   ? 'row-overlay-active'  : '',
                  row.isBarcode     ? 'row-barcode'         : '',
                  row.isSignature   ? 'row-signature'       : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(row)}
                title={
                  row.isSpecial
                    ? `Click to highlight ${row.isBarcode ? 'barcode' : 'signature'} on PDF page ${row.page}`
                    : `Search "${row.answer}"`
                }
              >
                {/* ── Key cell ── */}
                <div className="cell col-key key-cell">
                  {row.isBarcode   && <span className="type-dot dot-barcode"   />}
                  {row.isSignature && <span className="type-dot dot-signature" />}
                  <span className="key-text">{row.key}</span>
                  {/* Icon hint */}
                  <span className="hint-icon">
                    {row.isSpecial ? (
                      // location pin
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    ) : (
                      // search
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    )}
                  </span>
                </div>

                {/* ── Value cell ── */}
                <div className="cell col-value value-cell">
                  {row.isBarcode && row.coordinates ? (
                    <BarcodeValueBadge coordinates={row.coordinates} page={row.page} />
                  ) : row.isSignature && row.coordinates ? (
                    <SignatureValueBadge coordinates={row.coordinates} page={row.page} />
                  ) : (
                    <>
                      <span className="value-text">
                        {row.answer === 'null' || row.answer === 'N/A' || !row.answer
                          ? <span className="value-na">—</span>
                          : row.answer}
                      </span>
                      <span className="hint-icon">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                      </span>
                    </>
                  )}
                </div>

                {/* ── Page cell ── */}
                <div className="cell col-page">
                  {row.page > 0 ? (
                    <button
                      className={`page-link ${currentPage === row.page ? 'current-page' : ''}`}
                      onClick={(e) => handlePageClick(e, row.page)}
                    >
                      {row.page}
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  ) : (
                    <span className="value-na">—</span>
                  )}
                </div>

                {/* ── Confidence cell ── */}
                <div className="cell col-score">
                  {row.confidence > 0 ? (
                    <ConfidenceBadge score={row.confidence} />
                  ) : (
                    <span className="value-na">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="panel-footer">
        <span className="footer-count">{visibleRows.length} of {rows.length} fields</span>

        {/* Active overlay status */}
        {activeOverlay && (
          <span className={`overlay-status ${activeOverlay.type === 'barcode' ? 'status-barcode' : 'status-signature'}`}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Showing {activeOverlay.type} · pg {activeOverlay.page}
          </span>
        )}

        <button className="extract-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
          </svg>
          Extract Again
        </button>
      </div>
    </aside>
  );
}