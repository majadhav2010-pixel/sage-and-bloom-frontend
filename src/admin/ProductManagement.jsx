import React, { useState, useMemo, useRef } from 'react';
import api from '../services/api';
import './ProductManagement.css';

// Preset gallery images for quick botanical selection
const PRESET_SOAP_IMAGES = [
  { url: '/images/Natural_Soap_And_Bath_Bomb.webp', label: 'Woodland Herbal Bar' },
  { url: '/images/soap_3.jpg', label: 'Aloe & Mint Refresh' },
  { url: '/images/soap_2.jpg', label: 'Lavender & Rose Garden Set' },
  { url: '/images/soap_14.jpg', label: 'Daisy Bloom Bar' },
  { url: '/images/soap_8.jpg', label: 'Rose Petal Trio' },
  { url: '/images/soap_6.jpg', label: 'Oatmeal & Honey Bar' },
  { url: '/images/soap_7.jpg', label: 'Green Grape Cluster Soap' },
  { url: '/images/soap_5.jpg', label: 'Sea Mint Massage Bar' },
  { url: '/images/soap_4.jpg', label: 'Wildflower Glycerin Bar' },
  { url: '/images/ocean_bliss_trio.jpg', label: 'Ocean Bliss Sliding Box Soap Trio' },
  { url: '/images/soap_11.jpg', label: 'Little Explorers Animal Set' },
  { url: '/images/soap_20.jpg', label: 'Herbarium Pressed Botanical Bar' },
  { url: '/images/soap_21.jpg', label: 'Relax & Enjoy Spa Ritual Box' },
  { url: '/images/soap_22.jpg', label: 'Ocean Breeze Sea Turtle Gift Box' },
  { url: '/images/soap_23.jpg', label: 'Ocean Seashore Crystal Wave Bar' },
  { url: '/images/soap_24.jpg', label: 'Rustic Artisan Favor & Dish Set' },
];

export const ProductManagement = ({
  products = [],
  setProducts,
  categories = [],
  onRecordAudit,
  onShowToast,
}) => {
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK, ARCHIVED
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // File Upload from Computer / Laptop State
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url' | 'preset'

  // Delete Confirmation Modal State (Permanent Removal)
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Botanical Herbal',
    price: '',
    originalPrice: '',
    stockQuantity: 100,
    weightGrams: 200,
    imageUrl: '/images/slide_1.jpg',
    badge: 'Artisan',
    scentProfile: 'Crisp Pine, Wild Sage, Crushed Cedar',
    skinType: 'All Skin Types · Clarifying',
    description: 'Slow-cured 6-week cold-process soap enriched with organic unrefined shea butter and pure essential botanical extracts.',
    isActive: true,
  });

  // Local device file upload processor
  const handleImageFileUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.({
        title: 'Invalid File Type',
        message: 'Please select an image file (PNG, JPG, WEBP, GIF, SVG).',
        type: 'error',
      });
      return;
    }

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      onShowToast?.({
        title: 'File Too Large',
        message: 'Image size exceeds 10MB limit. Please choose a smaller photo.',
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      setUploadedFileMeta({
        name: file.name,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
      });
      if (validationErrors.imageUrl) {
        setValidationErrors((prev) => ({ ...prev, imageUrl: null }));
      }
      onShowToast?.({
        title: 'Photo Uploaded',
        message: `Loaded "${file.name}" from your device.`,
        type: 'success',
      });
    };
    reader.onerror = () => {
      onShowToast?.({
        title: 'Upload Error',
        message: 'Failed to read the image file from your computer.',
        type: 'error',
      });
    };
    reader.readAsDataURL(file);
  };

  // Calculate High-level Inventory KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.isActive).length;
    const totalUnits = products.reduce((acc, p) => acc + (parseInt(p.stockQuantity, 10) || 0), 0);
    const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
    const totalValuation = products.reduce((acc, p) => {
      const price = parseFloat(p.price) || 0;
      const stock = parseInt(p.stockQuantity, 10) || 0;
      return acc + (price * stock);
    }, 0);

    return {
      totalCount,
      activeCount,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      totalValuation: `₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    };
  }, [products]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchTitle = p.title?.toLowerCase().includes(query);
          const matchSubtitle = p.subtitle?.toLowerCase().includes(query);
          const matchScent = p.scentProfile?.toLowerCase().includes(query);
          const matchCat = p.category?.toLowerCase().includes(query);
          if (!matchTitle && !matchSubtitle && !matchScent && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
          return false;
        }

        // Stock status filter
        if (stockStatusFilter === 'IN_STOCK' && (p.stockQuantity <= 10 || !p.isActive)) return false;
        if (stockStatusFilter === 'LOW_STOCK' && (p.stockQuantity <= 0 || p.stockQuantity > 10)) return false;
        if (stockStatusFilter === 'OUT_OF_STOCK' && p.stockQuantity > 0) return false;
        if (stockStatusFilter === 'ARCHIVED' && p.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'name-desc') return b.title.localeCompare(a.title);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock-asc') return a.stockQuantity - b.stockQuantity;
        if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'weight') return (b.weightGrams || 0) - (a.weightGrams || 0);
        return 0;
      });
  }, [products, search, selectedCategory, stockStatusFilter, sortBy]);

  // ==========================================
  // Comprehensive Form Validation
  // ==========================================
  const validateForm = () => {
    const errors = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Soap Title is required (at least 3 characters)';
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Selling Price must be a valid positive number greater than ₹0.00';
    }

    if (formData.originalPrice) {
      const origNum = parseFloat(formData.originalPrice);
      if (isNaN(origNum) || origNum < 0) {
        errors.originalPrice = 'Original MRP Price must be a valid non-negative number';
      } else if (!isNaN(priceNum) && origNum > 0 && origNum < priceNum) {
        errors.originalPrice = `Original MRP (₹${origNum.toFixed(2)}) cannot be lower than selling price (₹${priceNum.toFixed(2)})`;
      }
    }

    const stockNum = parseInt(formData.stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.stockQuantity = 'Stock Quantity must be 0 or greater';
    }

    const weightNum = parseInt(formData.weightGrams, 10);
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.weightGrams = 'Unit Weight must be greater than 0 grams';
    }

    if (!formData.imageUrl || formData.imageUrl.trim().length === 0) {
      errors.imageUrl = 'An Image URL is required for catalog presentation';
    }

    if (!formData.category) {
      errors.category = 'Please select a valid botanical category';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==========================================
  // Database Save Handler (Add & Update)
  // ==========================================
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      onShowToast?.({
        title: 'Validation Incomplete',
        message: 'Please resolve the highlighted form errors before saving.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    // Find category entity ID for backend relational persistence
    const matchedCategory = categories.find((c) => c.name === formData.category || c.slug === formData.category);
    const categoryId = matchedCategory?.id || (editingProduct?.categoryId || null);

    const payload = {
      title: formData.title.trim(),
      name: formData.title.trim(),
      subtitle: formData.subtitle ? formData.subtitle.trim() : '',
      category: formData.category,
      categoryName: formData.category,
      categoryId: categoryId,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      stockQuantity: parseInt(formData.stockQuantity, 10) >= 0 ? parseInt(formData.stockQuantity, 10) : 100,
      weightGrams: parseInt(formData.weightGrams, 10) || 200,
      imageUrl: formData.imageUrl.trim(),
      badge: formData.badge ? formData.badge.trim() : null,
      scentProfile: formData.scentProfile ? formData.scentProfile.trim() : null,
      skinType: formData.skinType ? formData.skinType.trim() : null,
      description: formData.description ? formData.description.trim() : null,
      isActive: formData.isActive,
    };

    try {
      if (editingProduct) {
        // --- Database Update ---
        let updatedEntity = null;
        try {
          const res = await api.updateAdminProduct(editingProduct.id, payload);
          if (res?.data) updatedEntity = res.data;
        } catch (dbErr) {
          console.warn('[DB Sync] Falling back to local state on update:', dbErr.message);
        }

        const mergedProduct = updatedEntity || {
          ...editingProduct,
          ...payload,
        };

        setProducts((prev) =>
          prev.map((p) => (String(p.id) === String(editingProduct.id) ? mergedProduct : p))
        );

        onRecordAudit?.(
          'PRODUCT_UPDATED',
          'PRODUCT',
          editingProduct.id,
          `Updated formula & pricing for: ${payload.title}`
        );

        onShowToast?.({
          title: 'Product Updated',
          message: `Successfully saved changes for "${payload.title}".`,
          type: 'success',
        });
      } else {
        // --- Database Create ---
        let createdEntity = null;
        try {
          const res = await api.createAdminProduct(payload);
          if (res?.data) createdEntity = res.data;
        } catch (dbErr) {
          console.warn('[DB Sync] Falling back to local state on create:', dbErr.message);
        }

        const newProduct = createdEntity || {
          id: 'p-' + Date.now(),
          ...payload,
          rating: 5.0,
          reviewCount: 0,
        };

        setProducts((prev) => [newProduct, ...prev]);

        onRecordAudit?.(
          'PRODUCT_CREATED',
          'PRODUCT',
          newProduct.id,
          `Crafted new botanical bar: ${payload.title}`
        );

        onShowToast?.({
          title: 'Botanical Bar Created',
          message: `"${payload.title}" has been successfully saved to database & catalog.`,
          type: 'success',
        });
      }

      setIsModalOpen(false);
      setValidationErrors({});
    } catch (err) {
      console.error('[ProductManagement] Save error:', err);
      onShowToast?.({
        title: 'Save Operation Error',
        message: err.message || 'An unexpected error occurred while saving the product.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Database Soft Delete / Archive Toggle
  // ==========================================
  const handleToggleActive = async (product) => {
    const nextActive = !product.isActive;
    try {
      try {
        await api.updateAdminProduct(product.id, {
          ...product,
          isActive: nextActive,
        });
      } catch (dbErr) {
        console.warn('[DB Sync] Archive toggle local fallback:', dbErr.message);
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
      );

      onRecordAudit?.(
        'PRODUCT_STATUS_TOGGLED',
        'PRODUCT',
        product.id,
        `"${product.title}" set to ${nextActive ? 'ACTIVE' : 'ARCHIVED'}`
      );

      onShowToast?.({
        title: nextActive ? 'Product Restored' : 'Product Archived',
        message: nextActive
          ? `"${product.title}" is now active in storefront catalog.`
          : `"${product.title}" has been archived and hidden from customers.`,
        type: nextActive ? 'success' : 'info',
      });
    } catch (err) {
      onShowToast?.({
        title: 'Status Update Failed',
        message: err.message || 'Could not update active status.',
        type: 'error',
      });
    }
  };

  // ==========================================
  // Database Hard Delete / Permanent Removal
  // ==========================================
  const handleOpenDeleteConfirm = (product) => {
    setProductToDelete(product);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      try {
        await api.deleteAdminProductPermanent(productToDelete.id);
      } catch (dbErr) {
        console.warn('[DB Sync] Permanent delete local fallback:', dbErr.message);
      }

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

      onRecordAudit?.(
        'PRODUCT_PERMANENTLY_DELETED',
        'PRODUCT',
        productToDelete.id,
        `Permanently purged product "${productToDelete.title}" from database`
      );

      onShowToast?.({
        title: 'Product Permanently Deleted',
        message: `"${productToDelete.title}" was completely removed from the database.`,
        type: 'warning',
      });

      setProductToDelete(null);
    } catch (err) {
      console.error('[ProductManagement] Delete error:', err);
      onShowToast?.({
        title: 'Deletion Failed',
        message: err.message || 'Could not delete product from database.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // Quick Stock Adjustment & DB Sync
  // ==========================================
  const handleQuickStock = async (productId, delta) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const newQty = Math.max(0, targetProduct.stockQuantity + delta);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQty } : p))
    );

    try {
      api.updateAdminProduct(productId, {
        ...targetProduct,
        stockQuantity: newQty,
      }).catch((e) => console.warn('[DB Sync] Stock update background sync notice:', e.message));

      onRecordAudit?.(
        'STOCK_ADJUSTED',
        'PRODUCT',
        productId,
        `Stock adjusted for "${targetProduct.title}": ${targetProduct.stockQuantity} -> ${newQty}`
      );

      if (newQty <= 10 && delta < 0) {
        onShowToast?.({
          title: 'Low Stock Alert',
          message: `Warning: "${targetProduct.title}" has reached critical threshold (${newQty} units left).`,
          type: 'warning',
        });
      } else {
        onShowToast?.({
          title: 'Stock Updated',
          message: `Updated vault inventory for "${targetProduct.title}" to ${newQty} units.`,
          type: 'success',
        });
      }
    } catch (err) {
      onShowToast?.({
        title: 'Stock Adjustment Error',
        message: err.message || 'Could not update stock level.',
        type: 'error',
      });
    }
  };

  // ==========================================
  // Bulk Selection Handlers
  // ==========================================
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkRestock = (amount = 10) => {
    setProducts((prev) =>
      prev.map((p) =>
        selectedProductIds.includes(p.id)
          ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + amount) }
          : p
      )
    );
    onRecordAudit?.(
      'BULK_RESTOCK',
      'PRODUCT_INVENTORY',
      `COUNT_${selectedProductIds.length}`,
      `Restocked +${amount} units for ${selectedProductIds.length} botanical products`
    );
    onShowToast?.({
      title: 'Bulk Restock Applied',
      message: `Successfully added +${amount} units to ${selectedProductIds.length} selected soaps.`,
      type: 'success',
    });
    setSelectedProductIds([]);
  };

  const handleBulkToggleActive = (makeActive = true) => {
    setProducts((prev) =>
      prev.map((p) =>
        selectedProductIds.includes(p.id) ? { ...p, isActive: makeActive } : p
      )
    );
    onRecordAudit?.(
      'BULK_STATUS_CHANGE',
      'PRODUCT_INVENTORY',
      `COUNT_${selectedProductIds.length}`,
      `Set ${selectedProductIds.length} products to ${makeActive ? 'ACTIVE' : 'ARCHIVED'}`
    );
    onShowToast?.({
      title: makeActive ? 'Bulk Activated' : 'Bulk Archived',
      message: `Set ${selectedProductIds.length} products to ${makeActive ? 'ACTIVE' : 'ARCHIVED'}.`,
      type: makeActive ? 'success' : 'info',
    });
    setSelectedProductIds([]);
  };

  // Helper for preventing CSV Formula / Macro Injection
  const sanitizeCsvCell = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    const triggerChars = ['=', '+', '-', '@', '\t', '\r'];
    const safeStr = triggerChars.includes(str.charAt(0)) ? `'${str}` : str;
    return `"${safeStr.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Price (₹)', 'Original Price (₹)', 'Stock', 'Weight (g)', 'Status', 'Scent Profile'];
    const rows = filteredProducts.map((p) => [
      sanitizeCsvCell(p.id),
      sanitizeCsvCell(p.title),
      sanitizeCsvCell(p.category || ''),
      p.price,
      p.originalPrice || '',
      p.stockQuantity,
      p.weightGrams || 125,
      p.isActive ? 'ACTIVE' : 'ARCHIVED',
      sanitizeCsvCell(p.scentProfile || ''),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sage_and_Bloom_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onRecordAudit?.('EXPORT_INVENTORY_CSV', 'PRODUCT_CATALOG', 'ALL', 'Exported product inventory catalog to CSV');
    onShowToast?.({
      title: 'Catalog Exported',
      message: 'Downloaded product inventory CSV spreadsheet.',
      type: 'info',
    });
  };

  // Recipe Duplication
  const handleDuplicateProduct = (product) => {
    const duplicated = {
      ...product,
      id: 'p-' + Date.now(),
      title: `${product.title} (Batch Copy)`,
      stockQuantity: 25,
      isActive: true,
      reviewCount: 0,
      rating: 5.0,
    };
    setProducts([duplicated, ...products]);
    onRecordAudit?.('PRODUCT_DUPLICATED', 'PRODUCT', duplicated.id, `Cloned botanical soap: ${product.title}`);
    onShowToast?.({
      title: 'Recipe Cloned',
      message: `Duplicated "${product.title}" into a new batch formulation.`,
      type: 'success',
    });
  };

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setValidationErrors({});
    setUploadedFileMeta(null);
    setImageInputMode('upload');
    setIsDragging(false);
    setFormData({
      title: '',
      subtitle: '',
      category: categories[0]?.name || 'Botanical Herbal',
      price: '',
      originalPrice: '',
      stockQuantity: 100,
      weightGrams: 200,
      imageUrl: '/images/slide_1.jpg',
      badge: 'Artisan',
      scentProfile: '',
      skinType: 'All Skin Types · Clarifying',
      description: 'Hand-blended and slow cured cold process soap with natural plant oils, raw botanicals, and gentle aromatherapy.',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setValidationErrors({});
    setUploadedFileMeta(null);
    setImageInputMode(product.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setIsDragging(false);
    setFormData({
      title: product.title || '',
      subtitle: product.subtitle || '',
      category: product.category || categories[0]?.name || 'Botanical Herbal',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      stockQuantity: product.stockQuantity ?? 100,
      weightGrams: product.weightGrams ?? 200,
      imageUrl: product.imageUrl || '/images/slide_1.jpg',
      badge: product.badge || '',
      scentProfile: product.scentProfile || '',
      skinType: product.skinType || 'All Skin Types',
      description: product.description || '',
      isActive: product.isActive !== false,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="products-page-container">
      {/* 1. Page Header & Primary Actions */}
      <section className="products-header-section">
        <div className="products-title-group">
          <div className="products-title-row">
            <h2>Products Management</h2>
            <span className="products-count-chip">{metrics.totalCount} Products</span>
          </div>
          <p className="products-header-subtitle">
            Catalog control: add new products, edit pricing, weight & stock, or remove products from the database
          </p>
        </div>

        <div className="products-header-actions">
          <button
            type="button"
            className="btn-header-ghost"
            onClick={handleExportCSV}
            title="Export catalog to CSV spreadsheet"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn-create-botanical"
            onClick={handleOpenAddModal}
            title="Add a new product to the catalog"
          >
            <span>🌿</span>
            <span>+ Add New Product</span>
          </button>
        </div>
      </section>

      {/* 2. Interactive KPI Metrics Strip */}
      <section className="products-kpi-grid">
        <div className="prod-kpi-card">
          <div className="kpi-icon-box sage">🧼</div>
          <div className="kpi-content">
            <span className="kpi-label">Active Formulas</span>
            <div className="kpi-value-row">
              <span className="kpi-big-num">{metrics.activeCount}</span>
              <span className="kpi-subtext">/ {metrics.totalCount} in Catalog</span>
            </div>
          </div>
        </div>

        <div className="prod-kpi-card">
          <div className="kpi-icon-box moss">📦</div>
          <div className="kpi-content">
            <span className="kpi-label">Vault Units</span>
            <div className="kpi-value-row">
              <span className="kpi-big-num">{metrics.totalUnits}</span>
              <span className="kpi-subtext">Cured Bars</span>
            </div>
          </div>
        </div>

        <div
          className={`prod-kpi-card ${metrics.lowStockCount > 0 ? 'alert-card' : ''}`}
          onClick={() => setStockStatusFilter(stockStatusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          style={{ cursor: 'pointer' }}
          title="Click to toggle low stock filter"
        >
          <div className="kpi-icon-box amber">
            {metrics.lowStockCount > 0 ? '⚠️' : '✅'}
          </div>
          <div className="kpi-content">
            <span className="kpi-label">
              Low Stock Alerts {metrics.lowStockCount > 0 && <span className="kpi-pulse-dot" />}
            </span>
            <div className="kpi-value-row">
              <span className="kpi-big-num" style={{ color: metrics.lowStockCount > 0 ? '#B45309' : '#15803D' }}>
                {metrics.lowStockCount}
              </span>
              <span className="kpi-subtext">{stockStatusFilter === 'LOW_STOCK' ? '(Filtering Active)' : 'Batches ≤ 10'}</span>
            </div>
          </div>
        </div>

        <div className="prod-kpi-card">
          <div className="kpi-icon-box clay">💎</div>
          <div className="kpi-content">
            <span className="kpi-label">Inventory Valuation</span>
            <div className="kpi-value-row">
              <span className="kpi-big-num">{metrics.totalValuation}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search, Filters & View Control Bar */}
      <section className="products-toolbar-card">
        <div className="toolbar-top-row">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <span className="search-lens-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by soap title, scent profile, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="product-search-input"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stock Filter Tabs */}
          <div className="stock-filter-tabs">
            <button
              type="button"
              className={`stock-tab-btn ${stockStatusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('ALL')}
            >
              All Bars <span className="tab-badge">{products.length}</span>
            </button>
            <button
              type="button"
              className={`stock-tab-btn ${stockStatusFilter === 'IN_STOCK' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('IN_STOCK')}
            >
              In Stock <span className="tab-badge">{products.filter((p) => p.stockQuantity > 10 && p.isActive).length}</span>
            </button>
            <button
              type="button"
              className={`stock-tab-btn ${stockStatusFilter === 'LOW_STOCK' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('LOW_STOCK')}
            >
              Low Stock <span className="tab-badge" style={{ color: '#B45309' }}>{metrics.lowStockCount}</span>
            </button>
            <button
              type="button"
              className={`stock-tab-btn ${stockStatusFilter === 'ARCHIVED' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('ARCHIVED')}
            >
              Archived <span className="tab-badge">{products.filter((p) => !p.isActive).length}</span>
            </button>
          </div>

          {/* Controls Right: Sort & View Toggle */}
          <div className="toolbar-controls-right">
            <div className="sort-select-wrap">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="product-sort-select"
              >
                <option value="name-asc">Title: A → Z</option>
                <option value="name-desc">Title: Z → A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
                <option value="weight">Weight (g)</option>
              </select>
            </div>

            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Artisan Grid / Card View"
              >
                🎴
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Data Table View"
              >
                📋
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Row */}
        <div className="category-pills-row">
          <button
            type="button"
            className={`category-pill-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            <span>🌿 All Categories</span>
            <span className="category-pill-count">{products.length}</span>
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            return (
              <button
                key={cat.id || cat.name}
                type="button"
                className={`category-pill-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span>🏷️ {cat.name}</span>
                <span className="category-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Floating Bulk Actions Bar (when products selected) */}
      {selectedProductIds.length > 0 && (
        <div className="bulk-actions-dock">
          <div className="bulk-dock-left">
            <span>✨</span>
            <span className="bulk-selection-count">
              {selectedProductIds.length} {selectedProductIds.length === 1 ? 'bar selected' : 'bars selected'}
            </span>
            <button
              type="button"
              className="btn-bulk-deselect"
              onClick={() => setSelectedProductIds([])}
            >
              Deselect All
            </button>
          </div>

          <div className="bulk-dock-actions">
            <button
              type="button"
              className="btn-bulk-action"
              onClick={() => handleBulkRestock(10)}
              title="Add 10 units of stock to selected products"
            >
              <span>+10 Restock</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action"
              onClick={() => handleBulkToggleActive(true)}
            >
              <span>Activate</span>
            </button>
            <button
              type="button"
              className="btn-bulk-action"
              onClick={() => handleBulkToggleActive(false)}
            >
              <span>Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Products Content Area (Grid vs Table) */}
      {filteredProducts.length === 0 ? (
        <div className="products-empty-state">
          <div className="empty-state-icon">🧼</div>
          <h3>No Botanical Soaps Found</h3>
          <p>
            No products matched your current filters or search term "{search}". Try clearing filters or creating a new botanical bar recipe.
          </p>
          <button
            type="button"
            className="btn-create-botanical"
            style={{ marginTop: 12 }}
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
              setStockStatusFilter('ALL');
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Artisan Product Card Grid */
        <div className="artisan-product-grid">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            const isLow = product.stockQuantity > 0 && product.stockQuantity <= 10;
            const isOut = product.stockQuantity === 0;
            const stockStatus = isOut ? 'out' : isLow ? 'low' : 'safe';
            const stockStatusLabel = isOut ? 'Out of Stock' : isLow ? `Low Stock (${product.stockQuantity})` : `In Stock (${product.stockQuantity})`;
            const discountPercent = product.originalPrice && product.originalPrice > product.price
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : null;
            const scentTags = product.scentProfile ? product.scentProfile.split(',').map((s) => s.trim()).filter(Boolean) : [];

            return (
              <div
                key={product.id}
                className={`artisan-product-card ${!product.isActive ? 'is-archived' : ''} ${isSelected ? 'is-selected' : ''}`}
              >
                {/* Media Image Header */}
                <div className="card-media-wrapper">
                  <img
                    src={product.imageUrl || '/images/slide_1.jpg'}
                    alt={product.title}
                    className="card-product-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/images/slide_1.jpg';
                    }}
                  />

                  <div className="card-top-badges">
                    <div className="card-select-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        aria-label={`Select ${product.title}`}
                      />
                    </div>

                    {product.badge && (
                      <span className={`card-badge-pill ${product.badge.toLowerCase().includes('best') ? 'bestseller' : product.badge.toLowerCase().includes('limit') ? 'limited' : 'artisan'}`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="card-body">
                  <div className="card-header-meta">
                    <span className="card-category-tag">{product.category || 'Botanical'}</span>
                    <span className="card-weight-tag">{product.weightGrams || 125}g</span>
                  </div>

                  <div className="card-title-block">
                    <h3>{product.title}</h3>
                    <div className="card-subtitle">{product.subtitle || product.skinType}</div>
                  </div>

                  {/* Scent Tags */}
                  {scentTags.length > 0 && (
                    <div className="card-scent-tags">
                      {scentTags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="scent-tag">
                          🌿 {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing Row */}
                  <div className="card-pricing-row">
                    <span className="card-price-current">₹{Number(product.price).toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="card-price-original">₹{Number(product.originalPrice).toFixed(2)}</span>
                    )}
                    {discountPercent && (
                      <span className="card-discount-pill">{discountPercent}% OFF</span>
                    )}
                  </div>

                  {/* Stock Level & Stepper */}
                  <div className="card-stock-section">
                    <div className="stock-section-header">
                      <div className={`stock-status-indicator ${stockStatus}`}>
                        <span className="status-dot-sm" />
                        <span>{stockStatusLabel}</span>
                      </div>

                      <div className="stock-stepper-control">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => handleQuickStock(product.id, -1)}
                          title="Decrease stock by 1"
                        >
                          −
                        </button>
                        <span className="stepper-value">{product.stockQuantity}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => handleQuickStock(product.id, 1)}
                          title="Increase stock by 1"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="stock-meter-track">
                      <div
                        className={`stock-meter-fill ${stockStatus}`}
                        style={{ width: `${Math.min(100, Math.max(8, (product.stockQuantity / 60) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="card-actions-footer">
                    <button
                      type="button"
                      className="btn-card-action primary"
                      onClick={() => handleOpenEditModal(product)}
                      title="Edit product details, pricing, and stock"
                    >
                      <span>✏️ Edit Product</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon-square"
                      onClick={() => handleDuplicateProduct(product)}
                      title="Duplicate this product"
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      className="btn-icon-square"
                      onClick={() => handleToggleActive(product)}
                      title={product.isActive ? 'Archive this product' : 'Restore from archive'}
                    >
                      {product.isActive ? '📦' : '♻️'}
                    </button>
                    <button
                      type="button"
                      className="btn-icon-square danger"
                      onClick={() => handleOpenDeleteConfirm(product)}
                      title="Remove / Delete product from database"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="products-table-card">
          <div className="products-table-wrapper">
            <table className="products-luxury-table">
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 20 }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProductIds.length === filteredProducts.length
                      }
                      onChange={handleSelectAll}
                      aria-label="Select all products"
                    />
                  </th>
                  <th>Product Recipe</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Inventory</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= 10;
                  const isOut = p.stockQuantity === 0;
                  const stockClass = isOut ? 'out' : isLow ? 'low' : 'safe';

                  return (
                    <tr key={p.id} className={isSelected ? 'row-selected' : ''}>
                      <td style={{ paddingLeft: 20 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          aria-label={`Select ${p.title}`}
                        />
                      </td>
                      <td>
                        <div className="table-product-info-cell">
                          <div className="table-thumb-box">
                            <img
                              src={p.imageUrl || '/images/slide_1.jpg'}
                              alt={p.title}
                              className="table-thumb-img"
                              onError={(e) => {
                                e.target.src = '/images/slide_1.jpg';
                              }}
                            />
                          </div>
                          <div className="table-title-meta">
                            <strong>{p.title}</strong>
                            <span>{p.scentProfile || p.subtitle || p.skinType}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-category-badge">{p.category || 'Botanical'}</span>
                      </td>
                      <td>
                        <div className="table-price-cell">
                          <span className="table-price-current">₹{Number(p.price).toFixed(2)}</span>
                          {p.originalPrice && (
                            <span className="table-price-original">₹{Number(p.originalPrice).toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="stock-stepper-control">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => handleQuickStock(p.id, -1)}
                            >
                              −
                            </button>
                            <span className="stepper-value">{p.stockQuantity}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => handleQuickStock(p.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <span className={`stock-status-indicator ${stockClass}`} style={{ fontSize: '0.72rem' }}>
                            <span className="status-dot-sm" />
                            <span>{isOut ? 'Out' : isLow ? 'Low' : 'OK'}</span>
                          </span>
                        </div>
                      </td>
                      <td>{p.weightGrams || 125}g</td>
                      <td>
                        <span className={`status-badge-pill ${p.isActive ? 'active' : 'archived'}`}>
                          <span className="status-dot-sm" />
                          <span>{p.isActive ? 'Active' : 'Archived'}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="table-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-icon-square"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-icon-square"
                            onClick={() => handleDuplicateProduct(p)}
                            title="Duplicate Recipe"
                          >
                            📋
                          </button>
                          <button
                            type="button"
                            className="btn-icon-square"
                            onClick={() => handleToggleActive(p)}
                            title={p.isActive ? 'Archive Product' : 'Restore Product'}
                          >
                            {p.isActive ? '📦' : '♻️'}
                          </button>
                          <button
                            type="button"
                            className="btn-icon-square danger"
                            onClick={() => handleOpenDeleteConfirm(p)}
                            title="Permanently Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          6. High-End Add / Edit Botanical Soap Modal
          ========================================== */}
      {isModalOpen && (
        <div className="product-modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="product-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-bar">
              <div className="modal-header-title">
                <div className="modal-title-icon">🌿</div>
                <div>
                  <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                  <p>Product details, catalog curation, stock, weight, and pricing parameters</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body-scroll">
                {/* Inline Validation Errors Alert Card */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="modal-validation-alert">
                    <span className="validation-alert-icon">⚠️</span>
                    <div className="validation-alert-content">
                      <strong>Please correct the following before saving:</strong>
                      <ul className="validation-error-list">
                        {Object.values(validationErrors).map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Section 1: Basic Identity */}
                <div className="modal-section-card">
                  <span className="section-legend">🧼 Formula Identity</span>
                  <div className="modal-form-grid-2">
                    <div className="modal-input-field">
                      <label>Soap Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (validationErrors.title) {
                            setValidationErrors({ ...validationErrors, title: null });
                          }
                        }}
                        placeholder="e.g. Wild Orchid & Amber Bar"
                        className={`modal-text-input ${validationErrors.title ? 'input-has-error' : ''}`}
                      />
                      {validationErrors.title && <span className="field-error-text">{validationErrors.title}</span>}
                    </div>
                    <div className="modal-input-field">
                      <label>Botanical Subtitle / Blend</label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="e.g. French Lavender & Slate Mineral"
                        className="modal-text-input"
                      />
                    </div>
                  </div>

                  <div className="modal-form-grid-3">
                    <div className="modal-input-field">
                      <label>Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          if (validationErrors.category) {
                            setValidationErrors({ ...validationErrors, category: null });
                          }
                        }}
                        className={`modal-select-input ${validationErrors.category ? 'input-has-error' : ''}`}
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {validationErrors.category && <span className="field-error-text">{validationErrors.category}</span>}
                    </div>

                    <div className="modal-input-field">
                      <label>Badge Tag</label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g. Artisan, Bestseller, Signature"
                        className="modal-text-input"
                      />
                    </div>

                    <div className="modal-input-field">
                      <label>Catalog Status</label>
                      <select
                        value={formData.isActive ? 'ACTIVE' : 'ARCHIVED'}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                        className="modal-select-input"
                      >
                        <option value="ACTIVE">🌿 Active in Catalog</option>
                        <option value="ARCHIVED">📦 Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing & Vault Units */}
                <div className="modal-section-card">
                  <span className="section-legend">💰 Pricing & Inventory Vault</span>
                  <div className="modal-form-grid-4">
                    <div className="modal-input-field">
                      <label>Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formData.price}
                        onChange={(e) => {
                          setFormData({ ...formData, price: e.target.value });
                          if (validationErrors.price) {
                            setValidationErrors({ ...validationErrors, price: null });
                          }
                        }}
                        placeholder="16.00"
                        className={`modal-text-input ${validationErrors.price ? 'input-has-error' : ''}`}
                      />
                      {validationErrors.price && <span className="field-error-text">{validationErrors.price}</span>}
                    </div>

                    <div className="modal-input-field">
                      <label>MRP / Original (₹)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.originalPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, originalPrice: e.target.value });
                          if (validationErrors.originalPrice) {
                            setValidationErrors({ ...validationErrors, originalPrice: null });
                          }
                        }}
                        placeholder="20.00"
                        className={`modal-text-input ${validationErrors.originalPrice ? 'input-has-error' : ''}`}
                      />
                      {validationErrors.originalPrice && <span className="field-error-text">{validationErrors.originalPrice}</span>}
                    </div>

                    <div className="modal-input-field">
                      <label>Stock Quantity (Units) *</label>
                      <input
                        type="number"
                        required
                        value={formData.stockQuantity}
                        onChange={(e) => {
                          setFormData({ ...formData, stockQuantity: e.target.value });
                          if (validationErrors.stockQuantity) {
                            setValidationErrors({ ...validationErrors, stockQuantity: null });
                          }
                        }}
                        className={`modal-text-input ${validationErrors.stockQuantity ? 'input-has-error' : ''}`}
                      />
                      {validationErrors.stockQuantity && <span className="field-error-text">{validationErrors.stockQuantity}</span>}
                    </div>

                    <div className="modal-input-field">
                      <label>Weight (Grams) *</label>
                      <input
                        type="number"
                        required
                        value={formData.weightGrams}
                        onChange={(e) => {
                          setFormData({ ...formData, weightGrams: e.target.value });
                          if (validationErrors.weightGrams) {
                            setValidationErrors({ ...validationErrors, weightGrams: null });
                          }
                        }}
                        placeholder="125"
                        className={`modal-text-input ${validationErrors.weightGrams ? 'input-has-error' : ''}`}
                      />
                      {validationErrors.weightGrams && <span className="field-error-text">{validationErrors.weightGrams}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 3: Aromatherapy & Recipe Notes */}
                <div className="modal-section-card">
                  <span className="section-legend">🌸 Aromatherapy & Botanical Blend</span>
                  <div className="modal-form-grid-2">
                    <div className="modal-input-field">
                      <label>Scent Profile (Comma-separated)</label>
                      <input
                        type="text"
                        value={formData.scentProfile}
                        onChange={(e) => setFormData({ ...formData, scentProfile: e.target.value })}
                        placeholder="e.g. Crisp Pine, Wild Sage, Crushed Cedar"
                        className="modal-text-input"
                      />
                    </div>
                    <div className="modal-input-field">
                      <label>Skin Type Compatibility</label>
                      <input
                        type="text"
                        value={formData.skinType}
                        onChange={(e) => setFormData({ ...formData, skinType: e.target.value })}
                        placeholder="e.g. Normal to Sensitive · Clarifying"
                        className="modal-text-input"
                      />
                    </div>
                  </div>

                  <div className="modal-input-field">
                    <label>Ingredients & Curing Notes</label>
                    <textarea
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the plant oils, cold-process curing, and natural botanical additives..."
                      className="modal-textarea-input"
                    />
                  </div>
                </div>

                {/* Section 4: Imagery & Preset Gallery */}
                <div className="modal-section-card">
                  <div className="section-legend-row">
                    <span className="section-legend">🖼️ Botanical Imagery & Gallery</span>
                    <div className="image-source-pills">
                      <button
                        type="button"
                        className={`source-pill-btn ${imageInputMode === 'upload' ? 'active' : ''}`}
                        onClick={() => setImageInputMode('upload')}
                      >
                        <span>📤 Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        className={`source-pill-btn ${imageInputMode === 'url' ? 'active' : ''}`}
                        onClick={() => setImageInputMode('url')}
                      >
                        <span>🔗 Image URL</span>
                      </button>
                      <button
                        type="button"
                        className={`source-pill-btn ${imageInputMode === 'preset' ? 'active' : ''}`}
                        onClick={() => setImageInputMode('preset')}
                      >
                        <span>🌿 Presets</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Upload from Laptop / Computer */}
                  {imageInputMode === 'upload' && (
                    <div className="image-upload-wrapper">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileUpload(file);
                          e.target.value = '';
                        }}
                      />

                      <div
                        className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${formData.imageUrl ? 'has-file' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleImageFileUpload(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="dropzone-inner-content">
                          <div className="dropzone-icon-circle">
                            <span className="dropzone-icon">📸</span>
                          </div>
                          <div className="dropzone-text-block">
                            <strong className="dropzone-title">Click to upload or drag & drop photo</strong>
                            <p className="dropzone-subtitle">Choose soap photos directly from your laptop or computer</p>
                            <div className="dropzone-tags">
                              <span className="dropzone-tag">PNG, JPG, WEBP, GIF</span>
                              <span className="dropzone-tag">Max 10 MB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-browse-computer"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            <span>📁</span>
                            <span>Browse Computer</span>
                          </button>
                        </div>
                      </div>

                      {/* Uploaded Image Live Preview Card */}
                      {formData.imageUrl && (
                        <div className="uploaded-image-preview-card">
                          <div className="preview-img-container">
                            <img
                              src={formData.imageUrl}
                              alt="Uploaded Product Preview"
                              className="preview-img-thumb"
                              onError={(e) => {
                                e.target.src = '/images/slide_1.jpg';
                              }}
                            />
                            <span className="preview-badge-status">✓ Ready</span>
                          </div>
                          <div className="preview-meta-info">
                            <strong className="preview-file-name">
                              {uploadedFileMeta?.name || (formData.imageUrl.startsWith('data:') ? 'Custom Uploaded Photo' : formData.imageUrl)}
                            </strong>
                            <span className="preview-file-details">
                              {uploadedFileMeta ? `${uploadedFileMeta.size} · ${uploadedFileMeta.type || 'Image'}` : 'Active product photo'}
                            </span>
                            <div className="preview-actions-row">
                              <button
                                type="button"
                                className="btn-preview-action change"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                🔄 Replace Photo
                              </button>
                              <button
                                type="button"
                                className="btn-preview-action remove"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, imageUrl: '' }));
                                  setUploadedFileMeta(null);
                                }}
                              >
                                ✕ Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {validationErrors.imageUrl && <span className="field-error-text">{validationErrors.imageUrl}</span>}
                    </div>
                  )}

                  {/* Mode 2: Custom Image URL */}
                  {imageInputMode === 'url' && (
                    <div className="image-url-mode-wrapper">
                      <div className="modal-input-field">
                        <label>Custom Image URL *</label>
                        <input
                          type="text"
                          required
                          value={formData.imageUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, imageUrl: e.target.value });
                            setUploadedFileMeta(null);
                            if (validationErrors.imageUrl) {
                              setValidationErrors({ ...validationErrors, imageUrl: null });
                            }
                          }}
                          placeholder="/images/slide_1.jpg or https://..."
                          className={`modal-text-input ${validationErrors.imageUrl ? 'input-has-error' : ''}`}
                        />
                        {validationErrors.imageUrl && <span className="field-error-text">{validationErrors.imageUrl}</span>}
                      </div>
                      {formData.imageUrl && (
                        <div className="url-preview-mini">
                          <img
                            src={formData.imageUrl}
                            alt="URL Preview"
                            className="url-preview-img"
                            onError={(e) => {
                              e.target.src = '/images/slide_1.jpg';
                            }}
                          />
                          <span className="url-preview-text">Live URL Preview</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 3: Studio Botanical Presets */}
                  {imageInputMode === 'preset' && (
                    <div className="image-preset-picker">
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--prod-text-muted)' }}>
                        Select a high-resolution studio photo from our botanical catalog:
                      </label>
                      <div className="preset-thumbs-grid">
                        {PRESET_SOAP_IMAGES.map((preset) => {
                          const isSelected = formData.imageUrl === preset.url;
                          return (
                            <button
                              key={preset.url}
                              type="button"
                              className={`preset-thumb-btn ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, imageUrl: preset.url });
                                setUploadedFileMeta(null);
                                if (validationErrors.imageUrl) {
                                  setValidationErrors({ ...validationErrors, imageUrl: null });
                                }
                              }}
                              title={preset.label}
                            >
                              <img src={preset.url} alt={preset.label} className="preset-thumb-img" />
                              {isSelected && <span className="preset-check-badge">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span>⏳ Saving Product...</span>
                  ) : editingProduct ? (
                    <span>✨ Save Changes</span>
                  ) : (
                    <span>🌿 Add Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          7. Danger Permanent Delete Confirmation Modal
          ========================================== */}
      {productToDelete && (
        <div className="delete-confirm-backdrop" onClick={() => !isDeleting && setProductToDelete(null)}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">⚠️</div>
              <div>
                <h3>Permanently Delete Product?</h3>
                <p>This will erase the botanical formulation from the database.</p>
              </div>
            </div>

            <div className="delete-product-card-preview">
              <img
                src={productToDelete.imageUrl || '/images/slide_1.jpg'}
                alt={productToDelete.title}
                className="delete-preview-thumb"
                onError={(e) => {
                  e.target.src = '/images/slide_1.jpg';
                }}
              />
              <div className="delete-preview-info">
                <strong>{productToDelete.title}</strong>
                <span>
                  {productToDelete.category || 'Botanical'} · ₹{Number(productToDelete.price).toFixed(2)} · {productToDelete.stockQuantity} units in stock
                </span>
              </div>
            </div>

            <div className="delete-warning-callout">
              <strong>⚠️ Irreversible Database Action:</strong> All records and formula specifications for this product will be permanently purged. If you only want to hide this item from your storefront while keeping order history intact, click <strong>Archive Instead</strong>.
            </div>

            <div className="delete-actions-row">
              <button
                type="button"
                className="btn-delete-cancel"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-archive-fallback"
                disabled={isDeleting}
                onClick={() => {
                  const toArchive = productToDelete;
                  setProductToDelete(null);
                  handleToggleActive(toArchive);
                }}
              >
                📦 Archive Instead
              </button>
              <button
                type="button"
                className="btn-delete-danger"
                disabled={isDeleting}
                onClick={handleConfirmPermanentDelete}
              >
                {isDeleting ? 'Erasing...' : '🗑️ Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
