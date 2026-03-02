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

registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF1cXmhKYVFzWmFZfVhgcV9DZlZUQmYuP1ZhSXxVdkdhX39YcX1WR2RbU0V9XEA=');

const SAMPLE_DATA = {
  "barcode_1": {
    "page": 11, "confidence": 0.955,
    "coordinates": [0.341, 0.302, 0.651, 0.421],
    "image_width": 1700, "image_height": 2200
  },
  "barcode_2": {
    "page": 12, "confidence": 0.943,
    "coordinates": [0.348, 0.306, 0.645, 0.420],
    "image_width": 1700, "image_height": 2200
  },
  "signature_1": {
    "page": 8, "confidence": 0.730,
    "coordinates": [0.576, 0.118, 0.715, 0.172],
    "image_width": 1700, "image_height": 2789
  },
  "signature_2": {
    "page": 8, "confidence": 0.399,
    "coordinates": [0.044, 0.086, 0.271, 0.139],
    "image_width": 1700, "image_height": 2789
  },
  "signature_3": {
    "page": 14, "confidence": 0.829,
    "coordinates": [0.046, 0.120, 0.442, 0.205],
    "image_width": 1700, "image_height": 2789
  },
  "signature_4": {
    "page": 14, "confidence": 0.438,
    "coordinates": [0.154, 0.236, 0.488, 0.308],
    "image_width": 1700, "image_height": 2789
  },
  "signature_5": {
    "page": 29, "confidence": 0.833,
    "coordinates": [0.074, 0.776, 0.351, 0.850],
    "image_width": 1700, "image_height": 2182
  },
  "Due_Date-Variable": {
    "answer": "03/01/2026", "page_number": 1, "confidence_score": 1,
    "original_value": "1st Payment Date: MARCH 1, 2026"
  },
  "Effective_Date-Fixed": {
    "answer": "01/23/2026", "page_number": 1, "confidence_score": 1,
    "original_value": "Disbursement Date: JANUARY 23, 2026"
  },
  "Credit_Limit-Fixed": {
    "answer": "$47,400.00", "page_number": 15, "confidence_score": 1,
    "original_value": "Credit Limit: $47,400.00"
  },
  "Loan_Maturity_Date-Fixed": {
    "answer": "02/01/2036", "page_number": 15, "confidence_score": 0.9,
    "original_value": "FEBRUARY 1, 2036"
  },
  "Late_Fee-Fixed": {
    "answer": "5.000%", "page_number": 18, "confidence_score": 0.9,
    "original_value": "late fee of 5.000%"
  },
  "Primary_Borrower_Last_Name-Fixed": {
    "answer": "IVY", "page_number": 15, "confidence_score": 0.95,
    "original_value": "REGINA L IVY"
  },
  "Property_Mailing_City-Fixed": {
    "answer": "STATE COURT OF BIBB COUNTY STATE OF GEORGIA", "page_number": 15, "confidence_score": 1,
    "original_value": "MOBILE, AL 36609-3010"
  },
};

const isBarcodeKey   = (k) => /barcode/i.test(k);
const isSignatureKey = (k) => /signature|sign/i.test(k);
const hasCoords      = (v) => Array.isArray(v?.coordinates) && v.coordinates.length === 4;

// ─────────────────────────────────────────────────────────────────
// HOW THE HIGHLIGHT WORKS
// ─────────────────────────────────────────────────────────────────
// We use Syncfusion's official annotation API: viewer.annotation.addAnnotation()
// This draws a Rectangle annotation directly on the PDF canvas — it handles
// zoom, scroll, page rendering automatically. No DOM hacking needed.
//
// Coordinates from API are normalised 0-1 fractions of image size.
// Syncfusion's addAnnotation expects pixel values at 100% zoom relative
// to the page's natural PDF point size (width/height from viewer.pageData).
//
// Conversion:
//   sfX = x_fraction * pageWidth_pts
//   sfY = y_fraction * pageHeight_pts
//
// We store the annotation ID so we can delete it before drawing a new one.
// ─────────────────────────────────────────────────────────────────

export default function App() {
  const viewerRef    = useRef(null);
  const fileInputRef = useRef(null);

  const [fileName,       setFileName]       = useState('No file loaded');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [totalPages,     setTotalPages]     = useState(0);
  const [searchText,     setSearchText]     = useState('');
  const [activeKey,      setActiveKey]      = useState(null);
  const [searchResults,  setSearchResults]  = useState({ current: 0, total: 0 });
  const [isSearching,    setIsSearching]    = useState(false);
  const [pdfLoaded,      setPdfLoaded]      = useState(false);
  const [dragging,       setDragging]       = useState(false);
  // Track the active overlay to show
  const [activeOverlay,  setActiveOverlay]  = useState(null);

  // ── Effect to inject overlay directly into page DOM ───────────
  // This makes the overlay move naturally with the page (like react-pdf-viewer)
  useEffect(() => {
    if (!activeOverlay || !pdfLoaded || currentPage !== activeOverlay.page) {
      // Remove any existing overlay
      const existingOverlay = document.getElementById('sf-page-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      return;
    }

    // Find the specific page element in Syncfusion's DOM
    const attachOverlayToPage = () => {
      const pageContainer = document.querySelector(
        `#pdf-viewer-container_pageDiv_${activeOverlay.page - 1}`
      );

      if (!pageContainer) {
        setTimeout(attachOverlayToPage, 100);
        return;
      }

      // Remove any existing overlay first
      const existingOverlay = document.getElementById('sf-page-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create overlay div
      const overlayDiv = document.createElement('div');
      overlayDiv.id = 'sf-page-overlay';
      
      const [x1, y1, x2, y2] = activeOverlay.coordinates;
      const isBarcode = activeOverlay.type === 'barcode';
      
      // Style the overlay - positioned absolutely within the page container
      Object.assign(overlayDiv.style, {
        position: 'absolute',
        left: `${x1 * 100}%`,
        top: `${y1 * 100}%`,
        width: `${(x2 - x1) * 100}%`,
        height: `${(y2 - y1) * 100}%`,
        border: isBarcode ? '3px solid #2563EB' : '3px solid #f97316',
        backgroundColor: isBarcode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(249, 115, 22, 0.15)',
        pointerEvents: 'none',
        zIndex: '9999',
        boxSizing: 'border-box',
      });

      // Make sure the page container has position relative
      if (getComputedStyle(pageContainer).position === 'static') {
        pageContainer.style.position = 'relative';
      }

      // Append overlay as a child of the page container
      pageContainer.appendChild(overlayDiv);
    };

    // Initial attachment with delay to ensure page is rendered
    setTimeout(attachOverlayToPage, 200);

    // Cleanup: remove overlay when component unmounts or overlay changes
    return () => {
      const existingOverlay = document.getElementById('sf-page-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    };
  }, [activeOverlay, currentPage, pdfLoaded]);

  // ── Syncfusion events ─────────────────────────────────────────
  const onDocumentLoaded = useCallback((args) => {
    setPdfLoaded(true);
    const count = args?.pageCount ?? 0;
    if (count > 0) setTotalPages(count);
    setCurrentPage(1);
    setActiveOverlay(null);
  }, []);

  useEffect(() => {
    if (!pdfLoaded) return;
    const t = setTimeout(() => {
      const c = viewerRef.current?.pageCount;
      if (c > 0) setTotalPages(c);
    }, 800);
    return () => clearTimeout(t);
  }, [pdfLoaded]);

  const onPageChanged = useCallback((args) => {
    if (args?.currentPageNumber) setCurrentPage(args.currentPageNumber);
  }, []);

  const onSearchHighlight = useCallback((args) => {
    if (args?.searchCount != null)
      setSearchResults(prev => ({ ...prev, total: args.searchCount }));
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const goToPage = useCallback((page) => {
    viewerRef.current?.navigation.goToPage(page);
  }, []);

  // ── Text search ───────────────────────────────────────────────
  const doSearch = useCallback((text) => {
    if (!viewerRef.current || !text?.trim()) return;
    viewerRef.current.textSearch.searchText(text, false);
    setIsSearching(true);
    setSearchResults({ current: 1, total: 0 });
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    setActiveKey(null);
    setActiveOverlay(null);
    if (text.trim()) {
      doSearch(text);
    } else {
      viewerRef.current?.textSearch.cancelTextSearch();
      setIsSearching(false);
      setSearchResults({ current: 0, total: 0 });
    }
  }, [doSearch]);

  const handleSearchNext = useCallback(() => {
    if (!isSearching) return;
    viewerRef.current?.textSearch.searchNext();
    setSearchResults(p => ({ ...p, current: p.current < p.total ? p.current + 1 : 1 }));
  }, [isSearching]);

  const handleSearchPrev = useCallback(() => {
    if (!isSearching) return;
    viewerRef.current?.textSearch.searchPrevious();
    setSearchResults(p => ({ ...p, current: p.current > 1 ? p.current - 1 : p.total }));
  }, [isSearching]);

  const clearSearch = useCallback(() => {
    viewerRef.current?.textSearch.cancelTextSearch();
    setSearchText('');
    setIsSearching(false);
    setSearchResults({ current: 0, total: 0 });
    setActiveKey(null);
    setActiveOverlay(null);
  }, []);

  // ── Data panel click handler ──────────────────────────────────
  const handleDataItemClick = useCallback((key, valueObj) => {
    setActiveKey(key);

    if (hasCoords(valueObj)) {
      // ── Barcode / Signature → show CSS overlay ─────────────
      viewerRef.current?.textSearch.cancelTextSearch();
      setIsSearching(false);
      setSearchResults({ current: 0, total: 0 });
      setSearchText('');

      const overlay = {
        key,
        type:         isBarcodeKey(key) ? 'barcode' : 'signature',
        page:         valueObj.page,
        coordinates:  valueObj.coordinates,
      };
      setActiveOverlay(overlay);

      // Navigate to the page
      goToPage(valueObj.page);

    } else {
      // ── Regular field → text search ────────────────────────
      setActiveOverlay(null);

      const primary  = valueObj?.answer ?? valueObj?.value ?? '';
      const fallback = valueObj?.original_value ?? '';
      const pageNum  = valueObj?.page_number ?? valueObj?.page ?? 1;
      const text = (primary && primary !== 'null' && primary !== 'N/A') ? primary : fallback;

      setSearchText(text);
      if (pageNum > 0) goToPage(pageNum);
      setTimeout(() => {
        if (!text?.trim()) return;
        viewerRef.current?.textSearch.cancelTextSearch();
        viewerRef.current?.textSearch.searchText(text, false);
        setIsSearching(true);
        setSearchResults({ current: 1, total: 0 });
      }, 400);
    }
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
      setActiveOverlay(null);
      viewerRef.current?.load(`data:application/pdf;base64,${base64}`, null);
      setFileName(file.name);
      setCurrentPage(1);
    };
    reader.readAsDataURL(file);
  }, [clearSearch]);

  const handleFileInputChange = (e) => { loadFile(e.target.files[0]); e.target.value = ''; };
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); };
  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); };

  return (
    <div className="app-container">

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

        {/* ════ LEFT: PDF VIEWER ════ */}
        <div
          className="viewer-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="viewer-status-bar">
            <span className="status-filename">{fileName}</span>
            {pdfLoaded && totalPages > 0 && (
              <span className="status-page">Page {currentPage} / {totalPages}</span>
            )}
          </div>

          <div className="viewer-container">
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
                  <p className="drop-heading">{dragging ? 'Drop PDF here' : 'Open a PDF to get started'}</p>
                  <p className="drop-body">Drag &amp; drop a PDF file here, or click below</p>
                  <button className="drop-upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Open PDF File
                  </button>
                  <span className="drop-formats">PDF files only</span>
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf"
                  style={{ display: 'none' }} onChange={handleFileInputChange} />
              </div>
            )}

            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
              {/* Overlay is injected directly into page DOM via useEffect */}
            </div>
          </div>

          {pdfLoaded && (
            <div className="viewer-nav-bar">
              <div className="nav-controls">
                <button className="nav-btn"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div className="page-input-group">
                  <input
                    type="number" className="page-input"
                    value={currentPage} min={1} max={totalPages || 1}
                    onChange={(e) => {
                      const p = parseInt(e.target.value, 10);
                      if (p >= 1 && p <= totalPages) { setCurrentPage(p); goToPage(p); }
                    }}
                  />
                  <span className="page-total">/ {totalPages || '…'}</span>
                </div>
                <button className="nav-btn"
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
              <div className="zoom-controls">
                <button className="nav-btn" onClick={() => viewerRef.current?.magnification.zoomOut()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button className="nav-btn" onClick={() => viewerRef.current?.magnification.zoomIn()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </button>
                <button className="nav-btn fit-btn"
                  onClick={() => viewerRef.current?.fitPage('FitPage')}>Fit</button>
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT: DATA PANEL ════ */}
        <ExtractedDataPanel
          data={SAMPLE_DATA}
          activeKey={activeKey}
          activeOverlay={activeOverlay}
          currentPage={currentPage}
          pdfLoaded={pdfLoaded}
          onItemClick={handleDataItemClick}
          onPageClick={goToPage}
        />
      </div>
    </div>
  );
}