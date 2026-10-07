import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const INITIAL_USERS_KEY = 'sage_bloom_users';
const ACTIVE_USER_KEY = 'sage_bloom_active_user';

// Default demo botanical account
const DEFAULT_DEMO_USER = {
  id: 'usr_demo_01',
  name: 'Aria Montgomery',
  email: 'aria@sagebloom.com',
  phone: '+91 98765 43210',
  roles: ['ROLE_CUSTOMER'],
  memberSince: 'May 2024',
  tier: 'Bloom Botanist VIP',
  points: 340,
  address: {
    street: '42 Lotus Blossom Lane, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India'
  },
  orders: [
    {
      id: 'SB-9412',
      date: '18 Aug 2026',
      status: 'Delivered',
      items: [
        { id: 1, name: 'French Lavender Calm', price: 299, quantity: 2, img: '/soap 2.jpg' },
        { id: 2, name: 'Eucalyptus & Tea Tree Glow', price: 320, quantity: 1, img: '/soap 3.jpg' }
      ],
      total: 918,
      trackingNumber: 'BLM-98412-IN',
      shippingAddress: '42 Lotus Blossom Lane, Bengaluru, Karnataka 560038'
    },
    {
      id: 'SB-8750',
      date: '28 Jul 2026',
      status: 'Delivered',
      items: [
        { id: 5, name: 'Wild Rose & Pink Clay', price: 350, quantity: 1, img: '/soap 6.jpg' },
        { id: 7, name: 'Honey & Oat Milk Gentle Bar', price: 280, quantity: 1, img: '/soap 8.jpg' }
      ],
      total: 630,
      trackingNumber: 'BLM-87501-IN',
      shippingAddress: '42 Lotus Blossom Lane, Bengaluru, Karnataka 560038'
    }
  ]
};

export const AuthProvider = ({ children }) => {
  // Registered users fallback list
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(INITIAL_USERS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(INITIAL_USERS_KEY, JSON.stringify([DEFAULT_DEMO_USER]));
      return [DEFAULT_DEMO_USER];
    } catch {
      return [DEFAULT_DEMO_USER];
    }
  });

  // Active logged-in user
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'account'
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Sync profile from Spring Boot backend if token exists
  const syncProfileFromBackend = useCallback(async () => {
    const token = api.getToken();
    if (!token) return;

    try {
      setIsLoadingProfile(true);
      const res = await api.getProfile();
      if (res?.data) {
        const backendUser = {
          id: res.data.id,
          name: `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim() || res.data.email.split('@')[0],
          email: res.data.email,
          phone: user?.phone || '',
          roles: res.data.roles || ['ROLE_CUSTOMER'],
          profileImageUrl: res.data.profileImageUrl,
          memberSince: user?.memberSince || '2026',
          tier: res.data.roles?.includes('ROLE_ADMIN') || res.data.roles?.includes('ROLE_SUPER_ADMIN')
            ? 'Super Admin Staff'
            : 'Bloom Botanist VIP',
          points: user?.points || 250,
          address: user?.address || {
            street: '42 Lotus Blossom Lane',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India'
          },
          orders: user?.orders || []
        };
        setUser(backendUser);
      }
    } catch (err) {
      console.warn('[Auth] Backend profile sync skipped (offline or unauthenticated):', err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  // Handle OAuth 2.0 Redirect on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthRefreshToken = urlParams.get('refreshToken');

    if (oauthToken) {
      api.setSession({
        accessToken: oauthToken,
        refreshToken: oauthRefreshToken || null,
      });

      // Remove query params from address bar cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
      syncProfileFromBackend();
    } else if (api.getToken() && !user) {
      syncProfileFromBackend();
    }
  }, [syncProfileFromBackend, user]);

  // Persist users list changes
  useEffect(() => {
    try {
      localStorage.setItem(INITIAL_USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to sync users to localStorage', err);
    }
  }, [users]);

  // Persist active user session
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
      }
    } catch (err) {
      console.error('Failed to sync active user to localStorage', err);
    }
  }, [user]);

  const openAuthModal = (mode = 'login') => {
    if (user && mode !== 'account') {
      setAuthMode('account');
    } else {
      setAuthMode(mode);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Try Backend API first
    try {
      const authData = await api.login(cleanEmail, cleanPass);
      if (authData?.user) {
        const loggedUser = {
          id: authData.user.id,
          name: `${authData.user.firstName || ''} ${authData.user.lastName || ''}`.trim() || authData.user.email.split('@')[0],
          email: authData.user.email,
          phone: '',
          roles: authData.user.roles || ['ROLE_CUSTOMER'],
          memberSince: '2026',
          tier: authData.user.roles?.includes('ROLE_SUPER_ADMIN') ? 'Super Admin Staff' : 'Bloom Botanist VIP',
          points: 300,
          address: DEFAULT_DEMO_USER.address,
          orders: DEFAULT_DEMO_USER.orders,
        };
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }
    } catch (backendErr) {
      console.warn('[Auth] Live API login attempt failed, trying local fallback:', backendErr.message);
    }

    // 2. Fallback to local accounts (demo mode only)
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      setUser(existingUser);
      return { success: true, user: existingUser };
    }

    return { success: false, message: 'Invalid credentials. Please verify your email and password.' };
  };

  const signup = async ({ name, email, password, phone }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    // Split names for Spring Boot backend registration
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 1. Try Live Backend API
    try {
      const authData = await api.register({
        email: cleanEmail,
        password: cleanPass,
        firstName,
        lastName,
      });

      if (authData?.user) {
        const newUser = {
          id: authData.user.id,
          name: cleanName,
          email: cleanEmail,
          phone: phone ? phone.trim() : '',
          roles: authData.user.roles || ['ROLE_CUSTOMER'],
          memberSince: '2026',
          tier: 'Seedling Member',
          points: 100,
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India'
          },
          orders: []
        };
        setUser(newUser);
        setUsers((prev) => [...prev, newUser]);
        return { success: true, user: newUser };
      }
    } catch (backendErr) {
      console.warn('[Auth] Live API registration failed, using local registration:', backendErr.message);
    }

    // 2. Local fallback registration
    const emailExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      roles: ['ROLE_CUSTOMER'],
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      tier: 'Seedling Member',
      points: 100, // Welcome bonus points!
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      },
      orders: []
    };

    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const loginWithGoogle = () => {
    const backendOAuthUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/oauth2/authorization/google`;
    window.location.href = backendOAuthUrl;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    closeAuthModal();
  };

  const updateProfile = (updatedFields) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updatedFields
    };

    setUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    return { success: true };
  };

  const updateAddress = (addressData) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      address: {
        ...user.address,
        ...addressData
      }
    };

    setUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    return { success: true };
  };

  const addOrder = async (orderData) => {
    // 1. Try sending to backend API if items contain valid or mock product ids
    try {
      const orderPayload = {
        customerName: user?.name || 'Guest Customer',
        customerEmail: user?.email || 'guest@sagebloom.com',
        customerPhone: user?.phone || '+91 9876543210',
        shippingAddress: orderData.shippingAddress || '42 Lotus Blossom Lane',
        shippingCity: user?.address?.city || 'Bengaluru',
        shippingPostalCode: user?.address?.postalCode || '560038',
        notes: 'Handcrafted soaps artisanal pack',
        items: (orderData.items || []).map((item) => ({
          productId: typeof item.id === 'string' && item.id.includes('-') ? item.id : 'a0000000-0000-0000-0000-000000000001',
          quantity: item.quantity || 1,
        })),
      };

      const res = await api.checkout(orderPayload);
      if (res?.data) {
        const backendOrder = {
          id: res.data.orderNumber,
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: 'Processing',
          ...orderData,
          trackingNumber: `BLM-${Math.floor(10000 + Math.random() * 90000)}-IN`
        };

        if (user) {
          const earnedPoints = Math.floor((orderData.total || 0) * 0.1);
          const updatedUser = {
            ...user,
            points: (user.points || 0) + earnedPoints,
            orders: [backendOrder, ...(user.orders || [])]
          };
          setUser(updatedUser);
          setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        }

        return backendOrder;
      }
    } catch (err) {
      console.warn('[Order] Backend order submission failed, using local storage:', err.message);
    }

    // 2. Local order fallback
    const newOrder = {
      id: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Processing',
      ...orderData,
      trackingNumber: `BLM-${Math.floor(10000 + Math.random() * 90000)}-IN`
    };

    if (user) {
      const earnedPoints = Math.floor((orderData.total || 0) * 0.1);
      const updatedUser = {
        ...user,
        points: (user.points || 0) + earnedPoints,
        orders: [newOrder, ...(user.orders || [])]
      };

      setUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    }

    return newOrder;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthModalOpen,
        authMode,
        isLoadingProfile,
        setAuthMode,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateProfile,
        updateAddress,
        addOrder,
        demoUser: DEFAULT_DEMO_USER
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
