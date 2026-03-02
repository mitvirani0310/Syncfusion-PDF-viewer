import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  PdfViewerComponent,
  Toolbar,
  Magnification,
  Navigation,
  LinkAnnotation,
  BookmarkView,
  ThumbnailView,
  Print,
  TextSelection,
  Annotation,
  TextSearch,
  FormFields,
  FormDesigner,
  Inject,
} from '@syncfusion/ej2-react-pdfviewer';
import { registerLicense } from '@syncfusion/ej2-base';
import ExtractedDataPanel from './components/ExtractedDataPanel';
import TopBar from './components/Topbar';
import './App.css';

// ─────────────────────────────────────────────────────────────────
// LICENSE KEY — paste your key from:
// https://www.syncfusion.com/account/claim-license-key
// ─────────────────────────────────────────────────────────────────
registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF1cXmhKYVFzWmFZfVhgcV9DZlZUQmYuP1ZhSXxVdkdhX39YcX1WR2RbU0V9XEA=');

// ───────────────────────────────────────────────────────────────
// SAMPLE EXTRACTED DATA — replace with your API response
// ─────────────────────────────────────────────────────────────────
const SAMPLE_EXTRACTED_DATA = [
  { id: 1, key: 'Debt/Suit Amount', value: null, page: 0, confidence: 0 },
  { id: 2, key: 'Servee Last Name', value: 'CRAFTER', page: 32, confidence: 100 },
  { id: 3, key: 'Court Case Number', value: null, page: 2, confidence: 0 },
  { id: 4, key: 'Servee First Name', value: 'HAROLD', page: 32, confidence: 100 },
  { id: 5, key: 'Client File Number', value: '5XXGT4L3XKG360137', page: 28, confidence: 90 },
  { id: 6, key: 'Servee Address ZIP', value: '31210-7903', page: 32, confidence: 100 },
  { id: 7, key: 'Servee Address City', value: 'MACON', page: 32, confidence: 100 },
  { id: 8, key: 'Court Name - Summons', value: 'STATE COURT OF BIBB COUNTY STATE OF GEORGIA', page: 32, confidence: 95 },
  { id: 9, key: 'Court Type - Summons', value: 'STATE', page: 32, confidence: 95 },
  { id: 10, key: 'Date Filed - Summons', value: null, page: 0, confidence: 0 },
  { id: 11, key: 'Servee Address State', value: 'GA', page: 32, confidence: 100 },
  { id: 12, key: 'Court State - Summons', value: 'GEORGIA', page: 32, confidence: 100 },
  { id: 13, key: 'Servee Street Address', value: '1090 SAINT ANDREWS RD', page: 32, confidence: 100 },
  { id: 14, key: 'Court Case Number-Temp', value: null, page: 32, confidence: 0 },
  { id: 15, key: 'Court County - Summons', value: 'BIBB', page: 32, confidence: 100 },
  { id: 16, key: 'Date Filed - Complaint', value: null, page: 0, confidence: 0 },
  { id: 17, key: 'Plaintiff Name - Summons', value: 'AMERICREDIT FINANCIAL SERVICES, INC., DBA GM FINANCIAL', page: 32, confidence: 100 },
  { id: 18, key: 'Primary Defendant Name - Summons', value: 'HAROLD CRAFTER', page: 32, confidence: 100 },
  { id: 19, key: 'Primary Defendant Address - Summons', value: '1090 SAINT ANDREWS RD MACON, GA 31210-7903', page: 32, confidence: 100 },
  { id: 20, key: 'Primary Defendant Address - Complaint', value: '1090 SAINT ANDREWS RD MACON, GA 31210', page: 18, confidence: 100 },
  { id: 21, key: 'Secondary Defendant/Garnishee Name - Summons', value: null, page: 0, confidence: 0 },
  { id: 22, key: 'Secondary Defendant/Garnishee Address - Summons', value: null, page: 0, confidence: 0 }
];

export default function App() {
  const viewerRef   = useRef(null);
  const fileInputRef = useRef(null);

  const [fileName,         setFileName]         = useState('No file loaded');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [totalPages,       setTotalPages]        = useState(0);
  const [searchText,       setSearchText]        = useState('');
  const [activeItemId,     setActiveItemId]      = useState(null);
  const [searchResults,    setSearchResults]     = useState({ current: 0, total: 0 });
  const [isSearching,      setIsSearching]       = useState(false);
  const [pdfLoaded,        setPdfLoaded]         = useState(false);
  const [dragging,         setDragging]          = useState(false);

  // ── Syncfusion event: document loaded ────────────────────────
  const onDocumentLoaded = useCallback((args) => {
    setPdfLoaded(true);
    // pageCount comes from the event args
    const count = args?.pageCount ?? args?.currentPageNumber ?? 0;
    if (count > 0) setTotalPages(count);
    setCurrentPage(1);
  }, []);

  // Fallback: poll for pageCount after load (Syncfusion sometimes
  // fires documentLoad before the count is available)
  useEffect(() => {
    if (!pdfLoaded) return;
    const timer = setTimeout(() => {
      const count = viewerRef.current?.pageCount;
      if (count && count > 0) setTotalPages(count);
    }, 800);
    return () => clearTimeout(timer);
  }, [pdfLoaded]);

  const onPageChanged = useCallback((args) => {
    if (args?.currentPageNumber) setCurrentPage(args.currentPageNumber);
  }, []);

  const onSearchHighlight = useCallback((args) => {
    if (args?.searchCount != null) {
      setSearchResults(prev => ({ ...prev, total: args.searchCount }));
    }
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const goToPage = useCallback((page) => {
    viewerRef.current?.navigation.goToPage(page);
  }, []);

  // ── Text search ───────────────────────────────────────────────
  const startSearch = useCallback((text) => {
    if (!viewerRef.current || !text.trim()) return;
    viewerRef.current.textSearch.searchText(text, false /* case-insensitive */);
    setIsSearching(true);
    setSearchResults({ current: 1, total: 0 });
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    setActiveItemId(null);
    if (text.trim()) {
      startSearch(text);
    } else {
      viewerRef.current?.textSearch.cancelTextSearch();
      setIsSearching(false);
      setSearchResults({ current: 0, total: 0 });
    }
  }, [startSearch]);

  const handleSearchNext = useCallback(() => {
    if (!isSearching) return;
    viewerRef.current?.textSearch.searchNext();
    setSearchResults(prev => ({
      ...prev,
      current: prev.current < prev.total ? prev.current + 1 : 1,
    }));
  }, [isSearching]);

  const handleSearchPrev = useCallback(() => {
    if (!isSearching) return;
    viewerRef.current?.textSearch.searchPrevious();
    setSearchResults(prev => ({
      ...prev,
      current: prev.current > 1 ? prev.current - 1 : prev.total,
    }));
  }, [isSearching]);

  const clearSearch = useCallback(() => {
    viewerRef.current?.textSearch.cancelTextSearch();
    setSearchText('');
    setIsSearching(false);
    setSearchResults({ current: 0, total: 0 });
    setActiveItemId(null);
  }, []);

  // ── Data panel click (key or value) ──────────────────────────
  const handleDataItemClick = useCallback((item, field) => {
    setActiveItemId(item.id);
    const text = field === 'key' ? item.key : item.value;
    setSearchText(text);
    goToPage(item.page);
    // slight delay to let page render before searching
    setTimeout(() => {
      viewerRef.current?.textSearch.cancelTextSearch();
      viewerRef.current?.textSearch.searchText(text, false);
      setIsSearching(true);
      setSearchResults({ current: 1, total: 0 });
    }, 400);
  }, [goToPage]);

  // ── File loading ─────────────────────────────────────────────
  const loadFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a PDF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setPdfLoaded(false);
      setTotalPages(0);
      clearSearch();
      viewerRef.current?.load(`data:application/pdf;base64,${base64}`, null);
      setFileName(file.name);
      setCurrentPage(1);
    };
    reader.readAsDataURL(file);
  }, [clearSearch]);

  const handleFileInputChange = (e) => {
    loadFile(e.target.files[0]);
    e.target.value = '';
  };

  // ── Drag & drop ───────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); };
  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); };

  return (
    <div className="app-container">

      {/* ═══ TOP BAR ═══ */}
      <TopBar
        fileName={fileName}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onSearchNext={handleSearchNext}
        onSearchPrev={handleSearchPrev}
        onClearSearch={clearSearch}
        searchResults={searchResults}
        isSearching={isSearching}
        onFileUpload={loadFile}
        pdfLoaded={pdfLoaded}
      />

      <div className="main-layout">

        {/* ═══ LEFT: PDF VIEWER ═══ */}
        <div
          className="viewer-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Status bar */}
          <div className="viewer-status-bar">
            <span className="status-filename">{fileName}</span>
            {pdfLoaded && totalPages > 0 && (
              <span className="status-page">Page {currentPage} / {totalPages}</span>
            )}
          </div>

          {/* Viewer + drop overlay */}
          <div className="viewer-container">

            {/* Empty / drag-drop state */}
            {!pdfLoaded && (
              <div
                className={`drop-overlay ${dragging ? 'drop-overlay-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-content">
                  <div className={`drop-icon-box ${dragging ? 'drop-icon-box-active' : ''}`}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <polyline points="9 15 12 12 15 15"/>
                    </svg>
                  </div>
                  <p className="drop-heading">
                    {dragging ? 'Drop PDF here' : 'Open a PDF to get started'}
                  </p>
                  <p className="drop-body">Drag &amp; drop a PDF file here, or click the button below</p>
                  <button
                    className="drop-upload-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Open PDF File
                  </button>
                  <span className="drop-formats">PDF files only</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
              </div>
            )}

            {/*
              ══════════════════════════════════════════════════════
               STANDALONE MODE — No server/backend required
               resourceUrl = Syncfusion WASM engine via CDN
               Do NOT add serviceUrl — that caused the Ajax error

               For production (offline):
                 cp -r node_modules/@syncfusion/ej2-pdfviewer/dist/ej2-pdfviewer-lib public/pdfviewer-resources
                 Then use: resourceUrl="/pdfviewer-resources"
              ══════════════════════════════════════════════════════
            */}
            <PdfViewerComponent
              ref={viewerRef}
              id="pdf-viewer-container"
              resourceUrl="https://cdn.syncfusion.com/ej2/24.1.41/dist/ej2-pdfviewer-lib"
              style={{ height: '100%', width: '100%' }}
              documentLoad={onDocumentLoaded}
              pageChange={onPageChanged}
              textSearchHighlight={onSearchHighlight}
              enableToolbar={false}
              enableNavigationToolbar={false}
              enableAnnotation={false}
              enableFormFields={false}
              enableTextSelection={true}
              enableTextSearch={true}
              enableMagnification={true}
              enablePrint={false}
              zoomValue={100}
            >
              <Inject services={[
                Toolbar, Magnification, Navigation,
                LinkAnnotation, BookmarkView, ThumbnailView,
                Print, TextSelection, Annotation,
                TextSearch, FormFields, FormDesigner,
              ]} />
            </PdfViewerComponent>
          </div>

          {/* Bottom nav — only visible after PDF is loaded */}
          {pdfLoaded && (
            <div className="viewer-nav-bar">
              <div className="nav-controls">
                <button
                  className="nav-btn"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>

                <div className="page-input-group">
                  <input
                    type="number"
                    className="page-input"
                    value={currentPage}
                    min={1}
                    max={totalPages || 1}
                    onChange={(e) => {
                      const p = parseInt(e.target.value, 10);
                      if (p >= 1 && p <= totalPages) { setCurrentPage(p); goToPage(p); }
                    }}
                  />
                  <span className="page-total">/ {totalPages || '…'}</span>
                </div>

                <button
                  className="nav-btn"
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  title="Next page"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              <div className="zoom-controls">
                <button className="nav-btn" onClick={() => viewerRef.current?.magnification.zoomOut()} title="Zoom out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button className="nav-btn" onClick={() => viewerRef.current?.magnification.zoomIn()} title="Zoom in">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button className="nav-btn fit-btn" onClick={() => viewerRef.current?.fitPage('FitPage')} title="Fit page">
                  Fit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: EXTRACTED DATA PANEL ═══ */}
        <ExtractedDataPanel
          data={SAMPLE_EXTRACTED_DATA}
          activeItemId={activeItemId}
          onDataItemClick={handleDataItemClick}
          onPageClick={(page) => goToPage(page)}
          currentPage={currentPage}
          pdfLoaded={pdfLoaded}
        />
      </div>
    </div>
  );
}