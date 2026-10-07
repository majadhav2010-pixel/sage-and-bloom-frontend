import React, { useState } from 'react';
import './OrderDetailView.css';

export const OrderDetailView = ({
  order,
  onBack,
  onUpdateStatus,
  maskPii,
  onTogglePiiMask,
  onRecordAudit,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'delivery' | 'docs' | 'security' | 'notes'
  const [notes, setNotes] = useState(order.internalNotes || 'Customer requested eco-friendly Kraft packaging with botanical dried lavender sprig.');
  const [isSavedNotes, setIsSavedNotes] = useState(false);

  if (!order) return null;

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

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    onRecordAudit?.('ORDER_STATUS_CHANGED', 'ORDER', order.id, `Status updated to ${newStatus} from Order Detail view`);
    onShowToast?.(`Order ${order.orderNumber} status updated to ${newStatus}`);
  };

  const handleSaveNotes = () => {
    setIsSavedNotes(true);
    onRecordAudit?.('ORDER_NOTE_ADDED', 'ORDER', order.id, `Admin updated internal fulfillment notes`);
    onShowToast?.('Internal notes saved successfully');
    setTimeout(() => setIsSavedNotes(false), 2500);
  };

  const handlePrintInvoice = () => {
    onRecordAudit?.('PRINT_ORDER_INVOICE', 'ORDER', order.id, `Generated tax invoice for ${order.orderNumber}`);
    onShowToast?.(`Printing Tax Invoice for Order ${order.orderNumber}`);
    window.print();
  };

  const handleDownloadDoc = (docType) => {
    onRecordAudit?.('DOWNLOAD_DOCUMENT', 'ORDER', order.id, `Downloaded ${docType} for ${order.orderNumber}`);
    onShowToast?.(`Downloaded ${docType}-${order.orderNumber}.pdf`);
  };

  // Progress status step index
  const statusSteps = ['PLACED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStatusNormalized = order.status ? order.status.toUpperCase() : 'PAID';
  const currentStepIndex = statusSteps.indexOf(currentStatusNormalized) !== -1 
    ? statusSteps.indexOf(currentStatusNormalized) 
    : (currentStatusNormalized === 'CANCELLED' || currentStatusNormalized === 'REFUNDED' ? -1 : 1);

  return (
    <div className="order-detail-page">
      {/* 1. Top Navigation & Action Header */}
      <div className="order-detail-header">
        <div className="header-left-group">
          <button
            type="button"
            className="btn-back-to-orders"
            onClick={onBack}
            title="Return to Orders Table"
          >
            <span className="back-arrow">←</span> Back to Orders
          </button>
          <div className="order-title-block">
            <div className="order-main-title">
              <h2>Order {order.orderNumber}</h2>
              {order.flagged && <span className="order-flag-badge">🏳️ Priority</span>}
              <span className={`status-badge-pill status-${order.status?.toLowerCase()}`}>
                {order.status === 'PAID' && '✓ Paid'}
                {order.status === 'PROCESSING' && '⏳ Processing'}
                {order.status === 'SHIPPED' && '📦 Shipped'}
                {order.status === 'DELIVERED' && '✨ Delivered'}
                {order.status === 'CANCELLED' && '✕ Cancelled'}
                {order.status === 'REFUNDED' && '⟲ Refunded'}
                {!['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && order.status}
              </span>
            </div>
            <div className="order-subtitle-meta">
              <span>Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (order.date || 'Jun 19, 2026')}</span>
              <span className="bullet-sep">•</span>
              <span>Payment ID: <code>tok_live_{order.id || '9f8c'}</code></span>
              <span className="bullet-sep">•</span>
              <span>Method: <b className="text-forest">{order.type || 'Shipping'}</b></span>
            </div>
          </div>
        </div>

        <div className="header-right-actions">
          <button
            type="button"
            className="btn-detail-action"
            onClick={handlePrintInvoice}
            title="Print printable tax invoice"
          >
            <span>🖨</span> Print Invoice
          </button>
          <button
            type="button"
            className="btn-detail-action"
            onClick={() => handleDownloadDoc('Packing-Slip')}
            title="Download PDF packing slip"
          >
            <span>📄</span> Packing Slip
          </button>
          <button
            type="button"
            className="btn-detail-action primary"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(order, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `order-${order.orderNumber}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
              onShowToast?.(`Exported ${order.orderNumber} data`);
            }}
          >
            <span>↑</span> Export Order
          </button>
        </div>
      </div>

      {/* 2. Order Fulfillment Status Stepper */}
      {currentStatusNormalized !== 'CANCELLED' && currentStatusNormalized !== 'REFUNDED' && (
        <div className="order-stepper-card">
          <div className="stepper-track">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-circle">
                    {idx < currentStepIndex ? '✓' : idx + 1}
                  </div>
                  <div className="step-content">
                    <span className="step-name">{step}</span>
                    <span className="step-desc">
                      {step === 'PLACED' && 'Order received'}
                      {step === 'PAID' && 'Payment verified'}
                      {step === 'PROCESSING' && 'Soap curing & packing'}
                      {step === 'SHIPPED' && 'With botanical courier'}
                      {step === 'DELIVERED' && 'Arrived safely'}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && <div className={`step-connector ${idx < currentStepIndex ? 'filled' : ''}`}></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Quick Status Controller Bar */}
      <div className="order-status-controller-bar">
        <div className="status-ctrl-label">
          <span className="ctrl-icon">⚙️</span>
          <span>Transition Order State:</span>
        </div>
        <div className="status-buttons-group">
          <button
            type="button"
            className={`btn-status-pill ${order.status === 'PAID' ? 'active-paid' : ''}`}
            onClick={() => handleStatusChange('PAID')}
          >
            ✓ Mark Paid
          </button>
          <button
            type="button"
            className={`btn-status-pill ${order.status === 'PROCESSING' ? 'active-processing' : ''}`}
            onClick={() => handleStatusChange('PROCESSING')}
          >
            ⏳ Mark Processing
          </button>
          <button
            type="button"
            className={`btn-status-pill ${order.status === 'SHIPPED' ? 'active-shipped' : ''}`}
            onClick={() => handleStatusChange('SHIPPED')}
          >
            📦 Mark Shipped
          </button>
          <button
            type="button"
            className={`btn-status-pill ${order.status === 'DELIVERED' ? 'active-delivered' : ''}`}
            onClick={() => handleStatusChange('DELIVERED')}
          >
            ✨ Mark Delivered
          </button>
          <button
            type="button"
            className={`btn-status-pill ${order.status === 'REFUNDED' ? 'active-refunded' : ''}`}
            onClick={() => handleStatusChange('REFUNDED')}
          >
            ⟲ Refund
          </button>
          <button
            type="button"
            className={`btn-status-pill danger ${order.status === 'CANCELLED' ? 'active-cancelled' : ''}`}
            onClick={() => handleStatusChange('CANCELLED')}
          >
            ✕ Cancel Order
          </button>
        </div>
      </div>

      {/* 4. Tab Navigation for Order Sections */}
      <div className="order-detail-tabs-bar">
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>📦</span> Order Items & Details
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          <span>🚚</span> Shipping & Tracking
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span>📄</span> Invoices & Documents
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span>🛡️</span> Security & Audit Logs
        </button>
        <button
          type="button"
          className={`detail-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span>📝</span> Internal Notes
        </button>
      </div>

      {/* 5. Main Content Grid */}
      <div className="order-detail-grid">
        {/* Left / Main Column */}
        <div className="order-grid-main">
          {/* Tab 1: Overview (Items + Summary) */}
          {activeTab === 'overview' && (
            <>
              {/* Items Card */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <div>
                    <h3>Ordered Botanical Items</h3>
                    <small>{order.items?.length || 0} product(s) in this shipment</small>
                  </div>
                  <span className="items-count-pill">{order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1} units</span>
                </div>

                <div className="items-table-container">
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="order-product-cell">
                              <img
                                src={item.image || '/slide1.jpg'}
                                alt={item.title}
                                className="order-product-img"
                              />
                              <div className="order-product-info">
                                <strong>{item.title}</strong>
                                <span className="product-category-sub">100% Organic Handcrafted Formula</span>
                                <span className="product-sku">SKU: SB-BOT-{idx + 104}</span>
                              </div>
                            </div>
                          </td>
                          <td className="price-col">
                            ₹{Number(item.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="qty-col">
                            <span className="qty-badge">{item.quantity}</span>
                          </td>
                          <td className="subtotal-col text-right">
                            <strong>₹{Number(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals Breakdown */}
                <div className="order-cost-breakdown">
                  <div className="breakdown-row">
                    <span>Items Subtotal:</span>
                    <span>₹{Number(order.subtotal || order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Eco Botanical Packaging:</span>
                    <span className="text-success">Complimentary (₹0.00)</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Estimated Shipping ({order.type || 'Standard'}):</span>
                    <span>{order.shippingFee ? `₹${Number(order.shippingFee).toFixed(2)}` : 'FREE'}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Applicable GST / Tax (Included):</span>
                    <span>₹{(Number(order.totalAmount || 0) * 0.18 / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row total-row">
                    <span>Grand Total:</span>
                    <strong className="total-highlight">₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Overview Card */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <div>
                    <h3>Fulfillment & Destination</h3>
                    <small>Delivery address and packaging specifications</small>
                  </div>
                  <span className="type-tag type-shipping">{order.type || 'Shipping'}</span>
                </div>
                <div className="fulfillment-two-col">
                  <div className="fulfillment-info-box">
                    <span className="info-box-label">📍 Shipping Address</span>
                    <strong>{order.customerName}</strong>
                    <p>{order.shippingAddress || '742 Evergreen Terrace, Suite 400'}</p>
                    <p>{order.shippingCity || 'San Francisco, CA'} {order.shippingPostalCode || '94103'}</p>
                    <span className="country-badge">🇮🇳 India / Domestic Delivery</span>
                  </div>
                  <div className="fulfillment-info-box">
                    <span className="info-box-label">📦 Courier Method</span>
                    <strong>{order.type === 'Pickups' ? 'Self-Pickup at Artisan Atelier' : 'Express Botanical Cold-Chain Courier'}</strong>
                    <p className="courier-note">Estimated transit time: 2-3 business days. Packaged with recycled honeycomb paper and dried cedar.</p>
                    <div className="tracking-code-pill">
                      <span>Tracking ID:</span>
                      <code>SB-TRK-{order.id ? order.id.replace('ord-', '9823') : '7721'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Shipping & Tracking */}
          {activeTab === 'delivery' && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h3>Live Courier Tracking & Logistics</h3>
                  <small>Real-time updates from botanical dispatch network</small>
                </div>
                <span className="status-badge-pill status-paid">Carrier: BlueDart Eco</span>
              </div>
              <div className="tracking-timeline-box">
                <div className="timeline-checkpoint done">
                  <div className="checkpoint-marker"></div>
                  <div className="checkpoint-details">
                    <strong>Package Picked Up from Artisan Studio</strong>
                    <small>Botanical Hub #1, Bengaluru • {order.date || 'Jun 19'}, 11:30 AM</small>
                  </div>
                </div>
                <div className="timeline-checkpoint done">
                  <div className="checkpoint-marker"></div>
                  <div className="checkpoint-details">
                    <strong>Sorted at Regional Sorting Facility</strong>
                    <small>Central Logistics Center • {order.date || 'Jun 19'}, 04:15 PM</small>
                  </div>
                </div>
                <div className={`timeline-checkpoint ${['SHIPPED', 'DELIVERED'].includes(currentStatusNormalized) ? 'done' : 'pending'}`}>
                  <div className="checkpoint-marker"></div>
                  <div className="checkpoint-details">
                    <strong>Out for Delivery</strong>
                    <small>{['SHIPPED', 'DELIVERED'].includes(currentStatusNormalized) ? 'Assigned to local eco courier rider' : 'Pending dispatch from local hub'}</small>
                  </div>
                </div>
                <div className={`timeline-checkpoint ${currentStatusNormalized === 'DELIVERED' ? 'done' : 'pending'}`}>
                  <div className="checkpoint-marker"></div>
                  <div className="checkpoint-details">
                    <strong>Delivered to Customer Doorstep</strong>
                    <small>{currentStatusNormalized === 'DELIVERED' ? 'Signed and received' : 'Expected delivery by 6:00 PM'}</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Docs */}
          {activeTab === 'docs' && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h3>Official Commercial Documents</h3>
                  <small>Generated compliance invoices, packaging manifests, and certificates</small>
                </div>
              </div>
              <div className="docs-management-list">
                <div className="doc-row-card">
                  <div className="doc-icon">🧾</div>
                  <div className="doc-meta">
                    <strong>Commercial Tax Invoice (GST Compliant)</strong>
                    <small>INV-{order.orderNumber}.pdf • 142 KB • Generated on {order.date || 'Jun 19'}</small>
                  </div>
                  <div className="doc-actions">
                    <button type="button" className="btn-doc-action" onClick={handlePrintInvoice}>Print</button>
                    <button type="button" className="btn-doc-action primary" onClick={() => handleDownloadDoc('Tax-Invoice')}>Download PDF</button>
                  </div>
                </div>

                <div className="doc-row-card">
                  <div className="doc-icon">🏷️</div>
                  <div className="doc-meta">
                    <strong>Warehouse Packing & Barcode Slip</strong>
                    <small>PACK-{order.orderNumber}.pdf • 88 KB • Contains batch cure dates</small>
                  </div>
                  <div className="doc-actions">
                    <button type="button" className="btn-doc-action" onClick={handlePrintInvoice}>Print</button>
                    <button type="button" className="btn-doc-action primary" onClick={() => handleDownloadDoc('Packing-Slip')}>Download PDF</button>
                  </div>
                </div>

                <div className="doc-row-card">
                  <div className="doc-icon">🌿</div>
                  <div className="doc-meta">
                    <strong>Botanical Certificate of Purity & Lab Assay</strong>
                    <small>CERT-{order.orderNumber}.pdf • 210 KB • 100% Organic verification</small>
                  </div>
                  <div className="doc-actions">
                    <button type="button" className="btn-doc-action primary" onClick={() => handleDownloadDoc('Botanical-Certificate')}>Download PDF</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Security & Audit */}
          {activeTab === 'security' && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h3>Security Verification & Immutable Audit Logs</h3>
                  <small>Cryptographic validation and transaction telemetry</small>
                </div>
                <span className="sec-dot green"></span>
              </div>
              <div className="security-telemetry-grid">
                <div className="sec-card-box">
                  <small>Cryptographic Hash</small>
                  <code>sha256:8f4c2e...b3a9d1</code>
                  <span className="text-success">✓ Verified Valid</span>
                </div>
                <div className="sec-card-box">
                  <small>Payment Gateway Token</small>
                  <code>tok_live_rzp_{order.id || '8832'}</code>
                  <span className="text-forest">Razorpay Verified</span>
                </div>
                <div className="sec-card-box">
                  <small>Origin IP & Geo</small>
                  <code>192.168.1.45 (Bangalore, IN)</code>
                  <span>TLS 1.3 Strict</span>
                </div>
                <div className="sec-card-box">
                  <small>GDPR Data Consent</small>
                  <strong>Customer Consented</strong>
                  <span>Opted in for Order SMS</span>
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0', fontSize: '0.9rem' }}>Order Activity Log</h4>
              <ul className="order-audit-trail-list">
                <li>
                  <span className="trail-dot"></span>
                  <div className="trail-info">
                    <strong>Order Placed by Customer</strong>
                    <small>{order.createdAt || '2026-06-19 10:15:00 UTC'} • IP: 192.168.1.45</small>
                  </div>
                </li>
                <li>
                  <span className="trail-dot"></span>
                  <div className="trail-info">
                    <strong>Payment Captured & Authenticated</strong>
                    <small>Amount: ₹{Number(order.totalAmount || 0).toFixed(2)} • Gateway status: SUCCESS</small>
                  </div>
                </li>
                <li>
                  <span className="trail-dot"></span>
                  <div className="trail-info">
                    <strong>Order Status Current: {order.status}</strong>
                    <small>Managed via Sage & Bloom Admin Suite</small>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* Tab 5: Internal Notes */}
          {activeTab === 'notes' && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div>
                  <h3>Internal Fulfillment & Staff Notes</h3>
                  <small>Visible only to admin team members and packing staff</small>
                </div>
              </div>
              <div className="internal-notes-editor">
                <textarea
                  className="notes-textarea"
                  rows="5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter staff instructions, packaging preferences, customer notes..."
                ></textarea>
                <div className="notes-actions-bar">
                  <button
                    type="button"
                    className="btn-save-notes"
                    onClick={handleSaveNotes}
                  >
                    {isSavedNotes ? '✓ Notes Saved!' : 'Save Internal Note'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right / Customer & Summary Sidebar */}
        <div className="order-grid-sidebar">
          {/* Customer Profile Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Customer Profile</h3>
              <span className="badge-customer-tier">VIP Client</span>
            </div>

            <div className="customer-detail-profile">
              <div className="cust-avatar-large">
                {order.customerInitials || order.customerName?.slice(0, 2).toUpperCase() || 'CU'}
              </div>
              <div className="cust-profile-meta">
                <h4>{order.customerName}</h4>
                <span className="cust-id">Account ID: CUST-{order.id ? order.id.replace('ord-', '88') : '101'}</span>
              </div>
            </div>

            <div className="customer-contact-list">
              <div className="contact-line-item">
                <span className="contact-icon">✉️</span>
                <div className="contact-info">
                  <small>Email Address</small>
                  <div className="contact-val-row">
                    <strong>{formatPii(order.customerEmail, 'email')}</strong>
                    {maskPii && (
                      <button
                        type="button"
                        className="btn-reveal-pii-small"
                        onClick={onTogglePiiMask}
                        title="Toggle GDPR mask"
                      >
                        👁️
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="contact-line-item">
                <span className="contact-icon">📞</span>
                <div className="contact-info">
                  <small>Phone Number</small>
                  <div className="contact-val-row">
                    <strong>{formatPii(order.customerPhone || '+1 (415) 555-2671', 'phone')}</strong>
                  </div>
                </div>
              </div>

              <div className="contact-line-item">
                <span className="contact-icon">🛍️</span>
                <div className="contact-info">
                  <small>Customer History</small>
                  <strong>5 orders placed • Lifetime value ₹4,820</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Order Actions Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Order Tools</h3>
            </div>
            <div className="quick-order-tools-list">
              <button
                type="button"
                className="tool-btn"
                onClick={() => onShowToast?.(`Sent SMS tracking update to ${order.customerName}`)}
              >
                <span>📲</span> Send Tracking SMS
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => onShowToast?.(`Resent Order Receipt to ${order.customerEmail}`)}
              >
                <span>✉️</span> Resend Email Receipt
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => {
                  onRecordAudit?.('ORDER_DUPLICATED', 'ORDER', order.id, `Duplicated order ${order.orderNumber}`);
                  onShowToast?.(`Order ${order.orderNumber} duplicated as new draft`);
                }}
              >
                <span>⎘</span> Duplicate as New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;
