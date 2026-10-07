import React, { useState } from 'react';
import { INITIAL_TOP_SELLERS } from './adminData';

export const RightAnalyticsSidebar = ({ metrics, orders }) => {
  const [period, setPeriod] = useState('This month');

  // SVG Gauge calculations
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  // 65% arc for shipments, remainder for pickups
  const shipmentPct = 0.65;
  const strokeDashoffset = circumference - shipmentPct * circumference;

  return (
    <aside className="admin-insights-panel">
      {/* 1. Receipt of Goods / Fulfillment Section */}
      <div className="insights-card">
        <div className="insights-card-header">
          <h4>RECEIPT OF GOODS</h4>
          <span className="insights-tag">LIVE</span>
        </div>

        <div className="fulfillment-gauge-wrap">
          <div className="gauge-svg-box">
            <svg className="gauge-svg" width="150" height="150" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="gauge-bg"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="gauge-progress shipments"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="gauge-progress pickups"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference - (0.35 * circumference),
                  transform: `rotate(${shipmentPct * 360}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </svg>
            <div className="gauge-center-text">
              <strong className="gauge-amount">{metrics.fulfillment.totalFormatted}</strong>
              <span className="gauge-sub">{metrics.fulfillment.totalOrdersCount} orders</span>
            </div>
          </div>

          <div className="gauge-legend">
            <div className="legend-item">
              <span className="legend-dot shipments-dot"></span>
              <div>
                <strong>{metrics.fulfillment.shipmentsAmount}</strong>
                <small>{metrics.fulfillment.shipmentsCount} shipments</small>
              </div>
            </div>
            <div className="legend-item">
              <span className="legend-dot pickups-dot"></span>
              <div>
                <strong>{metrics.fulfillment.pickupsAmount}</strong>
                <small>{metrics.fulfillment.pickupsCount} pickups</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Orders Status Section */}
      <div className="insights-card">
        <div className="insights-card-header">
          <h4>ORDERS STATUS</h4>
          <span className="insights-sublink">Active ▾</span>
        </div>

        {/* Unified multi-color bar */}
        <div className="order-status-bar-multi">
          <div className="status-segment paid" style={{ width: '89%' }} title="Paid: 89%"></div>
          <div className="status-segment cancelled" style={{ width: '8%' }} title="Cancelled: 8%"></div>
          <div className="status-segment refunded" style={{ width: '3%' }} title="Refunded: 3%"></div>
        </div>

        <div className="order-status-list">
          <div className="status-row">
            <div className="status-label">
              <span className="dot-status paid-dot"></span>
              <span>Paid</span>
            </div>
            <strong>89%</strong>
          </div>
          <div className="status-row">
            <div className="status-label">
              <span className="dot-status cancelled-dot"></span>
              <span>Cancelled</span>
            </div>
            <strong>8%</strong>
          </div>
          <div className="status-row">
            <div className="status-label">
              <span className="dot-status refunded-dot"></span>
              <span>Refunded</span>
            </div>
            <strong>3%</strong>
          </div>
        </div>
      </div>

      {/* 3. Overview Metrics Grid */}
      <div className="insights-card">
        <div className="insights-card-header">
          <h4>OVERVIEW</h4>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="insights-select"
          >
            <option value="This month">This month</option>
            <option value="Last month">Last month</option>
            <option value="This year">This year</option>
          </select>
        </div>

        <div className="overview-kpi-grid">
          <div className="overview-kpi-item">
            <span className="overview-kpi-val">₹{typeof metrics.averageOrderValue === 'number' ? metrics.averageOrderValue.toFixed(2) : metrics.averageOrderValue}</span>
            <span className="overview-kpi-label">Average order</span>
          </div>
          <div className="overview-kpi-item">
            <span className="overview-kpi-val">{typeof metrics.totalRevenue === 'string' && metrics.totalRevenue.startsWith('₹') ? metrics.totalRevenue : `₹${Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}`}</span>
            <span className="overview-kpi-label">Total revenue</span>
          </div>
          <div className="overview-kpi-item">
            <span className="overview-kpi-val">{metrics.processingTimeMin} min</span>
            <span className="overview-kpi-label">Processing time</span>
          </div>
          <div className="overview-kpi-item">
            <span className="overview-kpi-val">{metrics.avgItemsPerOrder}</span>
            <span className="overview-kpi-label">Avg. items/order</span>
          </div>
          <div className="overview-kpi-item">
            <span className="overview-kpi-val text-success">{metrics.pendingRate}</span>
            <span className="overview-kpi-label">Pending orders</span>
          </div>
          <div className="overview-kpi-item">
            <span className="overview-kpi-val text-muted">{metrics.rejectRate}</span>
            <span className="overview-kpi-label">Reject rate</span>
          </div>
        </div>
      </div>

      {/* 4. Top Sellers Section */}
      <div className="insights-card">
        <div className="insights-card-header">
          <h4>TOP SELLERS</h4>
          <span className="insights-sublink">This month ▾</span>
        </div>

        <div className="top-sellers-list">
          {INITIAL_TOP_SELLERS.map((item) => (
            <div key={item.id} className="top-seller-row">
              <img src={item.imageUrl} alt={item.title} className="seller-thumb" />
              <div className="seller-meta">
                <span className="seller-title" title={item.title}>{item.title}</span>
                <span className="seller-sub">{item.subtitle}</span>
              </div>
              <div className="seller-stat">
                <strong>{item.salesCount}</strong>
                <small>sold</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
