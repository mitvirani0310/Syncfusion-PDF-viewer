import React, { useState } from 'react';
import './ExtractedDataPanel.css';

function ConfidenceBadge({ score }) {
  const getClass = () => {
    if (score >= 90) return 'score-high';
    if (score >= 75) return 'score-mid';
    return 'score-low';
  };

  const getBarWidth = () => `${score}%`;

  return (
    <div className={`confidence-badge ${getClass()}`}>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width: getBarWidth() }} />
      </div>
      <span className="confidence-value">{score}%</span>
    </div>
  );
}

export default function ExtractedDataPanel({
  data,
  activeItemId,
  onDataItemClick,
  onPageClick,
  currentPage
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [activeField, setActiveField] = useState(null); // 'key' or 'value'
  const [filterPage, setFilterPage] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const uniquePages = [...new Set(data.map(d => d.page))].sort((a, b) => a - b);

  const filteredData = data.filter(item => {
    const matchPage = filterPage === 'all' || item.page === parseInt(filterPage);
    const matchSearch = !searchFilter ||
      item.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.value.toLowerCase().includes(searchFilter.toLowerCase());
    return matchPage && matchSearch;
  });

  const handleItemClick = (item, field) => {
    setActiveField(field);
    onDataItemClick(item, field);
  };

  return (
    <aside className="data-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-row">
          <div className="panel-title">
            <div className="panel-title-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            Extracted Data
          </div>
          <div className="panel-badges">
            <span className="badge badge-blue">Profile: demo</span>
            <span className="badge badge-purple">Version: v2</span>
          </div>
        </div>
        
        {/* Filter row */}
        <div className="panel-filters">
          <div className="filter-search">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Filter fields..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <select
            className="filter-select"
            value={filterPage}
            onChange={e => setFilterPage(e.target.value)}
          >
            <option value="all">All pages</option>
            {uniquePages.map(p => (
              <option key={p} value={p}>Page {p}</option>
            ))}
          </select>
        </div>

        {/* Column Headers */}
        <div className="table-header">
          <div className="col-key">KEY</div>
          <div className="col-value">VALUE</div>
          <div className="col-page">PAGE</div>
          <div className="col-score">CONFIDENCE</div>
        </div>
      </div>

      {/* Data Rows */}
      <div className="panel-body">
        {filteredData.length === 0 ? (
          <div className="no-results">No matching fields found</div>
        ) : (
          filteredData.map((item) => {
            const isActive = activeItemId === item.id;
            const isHovered = hoveredId === item.id;

            return (
              <div
                key={item.id}
                className={`data-row ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Key Cell */}
                <div
                  className={`cell col-key key-cell ${isActive && activeField === 'key' ? 'cell-active' : ''}`}
                  onClick={() => handleItemClick(item, 'key')}
                  title={`Search for "${item.key}"`}
                >
                  <span className="key-text">{item.key}</span>
                  <span className="search-hint">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                </div>

                {/* Value Cell */}
                <div
                  className={`cell col-value value-cell ${isActive && activeField === 'value' ? 'cell-active' : ''}`}
                  onClick={() => handleItemClick(item, 'value')}
                  title={`Search for "${item.value}"`}
                >
                  <span className="value-text">{item.value}</span>
                  <span className="search-hint">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                </div>

                {/* Page Cell */}
                <div className="cell col-page">
                  <button
                    className={`page-link ${currentPage === item.page ? 'current-page' : ''}`}
                    onClick={() => onPageClick(item.page)}
                    title={`Go to page ${item.page}`}
                  >
                    {item.page}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                </div>

                {/* Confidence Cell */}
                <div className="cell col-score">
                  <ConfidenceBadge score={item.confidence} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="panel-footer">
        <span>{filteredData.length} of {data.length} fields</span>
        <button className="extract-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
          </svg>
          Extract Again
        </button>
      </div>
    </aside>
  );
}