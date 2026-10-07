import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_METRICS,
  INITIAL_CATEGORIES,
  INITIAL_ADMIN_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from './adminData';
import { useProducts } from '../context/ProductContext';
import { AdminDashboard } from './AdminDashboard';
import { ProductManagement } from './ProductManagement';
import { CategoryManagement } from './CategoryManagement';
import { OrderManagement } from './OrderManagement';
import { CustomerManagement } from './CustomerManagement';
import { UserRoleManagement } from './UserRoleManagement';
import { AuditLogsView } from './AuditLogsView';
import { AdminSettings } from './AdminSettings';
import { RightAnalyticsSidebar } from './RightAnalyticsSidebar';
import { SecurityLockModal } from './SecurityLockModal';
import api from '../services/api';
import './AdminLayout.css';

export const AdminLayout = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('orders'); // Default to Orders
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const { products, setProducts, categories, setCategories } = useProducts();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [isSyncing, setIsSyncing] = useState(false);

  // Security States
  const [isLocked, setIsLocked] = useState(false);
  const [maskPii, setMaskPii] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(1800); // 30 min countdown
  const [toastMessage, setToastMessage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live admin data from Spring Boot backend if available
  const fetchLiveAdminData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [metricsRes, productsRes, ordersRes, categoriesRes, usersRes, auditRes] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getCategories(),
        api.getAdminUsers(),
        api.getAuditLogs(),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        const m = metricsRes.value.data;
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: m.totalRevenue ? `₹${parseFloat(m.totalRevenue).toLocaleString()}` : prev.totalRevenue,
          totalOrders: m.totalOrders || prev.totalOrders,
          totalCustomers: m.totalCustomers || prev.totalCustomers,
          activeProducts: m.totalProducts || prev.activeProducts,
          lowStockAlerts: m.lowStockAlerts || prev.lowStockAlerts,
        }));
      }

      if (productsRes.status === 'fulfilled' && productsRes.value?.data?.length > 0) {
        setProducts(productsRes.value.data);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.length > 0) {
        setOrders(ordersRes.value.data);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data?.length > 0) {
        setCategories(categoriesRes.value.data);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.length > 0) {
        setUsers(usersRes.value.data);
      }

      if (auditRes.status === 'fulfilled' && auditRes.value?.data?.length > 0) {
        setAuditLogs(auditRes.value.data);
      }
    } catch (e) {
      console.warn('[Admin] Live data sync falling back to initial data store:', e.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAdminData();
  }, [fetchLiveAdminData]);

  // Auto-lock countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener (⌘L to lock console, ⌘F to search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLocked(true);
        handleRecordAudit('CONSOLE_LOCKED_SHORTCUT', 'SECURITY', 'ADMIN_SESSION', 'Console locked via Ctrl/Cmd+L shortcut');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleShowToast = (msg, type = 'success', title = '') => {
    if (typeof msg === 'object' && msg !== null) {
      setToastMessage({
        message: msg.message || 'Action completed successfully',
        type: msg.type || 'success',
        title: msg.title || (msg.type === 'error' ? 'Error' : msg.type === 'warning' ? 'Notice' : 'Success'),
        details: msg.details || '',
      });
    } else {
      setToastMessage({
        message: msg,
        type,
        title: title || (type === 'error' ? 'Action Failed' : type === 'warning' ? 'Warning' : 'Catalog Updated'),
      });
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRecordAudit = (action, resourceType, resourceId, details) => {
    const newLog = {
      id: 'log-' + Date.now(),
      actorEmail: 'admin@sageandbloom.com',
      action,
      resourceType,
      resourceId: String(resourceId),
      ipAddress: '192.168.1.10',
      details,
      result: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleTogglePii = () => {
    const nextState = !maskPii;
    setMaskPii(nextState);
    handleRecordAudit(
      nextState ? 'PII_MASKED' : 'PII_UNMASKED',
      'SECURITY_POLICY',
      'GDPR_GUARD',
      `Admin toggled customer PII visibility to ${nextState ? 'MASKED' : 'VISIBLE'}`
    );
    handleShowToast(nextState ? '🔒 Customer PII is now masked' : '⚠️ Customer PII is now revealed (logged to audit)');
  };

  const formatSessionTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦', badge: orders.filter((o) => o.status === 'PAID' || o.status === 'PROCESSING' || o.status === 'PENDING').length },
    { id: 'products', label: 'Products', icon: '🧼', badge: products.length },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'roles', label: 'Security & Roles', icon: '🛡️' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-app-root">
      {/* 1. Left Navigation Sidebar (Deep Moss Palette) */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="admin-brand">
          <div className="admin-logo-mark">🌿</div>
          {!sidebarCollapsed && (
            <div className="admin-brand-info">
              <h1>Sage & Bloom</h1>
              <span className="admin-badge">Admin Suite</span>
            </div>
          )}
          <button
            type="button"
            className="btn-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '⇥' : '⇤'}
          </button>
        </div>

        {/* Quick Search */}
        {!sidebarCollapsed && (
          <div className="sidebar-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
            <span className="kbd-shortcut">⌘ F</span>
          </div>
        )}

        {/* Primary Navigation List */}
        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              {!sidebarCollapsed && Boolean(item.badge) && item.badge > 0 && (
                <span className="nav-counter">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Secondary Navigation Group */}
        {!sidebarCollapsed && (
          <div className="sidebar-secondary-nav">
            <button
              type="button"
              className="secondary-nav-item"
              onClick={() => handleShowToast('All security shields and microservices operational.')}
            >
              <span className="sec-icon">🔔</span>
              <span className="sec-label">Notifications</span>
              <span className="badge-notif-red">7</span>
            </button>
            <button
              type="button"
              className="secondary-nav-item"
              onClick={() => setActiveTab('settings')}
            >
              <span className="sec-icon">⚙️</span>
              <span className="sec-label">Settings</span>
            </button>
          </div>
        )}

        {/* Super Admin User Profile Footer */}
        <div className="sidebar-profile-footer">
          <div className="profile-card">
            <div className="profile-avatar-box">
              <span className="avatar-initials">OW</span>
              <span className="avatar-status-dot"></span>
            </div>
            {!sidebarCollapsed && (
              <div className="profile-meta">
                <strong>Olivia Williams</strong>
                <span className="role-chip">SUPER_ADMIN</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="profile-quick-actions">
              <button
                type="button"
                className="btn-lock-console"
                onClick={() => {
                  setIsLocked(true);
                  handleRecordAudit('CONSOLE_MANUAL_LOCK', 'SECURITY', 'SESSION', 'Admin clicked Lock Console');
                }}
                title="Lock Admin Console (Ctrl+L)"
              >
                🔒
              </button>
              <button
                type="button"
                className="btn-exit-store"
                onClick={onClose}
                title="Return to Storefront"
              >
                ← Exit
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Central Work Area */}
      <div className="admin-main-viewport">


        {/* 3-Column Content Workspace Layout */}
        <div className="admin-workspace-layout">
          {/* Central Data Canvas */}
          <main className="admin-center-canvas">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                metrics={metrics}
                products={products}
                orders={orders}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onShowToast={handleShowToast}
              />
            )}

            {activeTab === 'orders' && (
              <OrderManagement
                orders={orders}
                setOrders={setOrders}
                onRecordAudit={handleRecordAudit}
                maskPii={maskPii}
                onTogglePiiMask={handleTogglePii}
                onShowToast={handleShowToast}
              />
            )}

            {activeTab === 'products' && (
              <ProductManagement
                products={products}
                setProducts={setProducts}
                categories={categories}
                onRecordAudit={handleRecordAudit}
                onShowToast={handleShowToast}
              />
            )}

            {activeTab === 'categories' && (
              <CategoryManagement
                categories={categories}
                setCategories={setCategories}
                onRecordAudit={handleRecordAudit}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerManagement users={users} />
            )}

            {activeTab === 'roles' && (
              <UserRoleManagement
                users={users}
                setUsers={setUsers}
                onRecordAudit={handleRecordAudit}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogsView auditLogs={auditLogs} />
            )}

            {activeTab === 'settings' && (
              <AdminSettings />
            )}
          </main>

          {/* Right Insights & Metrics Panel (Active on Orders & Dashboard) */}
          {(activeTab === 'orders' || activeTab === 'dashboard') && (
            <RightAnalyticsSidebar
              metrics={metrics}
              orders={orders}
            />
          )}
        </div>
      </div>

      {/* Security Screen Lock Modal */}
      <SecurityLockModal
        isLocked={isLocked}
        onUnlock={() => setIsLocked(false)}
        adminUser={{ fullName: 'Olivia Williams', email: 'admin@sageandbloom.com' }}
        onRecordAudit={handleRecordAudit}
      />

      {/* Floating Action Toast Notification Card */}
      {toastMessage && (
        <div className={`admin-notification-toast-card ${toastMessage.type || 'success'}`}>
          <div className="toast-icon-badge">
            {toastMessage.type === 'error' ? '✕' : toastMessage.type === 'warning' ? '⚠️' : toastMessage.type === 'info' ? 'ℹ️' : '✓'}
          </div>
          <div className="toast-body-meta">
            <strong className="toast-title">{toastMessage.title || 'Notification'}</strong>
            <p className="toast-msg">{toastMessage.message || (typeof toastMessage === 'string' ? toastMessage : '')}</p>
            {toastMessage.details && <small className="toast-details">{toastMessage.details}</small>}
          </div>
          <button
            type="button"
            className="btn-toast-dismiss"
            onClick={() => setToastMessage(null)}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
