import React, { useRef } from 'react';
import './Topbar.css';

export default function TopBar({
  fileName,
  searchText,
  onSearchChange,
  onSearchNext,
  onSearchPrev,
  onClearSearch,
  searchResults,
  isSearching,
  onFileUpload,
  pdfLoaded,
}) {
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onSearchPrev();
      else if (isSearching) onSearchNext();
      else if (searchText.trim()) onSearchChange(searchText);
    }
    if (e.key === 'Escape') onClearSearch();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileUpload(file);
    e.target.value = '';
  };

  return (
    <header className="topbar">

      {/* Brand */}
      <div className="topbar-brand">
        <div className="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span className="brand-name">Document<span className="brand-accent">Viewer</span></span>
      </div>

      <div className="topbar-divider" />

      {/* File name */}
      <span className="file-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        {fileName}
      </span>

      <div className="topbar-divider" />

      {/* Search bar */}
      <div className="topbar-search">
        <div className={`search-wrapper ${!pdfLoaded ? 'search-disabled' : ''}`}>
          <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>

          <input
            type="text"
            className="search-input"
            placeholder={pdfLoaded ? 'Search in PDF… (Enter = next, Shift+Enter = prev)' : 'Load a PDF first…'}
            value={searchText}
            disabled={!pdfLoaded}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Match counter */}
          {isSearching && searchResults.total > 0 && (
            <span className="search-count">
              {searchResults.current} / {searchResults.total}
            </span>
          )}

          {/* Prev / Next / Clear — only when there's search text */}
          {searchText && pdfLoaded && (
            <>
              <button className="search-btn" onClick={onSearchPrev} title="Previous match (Shift+Enter)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className="search-btn" onClick={onSearchNext} title="Next match (Enter)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button className="search-btn clear-btn" onClick={onClearSearch} title="Clear search (Esc)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        <button
          className="open-pdf-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Open PDF
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="topbar-avatar" title="Profile">M</div>
      </div>
    </header>
  );
}