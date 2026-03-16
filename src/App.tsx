import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { products, calculateTotals } from './data/products';
import type { Product, CartItem } from './data/products';
import type { OrderData } from './components/CheckoutModal';
import { FloatingParticles } from './components/FloatingParticles';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartModal } from './components/CartModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { Confetti } from './components/Confetti';

// Initialize EmailJS
emailjs.init('S3o5okougalIk5UWV');

// Category filter component
function CategoryFilter({ categories, selected, onSelect }: {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-2 md:gap-3 justify-center mb-8 md:mb-10 px-4"
    >
      {categories.map((cat, i) => (
        <motion.button
          key={cat}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 + 0.3 }}
          onClick={() => onSelect(cat)}
          className={`rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all ${
            selected === cat
              ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg'
              : 'bg-white/70 text-gray-600 hover:bg-white hover:shadow-md backdrop-blur-sm'
          }`}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {cat}
        </motion.button>
      ))}
    </motion.div>
  );
}

// Scroll to top button
function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-xl text-white shadow-xl"
          whileHover={{ scale: 1.15, y: -3 }}
          whileTap={{ scale: 0.9 }}
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function App() {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderData | null>(null);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', show: false });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);

  // Checkout items: could be from cart or from Buy Now
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'buyNow'>('cart');

  // Ref to track checkout items for async confirm callback
  const checkoutItemsRef = useRef<CartItem[]>([]);
  const checkoutModeRef = useRef<'cart' | 'buyNow'>('cart');

  // Keep refs in sync
  useEffect(() => {
    checkoutItemsRef.current = checkoutItems;
    checkoutModeRef.current = checkoutMode;
  }, [checkoutItems, checkoutMode]);

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Cart count
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show toast
  const showToastMsg = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  }, []);

  // Add to cart (single item from product grid)
  const addToCart = useCallback((productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item =>
          item.id === productId ? { ...item, quantity: Math.min(item.quantity + 1, 10) } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    showToastMsg('✅ Added to cart!', 'success');
  }, [showToastMsg]);

  // Add to cart from product detail (with specific quantity)
  const addToCartWithQty = useCallback((productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, 10);
        return prev.map(item =>
          item.id === productId ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantity, 10) }];
    });

    showToastMsg(`✅ Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`, 'success');
  }, [showToastMsg]);

  // Buy Now: takes product directly to checkout form without adding to cart
  const handleBuyNow = useCallback((productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const buyNowItem: CartItem = { ...product, quantity };
    setCheckoutItems([buyNowItem]);
    setCheckoutMode('buyNow');
    setSelectedProduct(null); // Close detail modal

    // Open checkout form after brief delay for smooth transition
    setTimeout(() => setShowCheckout(true), 250);
  }, []);

  // Update quantity in cart
  const updateQuantity = useCallback((productId: number, newQty: number) => {
    if (newQty === 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      showToastMsg('🗑️ Item removed', 'error');
    } else {
      setCart(prev => prev.map(item =>
        item.id === productId ? { ...item, quantity: Math.min(newQty, 10) } : item
      ));
    }
  }, [showToastMsg]);

  // Remove item from cart
  const removeItem = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    showToastMsg('🗑️ Item removed', 'error');
  }, [showToastMsg]);

  // Handle product card click - open detail modal
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  // Checkout submit (form completed)
  const handleCheckoutSubmit = useCallback((data: OrderData) => {
    setPendingOrder(data);
    setShowCheckout(false);
    setTimeout(() => setShowConfirmation(true), 150);
  }, []);

  // Confirm order — sends email via EmailJS
  const handleConfirm = useCallback(async (confirmed: boolean) => {
    if (!confirmed) {
      setShowConfirmation(false);
      showToastMsg('❌ Order cancelled', 'error');
      setPendingOrder(null);
      return;
    }

    if (!pendingOrder) return;

    setSending(true);

    try {
      const items = checkoutItemsRef.current;
      const mode = checkoutModeRef.current;

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totals = calculateTotals(subtotal);

      // Build detailed items list
      const itemDetails = items.map((item, idx) =>
        `${idx + 1}. ${item.name}\n   Category: ${item.category}\n   Quantity: ${item.quantity}\n   Unit Price: ₹${item.price.toFixed(2)}\n   Item Total: ₹${(item.price * item.quantity).toFixed(2)}`
      ).join('\n\n');

      const itemsSummary = items.map(item =>
        `${item.name} (×${item.quantity}) — ₹${(item.price * item.quantity).toFixed(2)}`
      ).join(', ');

      const orderDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Build the complete order message
      const message = `
✅ NEW ORDER CONFIRMED!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         CUSTOMER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${pendingOrder.name}
Email: ${pendingOrder.email}
Phone: ${pendingOrder.phone}
Address: ${pendingOrder.address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ITEMS PURCHASED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         PRICE BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹${totals.subtotal.toFixed(2)}
Tax (18%): ₹${totals.tax.toFixed(2)} — FREE ✅
Shipping (10%): ₹${totals.shipping.toFixed(2)}
Handling (10%): ₹${totals.handling.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ₹${totals.total.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order Date: ${orderDate}
Order Type: ${mode === 'buyNow' ? 'Buy Now (Direct)' : 'Cart Checkout'}
Total Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}

Reply to customer: ${pendingOrder.email}
`;

      // Send email via EmailJS
      await emailjs.send(
        'service_87vj3ii',
        'template_r9ou3zd',
        {
          from_name: pendingOrder.name,
          to_name: 'Essential Goods Team',
          message: message,
          reply_to: pendingOrder.email,
          customer_name: pendingOrder.name,
          customer_email: pendingOrder.email,
          customer_phone: pendingOrder.phone,
          customer_address: pendingOrder.address,
          order_items: itemsSummary,
          order_total: `₹${totals.total.toFixed(2)}`,
          order_subtotal: `₹${totals.subtotal.toFixed(2)}`,
          order_shipping: `₹${totals.shipping.toFixed(2)}`,
          order_handling: `₹${totals.handling.toFixed(2)}`,
          order_tax: `₹${totals.tax.toFixed(2)} (FREE)`,
          order_date: orderDate,
          order_type: mode === 'buyNow' ? 'Buy Now' : 'Cart Checkout',
        }
      );

      setShowConfirmation(false);

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);

      showToastMsg('✅ Order confirmed & email sent!', 'success');

      // Only clear cart if checkout was from cart
      if (mode === 'cart') {
        setCart([]);
      }

      // Clear checkout items and pending order
      setCheckoutItems([]);
      setPendingOrder(null);

    } catch (error) {
      console.error('EmailJS Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showToastMsg(`❌ Failed to send order: ${errorMsg}`, 'error');
    } finally {
      setSending(false);
    }
  }, [pendingOrder, showToastMsg]);

  return (
    <div className="relative min-h-screen">
      <FloatingParticles />
      <Confetti show={showConfetti} />

      {/* Main Content */}
      <div className="relative z-[2] mx-auto max-w-6xl px-4 md:px-5 py-4 md:py-5">
        <Header cartCount={cartCount} onCartClick={() => setShowCart(true)} />

        {/* Hero */}
        <motion.section
          className="py-10 md:py-16 text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="shimmer-text text-4xl md:text-6xl font-bold mb-5"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          >
            Premium Collection
          </motion.h1>
          <motion.p
            className="text-base md:text-xl text-gray-500 max-w-xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover our curated selection of essential products with stunning presentation
          </motion.p>

          {/* Animated divider */}
          <motion.div
            className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </motion.section>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Products Grid */}
        <motion.section
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20 px-1"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onAddToCart={addToCart}
                onProductClick={handleProductClick}
              />
            ))}
          </AnimatePresence>
        </motion.section>

        {/* Products count indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-400 mb-8 -mt-12"
        >
          Showing {filteredProducts.length} of {products.length} products
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Scroll to top */}
      <ScrollToTop />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCartWithQty}
        onBuyNow={handleBuyNow}
      />

      {/* Cart Modal */}
      <CartModal
        show={showCart}
        cart={cart}
        onClose={() => setShowCart(false)}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onCheckout={() => {
          if (cart.length === 0) {
            showToastMsg('❌ Your cart is empty!', 'error');
            return;
          }
          // Set checkout items from cart
          setCheckoutItems([...cart]);
          setCheckoutMode('cart');
          setShowCart(false);
          setTimeout(() => setShowCheckout(true), 200);
        }}
      />

      {/* Checkout Modal - uses checkoutItems (from cart OR buy now) */}
      <CheckoutModal
        show={showCheckout}
        cart={checkoutItems}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Confirmation Dialog - uses checkoutItems */}
      <ConfirmationDialog
        show={showConfirmation}
        orderData={pendingOrder}
        cart={checkoutItems}
        onConfirm={handleConfirm}
        sending={sending}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
