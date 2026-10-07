import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { products as DEFAULT_STORE_PRODUCTS, categories as DEFAULT_CATEGORIES } from '../data/productsData';
import { INITIAL_ADMIN_PRODUCTS, INITIAL_CATEGORIES } from '../admin/adminData';
import api from '../services/api';

const ProductContext = createContext();

const PRODUCTS_STORAGE_KEY = 'sage_bloom_custom_products';
const CATEGORIES_STORAGE_KEY = 'sage_bloom_custom_categories';

/**
 * Maps category display name to storefront filter code
 */
export const mapCategoryToCode = (catName) => {
  if (!catName) return 'herbal';
  const lower = String(catName).toLowerCase();
  if (lower.includes('herb') || lower.includes('botanical') || lower === 'herbal') return 'herbal';
  if (lower.includes('flor') || lower.includes('rose') || lower === 'floral') return 'floral';
  if (lower.includes('honey') || lower.includes('nourish') || lower === 'honey') return 'honey';
  if (lower.includes('moist') || lower.includes('exfoliat') || lower.includes('purif') || lower === 'moisturizing') return 'moisturizing';
  if (lower.includes('gift') || lower.includes('spec') || lower.includes('season') || lower === 'special') return 'special';
  return lower.replace(/[^a-z0-9]+/g, '-');
};

/**
 * Maps filter code to category display name
 */
export const mapCodeToCategoryName = (code) => {
  switch (code) {
    case 'herbal': return 'Botanical Herbal';
    case 'floral': return 'Floral & Rose';
    case 'honey': return 'Nourishing & Honey';
    case 'moisturizing': return 'Exfoliating & Purifying';
    case 'special': return 'Gift Sets & Collections';
    default: return code;
  }
};

/**
 * Seamlessly normalizes product objects for both storefront and admin views
 */
export const normalizeProduct = (p) => {
  if (!p) return null;
  const title = p.name || p.title || 'Botanical Soap';
  const price = parseFloat(p.price) || 0;
  const originalPrice = p.originalPrice
    ? parseFloat(p.originalPrice)
    : (price ? Math.round(price * 1.15) : 0);
  const imageUrl = p.img || p.imageUrl || p.image_url || '/images/slide_1.jpg';
  const categoryName = p.category || (p.cat ? mapCodeToCategoryName(p.cat) : 'Botanical Herbal');
  const catCode = p.cat || mapCategoryToCode(p.category);
  const weightGrams = parseInt(p.weightGrams, 10) || (p.weight ? parseInt(String(p.weight).replace(/\D/g, ''), 10) : 200) || 200;

  const rawIngredients = Array.isArray(p.ingredients)
    ? p.ingredients
    : (typeof p.ingredients === 'string'
        ? p.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Oat Milk', 'Shea Butter', 'Coconut Oil', 'Dried Wildflowers', 'Essential Oils']);

  const rawBenefits = Array.isArray(p.benefits) && p.benefits.length > 0
    ? p.benefits
    : ['Helps leave skin feeling soft and nourished', 'Gently cleanses without stripping natural moisture', 'Calming natural botanical aroma'];

  return {
    id: p.id,
    name: title,
    title: title,
    subtitle: p.subtitle || '',
    slug: p.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    cat: catCode,
    category: categoryName,
    categoryId: p.categoryId || p.category_id || 1,
    tag: p.tag || p.badge || 'Artisan Soap',
    badge: p.badge || p.tag || 'Artisan Soap',
    img: imageUrl,
    imageUrl: imageUrl,
    price: price,
    originalPrice: originalPrice,
    rating: parseFloat(p.rating) || 5.0,
    reviews: parseInt(p.reviews || p.reviewCount, 10) || 0,
    reviewCount: parseInt(p.reviewCount || p.reviews, 10) || 0,
    desc: p.desc || p.description || 'A handcrafted artisan soap poured and slow-cured with unrefined plant oils and gentle botanical extracts.',
    description: p.description || p.desc || 'A handcrafted artisan soap poured and slow-cured with unrefined plant oils and gentle botanical extracts.',
    weight: p.weight || `${weightGrams}g bar`,
    weightGrams: weightGrams,
    stockQuantity: parseInt(p.stockQuantity, 10) >= 0 ? parseInt(p.stockQuantity, 10) : 100,
    scentProfile: p.scentProfile || 'Wild Botanicals & Pure Essential Oils',
    skinType: p.skinType || p.suitable || 'All skin types',
    suitable: p.suitable || p.skinType || 'All skin types',
    ingredients: rawIngredients,
    benefits: rawBenefits,
    use: p.use || 'Lather in hand or on a washcloth, massage over damp skin, rinse well.',
    isActive: p.isActive !== false,
  };
};

export const ProductProvider = ({ children }) => {
  // Initialize from LocalStorage or default initial catalogs
  const [products, setProductsState] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('[ProductContext] Error loading products from localStorage:', e);
    }

    // Default to initial catalog (all 16 products normalized)
    const initialList = INITIAL_ADMIN_PRODUCTS && INITIAL_ADMIN_PRODUCTS.length > 0
      ? INITIAL_ADMIN_PRODUCTS
      : DEFAULT_STORE_PRODUCTS;
    return initialList.map(normalizeProduct).filter(Boolean);
  });

  const [categories, setCategoriesState] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ProductContext] Error loading categories from localStorage:', e);
    }
    return INITIAL_CATEGORIES || [
      { id: 1, name: 'Botanical Herbal', slug: 'botanical-herbal' },
      { id: 2, name: 'Floral & Rose', slug: 'floral-rose' },
      { id: 3, name: 'Exfoliating & Purifying', slug: 'exfoliating-purifying' },
      { id: 4, name: 'Nourishing & Honey', slug: 'nourishing-honey' },
      { id: 5, name: 'Gift Sets & Collections', slug: 'gift-sets' },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync products state wrapper with localStorage persistence
  const setProducts = useCallback((updater) => {
    setProductsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const normalizedNext = Array.isArray(next) ? next.map(normalizeProduct).filter(Boolean) : [];
      try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(normalizedNext));
      } catch (e) {
        console.error('[ProductContext] Failed to persist products to localStorage:', e);
      }
      return normalizedNext;
    });
  }, []);

  // Sync categories state wrapper with localStorage persistence
  const setCategories = useCallback((updater) => {
    setCategoriesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('[ProductContext] Failed to persist categories to localStorage:', e);
      }
      return next;
    });
  }, []);

  // Sync live backend data when available
  const syncWithBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.allSettled([
        api.getAdminProducts().catch(() => api.getProducts()),
        api.getCategories(),
      ]);

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value?.data) && prodRes.value.data.length > 0) {
        const liveProducts = prodRes.value.data.map(normalizeProduct).filter(Boolean);
        setProductsState(liveProducts);
        try {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(liveProducts));
        } catch (e) {
          console.warn('[ProductContext] LocalStorage sync warning:', e);
        }
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data) && catRes.value.data.length > 0) {
        setCategoriesState(catRes.value.data);
        try {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(catRes.value.data));
        } catch (e) {
          console.warn('[ProductContext] LocalStorage cat sync warning:', e);
        }
      }
    } catch (e) {
      console.warn('[ProductContext] Backend sync fallback to offline/cached products:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Public active products for storefront (Shop Grid, Modal, Cart)
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.isActive !== false);
  }, [products]);

  // CRUD Helpers
  const addProduct = useCallback(async (productData) => {
    const tempId = productData.id || 'p-' + Date.now();
    const optimisticProduct = normalizeProduct({
      id: tempId,
      ...productData,
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 0,
      isActive: productData.isActive !== false,
    });

    setProducts((prev) => [optimisticProduct, ...prev]);

    // Send payload to backend database
    try {
      const payload = {
        title: productData.title || productData.name,
        subtitle: productData.subtitle || '',
        category: productData.category,
        categoryName: productData.category || (productData.cat ? mapCodeToCategoryName(productData.cat) : 'Botanical Herbal'),
        categoryId: productData.categoryId,
        price: parseFloat(productData.price) || 0,
        originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
        stockQuantity: parseInt(productData.stockQuantity, 10) >= 0 ? parseInt(productData.stockQuantity, 10) : 50,
        weightGrams: parseInt(productData.weightGrams, 10) || 200,
        imageUrl: productData.imageUrl || productData.img || '/images/slide_1.jpg',
        badge: productData.badge || productData.tag || 'Artisan Soap',
        scentProfile: productData.scentProfile || '',
        skinType: productData.skinType || productData.suitable || '',
        description: productData.description || productData.desc || '',
        isActive: productData.isActive !== false,
      };

      const res = await api.createAdminProduct(payload);
      if (res?.data) {
        const savedEntity = normalizeProduct(res.data);
        setProducts((prev) =>
          prev.map((p) => (String(p.id) === String(tempId) ? savedEntity : p))
        );
        return savedEntity;
      }
    } catch (err) {
      console.warn('[ProductContext] Background DB create notice:', err.message);
    }

    return optimisticProduct;
  }, [setProducts]);

  const updateProduct = useCallback(async (id, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? normalizeProduct({ ...p, ...updatedFields }) : p))
    );

    try {
      const res = await api.updateAdminProduct(id, updatedFields);
      if (res?.data) {
        const updatedEntity = normalizeProduct(res.data);
        setProducts((prev) =>
          prev.map((p) => (String(p.id) === String(id) ? updatedEntity : p))
        );
        return updatedEntity;
      }
    } catch (err) {
      console.warn('[ProductContext] Background DB update notice:', err.message);
    }
  }, [setProducts]);

  const deleteProduct = useCallback(async (id) => {
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));

    try {
      await api.deleteAdminProductPermanent(id);
    } catch (err) {
      console.warn('[ProductContext] Background DB delete notice:', err.message);
    }
  }, [setProducts]);

  const toggleProductActive = useCallback(async (id) => {
    let nextActive = true;
    setProducts((prev) =>
      prev.map((p) => {
        if (String(p.id) === String(id)) {
          nextActive = !p.isActive;
          return { ...p, isActive: nextActive };
        }
        return p;
      })
    );

    try {
      await api.updateAdminProduct(id, { isActive: nextActive });
    } catch (err) {
      console.warn('[ProductContext] Background DB status toggle notice:', err.message);
    }
  }, [setProducts]);

  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        activeProducts,
        categories,
        setCategories,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        refreshProducts: syncWithBackend,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export default ProductContext;
