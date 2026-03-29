import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CreateOrderPayload, OrderRecord } from '../../shared/orders';
import type { Product, CartItem } from '../data/products';
import type { CheckoutSubmission } from './CheckoutModal';
import { CartModal } from './CartModal';
import { CheckoutModal } from './CheckoutModal';
import { Confetti } from './Confetti';
import { ConfirmationDialog } from './ConfirmationDialog';
import { FloatingParticles } from './FloatingParticles';
import { Footer } from './Footer';
import { Header } from './Header';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Toast } from './Toast';
import { apiUrl } from '../lib/api';

interface ProductsResponse {
  products: Product[];
}

interface CreateOrderResponse {
  duplicate: boolean;
  order: OrderRecord;
}

interface PendingOrder extends CheckoutSubmission {
  requestId: string;
}

function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8 flex flex-wrap justify-center gap-2 px-4 md:mb-10 md:gap-3"
    >
      {categories.map((cat, index) => (
        <motion.button
          key={cat}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.04 + 0.3 }}
          onClick={() => onSelect(cat)}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all md:text-sm ${
            selected === cat
              ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg'
              : 'bg-white/70 text-gray-600 backdrop-blur-sm hover:bg-white hover:shadow-md'
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

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
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
      ) : null}
    </AnimatePresence>
  );
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => null)) as { message?: string } | T | null;

  if (!response.ok) {
    throw new Error(data && typeof data === 'object' && 'message' in data && data.message ? data.message : 'Request failed.');
  }

  return data as T;
}

export function StorefrontApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', show: false });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'buyNow'>('cart');

  const checkoutItemsRef = useRef<CartItem[]>([]);
  const checkoutModeRef = useRef<'cart' | 'buyNow'>('cart');

  useEffect(() => {
    checkoutItemsRef.current = checkoutItems;
    checkoutModeRef.current = checkoutMode;
  }, [checkoutItems, checkoutMode]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);

    try {
      const response = await requestJson<ProductsResponse>(apiUrl('/api/products'));
      setProducts(response.products);
      setProductsError('');
    } catch (error) {
      setProductsError(error instanceof Error ? error.message : 'Unable to load products.');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setCart((previous) =>
      previous.flatMap((item) => {
        const current = products.find((product) => product.id === item.id && product.isActive);

        if (!current || current.inventoryCount <= 0) {
          return [];
        }

        const quantity = Math.min(item.quantity, current.inventoryCount, 10);
        return quantity > 0 ? [{ ...current, quantity }] : [];
      }),
    );

    setCheckoutItems((previous) =>
      previous.flatMap((item) => {
        const current = products.find((product) => product.id === item.id && product.isActive);

        if (!current || current.inventoryCount <= 0) {
          return [];
        }

        const quantity = Math.min(item.quantity, current.inventoryCount, 10);
        return quantity > 0 ? [{ ...current, quantity }] : [];
      }),
    );

    setSelectedProduct((previous) => {
      if (!previous) {
        return null;
      }

      const current = products.find((product) => product.id === previous.id && product.isActive);
      return current ?? null;
    });
  }, [products]);

  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category)))];
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const showToastMsg = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  }, []);

  const addToCart = useCallback(
    (productId: number) => {
      const product = products.find((entry) => entry.id === productId);

      if (!product || !product.isActive) {
        showToastMsg('This product is not available right now.', 'error');
        return;
      }

      if (product.inventoryCount <= 0) {
        showToastMsg('This product is out of stock.', 'error');
        return;
      }

      setCart((previous) => {
        const existing = previous.find((item) => item.id === productId);
        const maxQuantity = Math.min(product.inventoryCount, 10);

        if (existing) {
          const nextQuantity = Math.min(existing.quantity + 1, maxQuantity);

          if (nextQuantity === existing.quantity) {
            showToastMsg('You already reached the available stock for this item.', 'error');
            return previous;
          }

          return previous.map((item) =>
            item.id === productId ? { ...product, quantity: nextQuantity } : item,
          );
        }

        return [...previous, { ...product, quantity: 1 }];
      });

      showToastMsg('Added to cart.', 'success');
    },
    [products, showToastMsg],
  );

  const addToCartWithQty = useCallback(
    (productId: number, quantity: number) => {
      const product = products.find((entry) => entry.id === productId);

      if (!product || !product.isActive) {
        showToastMsg('This product is not available right now.', 'error');
        return;
      }

      const maxQuantity = Math.min(product.inventoryCount, 10);

      if (maxQuantity <= 0) {
        showToastMsg('This product is out of stock.', 'error');
        return;
      }

      setCart((previous) => {
        const existing = previous.find((item) => item.id === productId);

        if (existing) {
          const nextQuantity = Math.min(existing.quantity + quantity, maxQuantity);
          return previous.map((item) => (item.id === productId ? { ...product, quantity: nextQuantity } : item));
        }

        return [...previous, { ...product, quantity: Math.min(quantity, maxQuantity) }];
      });

      showToastMsg(`Added ${Math.min(quantity, maxQuantity)} item${quantity > 1 ? 's' : ''} to cart.`, 'success');
    },
    [products, showToastMsg],
  );

  const handleBuyNow = useCallback(
    (productId: number, quantity: number) => {
      const product = products.find((entry) => entry.id === productId);

      if (!product || !product.isActive) {
        showToastMsg('This product is not available right now.', 'error');
        return;
      }

      const maxQuantity = Math.min(product.inventoryCount, 10);

      if (maxQuantity <= 0) {
        showToastMsg('This product is out of stock.', 'error');
        return;
      }

      setCheckoutItems([{ ...product, quantity: Math.min(quantity, maxQuantity) }]);
      setCheckoutMode('buyNow');
      setSelectedProduct(null);
      window.setTimeout(() => setShowCheckout(true), 250);
    },
    [products, showToastMsg],
  );

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      const existing = cart.find((item) => item.id === productId);

      if (!existing) {
        return;
      }

      if (newQuantity === 0) {
        setCart((previous) => previous.filter((item) => item.id !== productId));
        showToastMsg('Item removed.', 'error');
        return;
      }

      const maxQuantity = Math.min(existing.inventoryCount, 10);
      setCart((previous) =>
        previous.map((item) => (item.id === productId ? { ...item, quantity: Math.min(newQuantity, maxQuantity) } : item)),
      );
    },
    [cart, showToastMsg],
  );

  const removeItem = useCallback(
    (productId: number) => {
      setCart((previous) => previous.filter((item) => item.id !== productId));
      showToastMsg('Item removed.', 'error');
    },
    [showToastMsg],
  );

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleCheckoutSubmit = useCallback((submission: CheckoutSubmission) => {
    setPendingOrder({
      ...submission,
      requestId: window.crypto.randomUUID(),
    });
    setShowCheckout(false);
    window.setTimeout(() => setShowConfirmation(true), 150);
  }, []);

  const handleConfirm = useCallback(
    async (confirmed: boolean) => {
      if (!confirmed) {
        setShowConfirmation(false);
        showToastMsg('Order cancelled.', 'error');
        setPendingOrder(null);
        return;
      }

      if (!pendingOrder) {
        return;
      }

      setSending(true);

      try {
        const items = checkoutItemsRef.current;
        const mode = checkoutModeRef.current;

        const response = await requestJson<CreateOrderResponse>(apiUrl('/api/orders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: pendingOrder.customer,
            items: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
            requestId: pendingOrder.requestId,
            startedAt: pendingOrder.startedAt,
            botField: pendingOrder.botField,
            source: mode,
          } satisfies CreateOrderPayload),
        });

        setShowConfirmation(false);
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 4000);

        showToastMsg(
          response.duplicate
            ? `Order ${response.order.orderNumber} was already saved.`
            : `Order ${response.order.orderNumber} saved successfully.`,
          'success',
        );

        if (mode === 'cart') {
          setCart([]);
        }

        setCheckoutItems([]);
        setPendingOrder(null);
        await loadProducts();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToastMsg(`Failed to place order: ${errorMessage}`, 'error');
      } finally {
        setSending(false);
      }
    },
    [loadProducts, pendingOrder, showToastMsg],
  );

  return (
    <div className="relative min-h-screen">
      <FloatingParticles />
      <Confetti show={showConfetti} />

      <div className="relative z-[2] mx-auto max-w-6xl px-4 py-4 md:px-5 md:py-5">
        <Header cartCount={cartCount} onCartClick={() => setShowCart(true)} />

        <motion.section
          className="px-4 py-10 text-center md:py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="shimmer-text mb-5 text-4xl font-bold md:text-6xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          >
            Premium Collection
          </motion.h1>
          <motion.p
            className="mx-auto max-w-xl text-base text-gray-500 md:text-xl"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover our curated selection of essential products with stunning presentation
          </motion.p>

          <motion.div
            className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </motion.section>

        {productsError ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {productsError}
          </div>
        ) : null}

        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

        {productsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="skeleton h-[420px] rounded-3xl" />
            ))}
          </div>
        ) : (
          <>
            <motion.section layout className="mb-20 grid grid-cols-1 gap-6 px-1 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
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

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-12 mb-8 text-center text-sm text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </motion.div>
          </>
        )}
      </div>

      <Footer />
      <ScrollToTop />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCartWithQty}
        onBuyNow={handleBuyNow}
      />

      <CartModal
        show={showCart}
        cart={cart}
        onClose={() => setShowCart(false)}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onCheckout={() => {
          if (cart.length === 0) {
            showToastMsg('Your cart is empty.', 'error');
            return;
          }

          setCheckoutItems([...cart]);
          setCheckoutMode('cart');
          setShowCart(false);
          window.setTimeout(() => setShowCheckout(true), 200);
        }}
      />

      <CheckoutModal
        show={showCheckout}
        cart={checkoutItems}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleCheckoutSubmit}
      />

      <ConfirmationDialog
        show={showConfirmation}
        orderData={pendingOrder?.customer ?? null}
        cart={checkoutItems}
        onConfirm={handleConfirm}
        sending={sending}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast((previous) => ({ ...previous, show: false }))}
      />
    </div>
  );
}
