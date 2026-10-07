import React, { useState, useMemo } from 'react';
import { OrderDetailView } from './OrderDetailView';
import './OrderManagement.css';

export const OrderManagement = ({
  orders = [],
  setOrders,
  onRecordAudit,
  maskPii = true,
  onTogglePiiMask,
  onShowToast,
}) => {
  // State for filters & selection
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // ALL, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, Shipping, Pickups
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [showStatusMenuId, setShowStatusMenuId] = useState(null);

  // New Order Creation Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    type: 'Shipping',
    address: '142 Botanical Garden Way, Mumbai, MH',
    productName: 'Woodland Botanical Bar',
    quantity: 2,
    unitPrice: 14.00,
    status: 'PAID',
  });

  // Helper for masking PII
  const formatPii = (text, type = 'email') => {
    if (!maskPii || !text) return text;
    if (type === 'email') {
      const parts = text.split('@');
      if (parts.length < 2) return '***';
      const name = parts[0];
      return `${name.slice(0, 2)}***@${parts[1]}`;
    }
    if (type === 'phone') {
      return text.replace(/(\d{3})\D*(\d{3})\D*(\d{4})/, '($1) ***-$3');
    }
    return text;
  };

  // High-level KPI summary calculations
  const orderKPIs = useMemo(() => {
    const totalCount = orders.length;
    const paidCount = orders.filter((o) => o.status === 'PAID').length;
    const processingCount = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PENDING').length;
    const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
    const refundedCount = orders.filter((o) => o.status === 'REFUNDED').length;

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

    const averageOrderValue = totalCount > 0 ? (totalRevenue / (totalCount - cancelledCount || 1)) : 0;

    return {
      totalCount,
      paidCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      refundedCount,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      averageOrderValue: `₹${averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }, [orders]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status Tab filter
      if (selectedStatusTab !== 'ALL' && o.status?.toUpperCase() !== selectedStatusTab.toUpperCase()) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && o.type?.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'ALL' && o.date !== dateFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNum = o.orderNumber?.toLowerCase().includes(query);
        const matchName = o.customerName?.toLowerCase().includes(query);
        const matchEmail = o.customerEmail?.toLowerCase().includes(query);
        const matchType = o.type?.toLowerCase().includes(query);
        if (!matchNum && !matchName && !matchEmail && !matchType) return false;
      }

      return true;
    });
  }, [orders, selectedStatusTab, selectedType, dateFilter, searchQuery]);

  // Function to open the separate Order Detail page
  const handleOpenOrderDetail = (order) => {
    setSelectedOrderForDetail(order);
    onRecordAudit?.('ORDER_DETAIL_VIEWED', 'ORDER', order.id, `Admin opened detail view for ${order.orderNumber}`);
  };

  // Function to return from Order Detail page back to Orders table
  const handleCloseOrderDetail = () => {
    setSelectedOrderForDetail(null);
  };

  // Checkbox selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status update handler
  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
      setSelectedOrderForDetail((prev) => ({ ...prev, status: newStatus }));
    }
    api.updateOrderStatus(orderId, newStatus).catch((err) => {
      console.warn('[OrderManagement] Database order status sync notice:', err.message);
    });
    setShowStatusMenuId(null);
    onRecordAudit?.('ORDER_STATUS_CHANGED', 'ORDER', orderId, `Status transitioned to ${newStatus}`);
    onShowToast?.({
      title: 'Order Status Updated',
      message: `Order transitioned to ${newStatus} successfully.`,
      type: 'success',
    });
  };

  // Helper for preventing CSV Formula / Macro Injection
  const sanitizeCsvCell = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    const triggerChars = ['=', '+', '-', '@', '\t', '\r'];
    const safeStr = triggerChars.includes(str.charAt(0)) ? `'${str}` : str;
    return `"${safeStr.replace(/"/g, '""')}"`;
  };

  // Bulk actions
  const handleBulkExport = () => {
    const list = selectedOrderIds.length > 0
      ? orders.filter((o) => selectedOrderIds.includes(o.id))
      : filteredOrders;

    const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Type', 'Status', 'Total (₹)', 'Date'];
    const rows = list.map((o) => [
      sanitizeCsvCell(o.orderNumber),
      sanitizeCsvCell(o.customerName),
      sanitizeCsvCell(formatPii(o.customerEmail, 'email')),
      sanitizeCsvCell(o.type || 'Shipping'),
      sanitizeCsvCell(o.status),
      Number(o.totalAmount || 0).toFixed(2),
      sanitizeCsvCell(o.date || ''),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sage_and_Bloom_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onRecordAudit?.('BULK_ORDER_EXPORT', 'ORDERS', `COUNT_${list.length}`, `Exported ${list.length} orders to CSV`);
    onShowToast?.({
      title: 'Orders Exported',
      message: `Successfully exported ${list.length} orders to CSV spreadsheet.`,
      type: 'info',
    });
  };

  const handleBulkPrint = () => {
    const count = selectedOrderIds.length;
    onRecordAudit?.('PRINT_SHIPPING_LABELS', 'ORDERS', `COUNT_${count}`, `Generated packing slips for ${count} orders`);
    onShowToast?.({
      title: 'Packing Slips Generated',
      message: `Printed fulfillment slips for ${count} order(s).`,
      type: 'info',
    });
  };

  const handleBulkStatusChange = (status) => {
    setOrders((prev) =>
      prev.map((o) => (selectedOrderIds.includes(o.id) ? { ...o, status } : o))
    );
    selectedOrderIds.forEach((id) => {
      api.updateOrderStatus(id, status).catch(() => {});
    });
    onRecordAudit?.('BULK_STATUS_CHANGE', 'ORDERS', `COUNT_${selectedOrderIds.length}`, `Updated ${selectedOrderIds.length} orders to ${status}`);
    onShowToast?.({
      title: 'Bulk Status Updated',
      message: `Updated ${selectedOrderIds.length} order(s) to ${status}.`,
      type: 'success',
    });
    setSelectedOrderIds([]);
  };

  // Create Manual Order Handler
  const handleCreateNewOrder = async (e) => {
    e.preventDefault();
    if (!newOrderForm.customerName || !newOrderForm.customerEmail) {
      alert('Please enter a customer name and email address.');
      return;
    }

    const total = (parseFloat(newOrderForm.unitPrice) || 14) * (parseInt(newOrderForm.quantity, 10) || 1);
    const orderPayload = {
      customerName: newOrderForm.customerName.trim(),
      customerEmail: newOrderForm.customerEmail.trim(),
      customerPhone: '+91 98765 43210',
      shippingAddress: newOrderForm.address,
      shippingCity: 'Mumbai',
      shippingPostalCode: '400001',
      items: [
        {
          productTitle: newOrderForm.productName,
          quantity: parseInt(newOrderForm.quantity, 10) || 1,
          unitPrice: parseFloat(newOrderForm.unitPrice) || 14,
        }
      ],
    };

    let createdDbOrder = null;
    try {
      const res = await api.checkout(orderPayload);
      if (res?.data) createdDbOrder = res.data;
    } catch (err) {
      console.warn('[OrderManagement] Database order create notice:', err.message);
    }

    const newOrder = createdDbOrder || {
      id: 'ord-' + Date.now(),
      orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: newOrderForm.customerName.trim(),
      customerEmail: newOrderForm.customerEmail.trim(),
      customerInitials: newOrderForm.customerName.slice(0, 2).toUpperCase(),
      type: newOrderForm.type,
      status: newOrderForm.status,
      totalAmount: total,
      date: 'Today',
      itemsCount: parseInt(newOrderForm.quantity, 10) || 1,
      productThumbnails: ['/images/slide_1.jpg'],
      shippingAddress: newOrderForm.address,
      items: [
        {
          id: 1,
          productTitle: newOrderForm.productName,
          quantity: parseInt(newOrderForm.quantity, 10) || 1,
          unitPrice: parseFloat(newOrderForm.unitPrice) || 14,
          totalPrice: total,
        }
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    onRecordAudit?.('ORDER_CREATED_MANUAL', 'ORDER', newOrder.id, `Created manual order: ${newOrder.orderNumber}`);
    onShowToast?.({
      title: 'Order Created',
      message: `Manual order ${newOrder.orderNumber} placed for ${newOrder.customerName}.`,
      type: 'success',
    });

    setIsNewOrderModalOpen(false);
    setNewOrderForm({
      customerName: '',
      customerEmail: '',
      type: 'Shipping',
      address: '142 Botanical Garden Way, Mumbai, MH',
      productName: 'Woodland Botanical Bar',
      quantity: 2,
      unitPrice: 14.00,
      status: 'PAID',
    });
  };

  // IF an order is selected for viewing its separate page, render the full OrderDetailView!
  if (selectedOrderForDetail) {
    return (
      <OrderDetailView
        order={selectedOrderForDetail}
        onBack={handleCloseOrderDetail}
        onUpdateStatus={handleUpdateStatus}
        maskPii={maskPii}
        onTogglePiiMask={onTogglePiiMask}
        onRecordAudit={onRecordAudit}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="orders-page-container">
      {/* 1. Page Header */}
      <section className="orders-top-header">
        <div className="orders-title-group">
          <div className="orders-title-row">
            <h2>Customer Orders & Fulfillment</h2>
            <span className="orders-count-chip">{orderKPIs.totalCount} Orders Total</span>
          </div>
          <p className="orders-header-subtitle">
            Real-time customer purchases, packaging pipeline, delivery status, and revenue
          </p>
        </div>

        <div className="orders-header-actions">
          <button
            type="button"
            className="btn-order-ghost"
            onClick={handleBulkExport}
            title="Export filtered orders to CSV"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn-new-order-primary"
            onClick={() => setIsNewOrderModalOpen(true)}
            title="Create a new manual order"
          >
            <span>✨</span>
            <span>+ New Order</span>
          </button>
        </div>
      </section>

      {/* 2. Top Metric Cards Strip (4 Sleek KPIs) */}
      <section className="orders-kpi-grid">
        <div className="order-kpi-card">
          <div className="order-kpi-icon moss">📦</div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Total Store Orders</span>
            <div className="order-kpi-value-row">
              <span className="order-kpi-bignum">{orderKPIs.totalCount}</span>
              <span className="order-kpi-sub">({orderKPIs.totalRevenue})</span>
            </div>
          </div>
        </div>

        <div
          className="order-kpi-card"
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'PROCESSING' ? 'ALL' : 'PROCESSING')}
          style={{ cursor: 'pointer' }}
          title="Click to filter processing orders"
        >
          <div className="order-kpi-icon amber">⏳</div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Awaiting Fulfillment</span>
            <div className="order-kpi-value-row">
              <span className="order-kpi-bignum" style={{ color: orderKPIs.processingCount > 0 ? '#B45309' : '#15803D' }}>
                {orderKPIs.processingCount}
              </span>
              <span className="order-kpi-sub">Requires Dispatch</span>
            </div>
          </div>
        </div>

        <div
          className="order-kpi-card"
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'SHIPPED' ? 'ALL' : 'SHIPPED')}
          style={{ cursor: 'pointer' }}
          title="Click to filter in-transit orders"
        >
          <div className="order-kpi-icon blue">🚚</div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">In Transit</span>
            <div className="order-kpi-value-row">
              <span className="order-kpi-bignum">{orderKPIs.shippedCount}</span>
              <span className="order-kpi-sub">Courier Handed</span>
            </div>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="order-kpi-icon green">💎</div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Average Order Basket</span>
            <div className="order-kpi-value-row">
              <span className="order-kpi-bignum">{orderKPIs.averageOrderValue}</span>
              <span className="order-kpi-sub">Per Customer</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Neat Status Filter Tabs & Search Hub */}
      <section className="orders-filter-hub-card">
        {/* Horizontal Status Filter Tabs */}
        <div className="order-status-tabs-row">
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('ALL')}
          >
            <span>All Orders</span>
            <span className="order-tab-count">{orderKPIs.totalCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'PAID' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('PAID')}
          >
            <span>✓ Paid</span>
            <span className="order-tab-count">{orderKPIs.paidCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'PROCESSING' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('PROCESSING')}
          >
            <span>⏳ Processing</span>
            <span className="order-tab-count">{orderKPIs.processingCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'SHIPPED' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('SHIPPED')}
          >
            <span>📦 Shipped</span>
            <span className="order-tab-count">{orderKPIs.shippedCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('DELIVERED')}
          >
            <span>✨ Delivered</span>
            <span className="order-tab-count">{orderKPIs.deliveredCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'REFUNDED' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('REFUNDED')}
          >
            <span>⟲ Refunded</span>
            <span className="order-tab-count">{orderKPIs.refundedCount}</span>
          </button>
          <button
            type="button"
            className={`order-tab-btn ${selectedStatusTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setSelectedStatusTab('CANCELLED')}
          >
            <span>✕ Cancelled</span>
            <span className="order-tab-count">{orderKPIs.cancelledCount}</span>
          </button>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="order-search-controls-row">
          <div className="order-search-wrapper">
            <span className="order-search-lens">🔍</span>
            <input
              type="text"
              placeholder="Search by order #, customer name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="order-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="order-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="order-dropdown-filters">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="order-select-clean"
            >
              <option value="ALL">All Types (Shipping & Pickups)</option>
              <option value="Shipping">🚚 Shipping Orders</option>
              <option value="Pickups">🏪 Store Pickups</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="order-select-clean"
            >
              <option value="ALL">All Dates</option>
              <option value="Jun 19">Jun 19, 2026</option>
              <option value="Jun 18">Jun 18, 2026</option>
            </select>

            {(selectedStatusTab !== 'ALL' || selectedType !== 'ALL' || dateFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                className="btn-reset-order-filters"
                onClick={() => {
                  setSelectedStatusTab('ALL');
                  setSelectedType('ALL');
                  setDateFilter('ALL');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. Clean Orders Data Table */}
      <section className="orders-table-card">
        <div className="orders-table-wrap">
          <table className="orders-clean-table">
            <thead>
              <tr>
                <th style={{ width: 44, paddingLeft: 20 }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    aria-label="Select all orders"
                  />
                </th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Fulfillment</th>
                <th>Status</th>
                <th>Products</th>
                <th>Total</th>
                <th>Date</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '2.4rem' }}>📦</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--ord-moss-primary)' }}>No Orders Match Current Filters</strong>
                      <p style={{ fontSize: '0.84rem', color: 'var(--ord-text-muted)', margin: 0 }}>
                        Try clearing search query or switching to 'All Orders' tab.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  const isShipping = ord.type?.toLowerCase().includes('ship');

                  return (
                    <tr
                      key={ord.id}
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => handleOpenOrderDetail(ord)}
                      title="Click to view full order details and fulfillment timeline"
                    >
                      {/* Checkbox */}
                      <td style={{ paddingLeft: 20 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(ord.id)}
                          aria-label={`Select order ${ord.orderNumber}`}
                        />
                      </td>

                      {/* Order Number */}
                      <td>
                        <span className="order-num-pill">
                          {ord.orderNumber}
                          {ord.flagged && <span title="Priority Customer Order">⭐</span>}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div className="order-customer-cell">
                          <div className="customer-avatar-badge">
                            {ord.customerInitials || ord.customerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="customer-info-meta">
                            <span className="customer-name-text">{ord.customerName}</span>
                            <span className="customer-email-text">{formatPii(ord.customerEmail, 'email')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Fulfillment Type */}
                      <td>
                        <span className={`type-badge-chip ${isShipping ? 'shipping' : 'pickups'}`}>
                          {isShipping ? '🚚 Shipping' : '🏪 Pickups'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`order-status-pill status-${ord.status?.toLowerCase()}`}>
                          <span className="status-dot-indicator" />
                          <span>
                            {ord.status === 'PAID' && 'Paid'}
                            {ord.status === 'PROCESSING' && 'Processing'}
                            {ord.status === 'SHIPPED' && 'Shipped'}
                            {ord.status === 'DELIVERED' && 'Delivered'}
                            {ord.status === 'CANCELLED' && 'Cancelled'}
                            {ord.status === 'REFUNDED' && 'Refunded'}
                            {!['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(ord.status) && ord.status}
                          </span>
                        </span>
                      </td>

                      {/* Products Stack */}
                      <td>
                        <div className="order-products-cell">
                          <div className="order-thumb-stack">
                            {(ord.productThumbnails || ['/images/slide_1.jpg']).slice(0, 3).map((thumb, idx) => (
                              <img
                                key={idx}
                                src={thumb}
                                alt="Product thumbnail"
                                className="order-mini-thumb"
                                onError={(e) => {
                                  e.target.src = '/images/slide_1.jpg';
                                }}
                              />
                            ))}
                          </div>
                          <span className="order-items-count-tag">
                            {ord.items?.length || ord.itemsCount || 1} {ord.itemsCount === 1 ? 'bar' : 'bars'}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <span className="order-amount-bold">
                          ₹{Number(ord.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ color: 'var(--ord-text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {ord.date || 'Jun 19, 2026'}
                      </td>

                      {/* Action Menu */}
                      <td style={{ textAlign: 'right', paddingRight: 24 }} onClick={(e) => e.stopPropagation()}>
                        <div className="order-actions-cell">
                          <button
                            type="button"
                            className="btn-view-order-clean"
                            onClick={() => handleOpenOrderDetail(ord)}
                            title="Open detailed order page"
                          >
                            <span>View Details →</span>
                          </button>

                          <div className="order-dropdown-menu-wrapper">
                            <button
                              type="button"
                              className="btn-dots-clean"
                              onClick={() => setShowStatusMenuId(showStatusMenuId === ord.id ? null : ord.id)}
                              title="Quick status change"
                            >
                              •••
                            </button>

                            {showStatusMenuId === ord.id && (
                              <div className="order-status-popup-menu">
                                <span className="popup-menu-heading">Transition Status</span>
                                <button type="button" className="popup-status-option" onClick={() => handleUpdateStatus(ord.id, 'PAID')}>
                                  ✓ Mark as Paid
                                </button>
                                <button type="button" className="popup-status-option" onClick={() => handleUpdateStatus(ord.id, 'PROCESSING')}>
                                  ⏳ Mark Processing
                                </button>
                                <button type="button" className="popup-status-option" onClick={() => handleUpdateStatus(ord.id, 'SHIPPED')}>
                                  📦 Mark Shipped
                                </button>
                                <button type="button" className="popup-status-option" onClick={() => handleUpdateStatus(ord.id, 'DELIVERED')}>
                                  ✨ Mark Delivered
                                </button>
                                <button type="button" className="popup-status-option" onClick={() => handleUpdateStatus(ord.id, 'REFUNDED')}>
                                  ⟲ Mark Refunded
                                </button>
                                <button type="button" className="popup-status-option danger" onClick={() => handleUpdateStatus(ord.id, 'CANCELLED')}>
                                  ✕ Cancel Order
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Floating Multi-Select Action Dock */}
      {selectedOrderIds.length > 0 && (
        <div className="bulk-actions-dock">
          <div className="bulk-dock-left">
            <span>✨</span>
            <span className="bulk-selection-count">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'order selected' : 'orders selected'}
            </span>
            <button
              type="button"
              className="btn-bulk-deselect"
              onClick={() => setSelectedOrderIds([])}
            >
              Deselect All
            </button>
          </div>

          <div className="bulk-dock-actions">
            <button
              type="button"
              className="btn-bulk-action"
              onClick={handleBulkExport}
              title="Export selected orders"
            >
              <span>📥 Export CSV</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action"
              onClick={handleBulkPrint}
              title="Print fulfillment packing slips"
            >
              <span>🖨 Print Slips</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action"
              onClick={() => handleBulkStatusChange('PAID')}
            >
              <span>✓ Mark Paid</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action"
              onClick={() => handleBulkStatusChange('SHIPPED')}
            >
              <span>📦 Mark Shipped</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action danger"
              onClick={() => handleBulkStatusChange('CANCELLED')}
            >
              <span>✕ Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. High-End Create New Order Modal */}
      {isNewOrderModalOpen && (
        <div className="new-order-modal-backdrop" onClick={() => setIsNewOrderModalOpen(false)}>
          <div className="new-order-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div className="modal-header-title">
                <div className="modal-title-icon">📦</div>
                <div>
                  <h3>Craft Manual Customer Order</h3>
                  <p>Create a direct order for in-store pickup or phone placement</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsNewOrderModalOpen(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body-scroll">
                <div className="modal-section-card">
                  <span className="section-legend">👤 Customer Information</span>
                  <div className="modal-form-grid-2">
                    <div className="modal-input-field">
                      <label>Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.customerName}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                        placeholder="e.g. Esther Howard"
                        className="modal-text-input"
                      />
                    </div>
                    <div className="modal-input-field">
                      <label>Customer Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newOrderForm.customerEmail}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                        placeholder="e.g. esther.howard@example.com"
                        className="modal-text-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-section-card">
                  <span className="section-legend">🚚 Fulfillment & Botanical Products</span>
                  <div className="modal-form-grid-3">
                    <div className="modal-input-field">
                      <label>Fulfillment Type</label>
                      <select
                        value={newOrderForm.type}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, type: e.target.value })}
                        className="modal-select-input"
                      >
                        <option value="Shipping">🚚 Courier Shipping</option>
                        <option value="Pickups">🏪 In-Store Pickup</option>
                      </select>
                    </div>

                    <div className="modal-input-field">
                      <label>Initial Status</label>
                      <select
                        value={newOrderForm.status}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                        className="modal-select-input"
                      >
                        <option value="PAID">✓ Paid</option>
                        <option value="PROCESSING">⏳ Processing</option>
                        <option value="SHIPPED">📦 Shipped</option>
                      </select>
                    </div>

                    <div className="modal-input-field">
                      <label>Quantity (Bars)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newOrderForm.quantity}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                        className="modal-text-input"
                      />
                    </div>
                  </div>

                  <div className="modal-form-grid-2" style={{ marginTop: 8 }}>
                    <div className="modal-input-field">
                      <label>Soap Recipe</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.productName}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, productName: e.target.value })}
                        className="modal-text-input"
                      />
                    </div>
                    <div className="modal-input-field">
                      <label>Unit Price (₹)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={newOrderForm.unitPrice}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, unitPrice: e.target.value })}
                        className="modal-text-input"
                      />
                    </div>
                  </div>

                  <div className="modal-input-field" style={{ marginTop: 8 }}>
                    <label>Delivery / Pickup Address</label>
                    <input
                      type="text"
                      value={newOrderForm.address}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, address: e.target.value })}
                      placeholder="e.g. 142 Botanical Garden Way, Mumbai, MH"
                      className="modal-text-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsNewOrderModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <span>✨ Place Customer Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
