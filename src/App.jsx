import React, { useState, useEffect } from 'react';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Header/Navbar';
import { Hero } from './components/Hero/Hero';
import { About } from './components/About/About';
import { ProductGrid } from './components/Shop/ProductGrid';
import { WhyChooseUs } from './components/WhyChooseUs/WhyChooseUs';
import { Ingredients } from './components/Ingredients/Ingredients';
import { Reviews } from './components/Reviews/Reviews';
import { GiftSets } from './components/GiftSets/GiftSets';
import { Instagram } from './components/Instagram/Instagram';
import { FAQ } from './components/FAQ/FAQ';
import { Contact } from './components/Contact/Contact';
import { Footer } from './components/Footer/Footer';
import { ProductModal } from './components/ProductModal/ProductModal';
import { CartDrawer } from './components/Cart/CartDrawer';
import { AuthModal } from './components/Auth/AuthModal';
import { Toast } from './components/Toast/Toast';
import { AdminLayout } from './admin/AdminLayout';

export function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handleOpenAdminEvent = () => setIsAdminOpen(true);
    window.addEventListener('open-admin-portal', handleOpenAdminEvent);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('open-admin-portal', handleOpenAdminEvent);
    };
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash === '#admin') {
      window.location.hash = '#home';
    }
  };

  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <div className="app-container">
            <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
            <main>
              <Hero />
              <About />
              <ProductGrid />
              <WhyChooseUs />
              <Ingredients />
              <Reviews />
              <GiftSets />
              <Instagram />
              <FAQ />
              <Contact />
            </main>
            <Footer />
            <ProductModal />
            <CartDrawer />
            <AuthModal />
            <Toast />

            {/* Admin Portal Modal / Viewport */}
            {isAdminOpen && <AdminLayout onClose={handleCloseAdmin} />}
          </div>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
