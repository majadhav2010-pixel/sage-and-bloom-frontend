import React from 'react';
import './AdminDashboard.css';

export const AdminDashboard = ({ metrics, products, orders, onNavigateTab, onShowToast }) => {
  const formatCurrency = (val) =>
    typeof val === 'string' && (val.startsWith('₹') || val.startsWith('$'))
      ? val
      : `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lowStockProducts = products.filter((p) => p.stockQuantity <= 10);

  return (
    <div className="admin-dashboard">
      {/* Top Welcome Header */}
      <div className="dash-header">
        <div>
          <h2>Store Overview & Executive Metrics</h2>
          <p>Real-time performance metrics, botanical inventory health, and revenue breakdown</p>
        </div>
        <div className="dash-actions">
          <button
            type="button"
            className="btn btn-admin-primary"
            onClick={() => onNavigateTab('products')}
          >
            + Add New Soap
          </button>
          <button
            type="button"
            className="btn btn-admin-outline"
            onClick={() => onNavigateTab('orders')}
          >
            View All Orders →
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-title">Total Revenue</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="kpi-footer positive">
            <span>↑ +18.4%</span> vs last month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Orders</span>
            <span className="kpi-icon">📦</span>
          </div>
          <div className="kpi-value">{orders.length}</div>
          <div className="kpi-footer positive">
            <span>↑ +12.6%</span> vs last month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Botanical Items</span>
            <span className="kpi-icon">🧼</span>
          </div>
          <div className="kpi-value">{products.filter((p) => p.isActive).length}</div>
          <div className="kpi-footer">
            <span>{products.length}</span> total catalog formulas
          </div>
        </div>

        <div className={`kpi-card ${lowStockProducts.length > 0 ? 'warning' : ''}`}>
          <div className="kpi-header">
            <span className="kpi-title">Batch Inventory Alerts</span>
            <span className="kpi-icon">⚠️</span>
          </div>
          <div className="kpi-value">{lowStockProducts.length}</div>
          <div className="kpi-footer">
            {lowStockProducts.length > 0 ? (
              <span className="text-warning">Immediate curing batch needed</span>
            ) : (
              <span className="text-success">All inventory healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Chart & Low Stock Section */}
      <div className="dash-two-col">
        {/* Monthly Revenue Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3>Revenue Trend</h3>
              <small>Last 6 months sales and transaction velocity</small>
            </div>
            <span className="badge-growth">+24% Q3 Growth</span>
          </div>
          <div className="bar-chart-container">
            {metrics.monthlyRevenue.map((m) => {
              const maxRev = 14000;
              const heightPct = Math.round((m.revenue / maxRev) * 100);
              return (
                <div key={m.month} className="bar-col">
                  <div className="bar-tooltip">{formatCurrency(m.revenue)} ({m.orders} ord)</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${heightPct}%` }}></div>
                  </div>
                  <span className="bar-label">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Warning List */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3>Inventory Alerts</h3>
              <small>Artisan cold-process soaps low in stock</small>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigateTab('products')}
            >
              Manage
            </button>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.length === 0 ? (
              <p className="empty-state">No low stock alerts. Inventory is optimal.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="low-stock-item">
                  <img src={p.imageUrl} alt={p.title} className="stock-thumb" />
                  <div className="stock-info">
                    <strong>{p.title}</strong>
                    <small>{p.category} · {formatCurrency(p.price)}</small>
                  </div>
                  <div className="stock-badge-critical">
                    {p.stockQuantity} left
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="dash-card full-width">
        <div className="dash-card-header">
          <div>
            <h3>Live Order Stream</h3>
            <small>Latest transactions processed from customer storefront</small>
          </div>
          <button
            type="button"
            className="btn btn-admin-small"
            onClick={() => onNavigateTab('orders')}
          >
            Open Orders Hub →
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} onClick={() => onNavigateTab('orders')} style={{ cursor: 'pointer' }} title="Click to view in Orders Hub">
                  <td><strong style={{ color: 'var(--admin-accent-sage, #4D5E43)', textDecoration: 'underline' }}>{ord.orderNumber}</strong></td>
                  <td>
                    <div>{ord.customerName}</div>
                    <small className="text-muted">{ord.customerEmail}</small>
                  </td>
                  <td>
                    <span className="type-tag type-shipping">{ord.type || 'Shipping'}</span>
                  </td>
                  <td><strong>{formatCurrency(ord.totalAmount)}</strong></td>
                  <td>
                    <span className={`status-badge-pill status-${ord.status.toLowerCase()}`}>
                      {ord.status === 'PAID' ? '✓ Paid' : ord.status}
                    </span>
                  </td>
                  <td>{ord.date || new Date(ord.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
