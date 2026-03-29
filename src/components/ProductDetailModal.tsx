import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Product } from '../data/products';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (productId: number, quantity: number) => void;
  onBuyNow: (productId: number, quantity: number) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart, onBuyNow }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(product.inventoryCount > 0 ? 1 : 0);
      setImageLoaded(false);
    }
  }, [product]);

  if (!product) {
    return null;
  }

  const maxQuantity = Math.min(product.inventoryCount, 10);
  const inStock = maxQuantity > 0;
  const originalPrice = product.price + 100;
  const totalPrice = product.price * quantity;
  const totalOriginal = originalPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity((previous) => previous + 1);
    }
  };

  const handleAddToCart = () => {
    if (!inStock) {
      return;
    }

    setIsAddingToCart(true);
    onAddToCart(product.id, quantity);
    window.setTimeout(() => {
      setIsAddingToCart(false);
      setQuantity(Math.min(1, maxQuantity) || 0);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!inStock) {
      return;
    }

    const selectedQuantity = quantity;
    setQuantity(Math.min(1, maxQuantity) || 0);
    onBuyNow(product.id, selectedQuantity);
  };

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/60 p-2 backdrop-blur-md sm:p-4 md:items-center md:p-6"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="relative my-4 w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:my-0"
          >
            <motion.button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-2xl text-gray-500 shadow-lg backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-500"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>

            <div className="flex flex-col lg:flex-row">
              <div className="relative flex-shrink-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 lg:w-3/5">
                <div className="relative overflow-hidden lg:rounded-l-3xl">
                  {!imageLoaded ? <div className="skeleton h-80 w-full sm:h-96 md:h-[500px] lg:h-[700px]" /> : null}
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    onLoad={() => setImageLoaded(true)}
                    className={`h-80 w-full object-contain p-4 transition-opacity duration-500 sm:h-96 sm:p-6 md:h-[500px] md:p-8 lg:h-[700px] ${
                      imageLoaded ? 'opacity-100' : 'absolute inset-0 opacity-0'
                    }`}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <motion.div
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute left-4 top-4 rounded-full bg-black/70 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm"
                  >
                    {product.category}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 500 }}
                    className={`absolute bottom-4 left-4 rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg ${
                      inStock ? 'bg-green-500' : 'bg-rose-600'
                    }`}
                  >
                    {inStock ? `Save INR ${(100 * quantity).toFixed(0)}` : 'Out of stock'}
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col overflow-y-auto p-6 sm:p-8 md:p-10 lg:max-h-[700px] lg:w-2/5">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-3 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl md:text-4xl"
                >
                  {product.name}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-5 text-xs font-semibold uppercase tracking-widest text-purple-600"
                >
                  {product.category}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6"
                >
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-800">About this product</h3>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base">{product.description}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 sm:p-6"
                >
                  <div className="mb-1 flex items-baseline gap-3">
                    <span className="text-sm text-gray-400 line-through">INR {originalPrice.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-green-600">-INR 100 OFF</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600 sm:text-4xl">INR {product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">per unit</span>
                  </div>
                  <div className={`mt-2 text-sm font-semibold ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {inStock ? `${product.inventoryCount} available in stock` : 'Currently unavailable'}
                  </div>
                  {quantity > 1 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 border-t border-gray-200 pt-4"
                    >
                      <div className="mb-1 flex justify-between text-sm text-gray-500">
                        <span>Original ({quantity} items):</span>
                        <span className="line-through">INR {totalOriginal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>Your Price:</span>
                        <motion.span
                          key={totalPrice}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          INR {totalPrice.toFixed(2)}
                        </motion.span>
                      </div>
                    </motion.div>
                  ) : null}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-6"
                >
                  <label className="mb-3 block text-sm font-semibold text-gray-700">
                    Quantity <span className="font-normal text-gray-400">(Max {maxQuantity || 0})</span>
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.button
                      onClick={handleDecrease}
                      disabled={quantity <= 1 || !inStock}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"
                      whileHover={quantity > 1 ? { scale: 1.1 } : {}}
                      whileTap={quantity > 1 ? { scale: 0.9 } : {}}
                    >
                      −
                    </motion.button>

                    <motion.div
                      key={quantity}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="flex h-12 w-16 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-xl font-bold text-gray-900"
                    >
                      {quantity}
                    </motion.div>

                    <motion.button
                      onClick={handleIncrease}
                      disabled={quantity >= maxQuantity || !inStock}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"
                      whileHover={quantity < maxQuantity ? { scale: 1.1 } : {}}
                      whileTap={quantity < maxQuantity ? { scale: 0.9 } : {}}
                    >
                      +
                    </motion.button>

                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {[1, 3, 5, 10]
                        .filter((value) => value <= maxQuantity)
                        .map((value) => (
                          <motion.button
                            key={value}
                            onClick={() => setQuantity(value)}
                            className={`h-10 w-10 rounded-lg text-xs font-bold transition-all ${
                              quantity === value
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {value}
                          </motion.button>
                        ))}
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                      initial={{ width: '10%' }}
                      animate={{ width: `${maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs text-gray-400">
                    {quantity} of {maxQuantity || 0} selected
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-auto flex flex-col gap-3"
                >
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`ripple-container relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white sm:py-5 sm:text-lg ${
                      inStock ? 'bg-gradient-to-r from-gray-900 to-gray-700' : 'cursor-not-allowed bg-gray-300'
                    }`}
                    whileHover={inStock ? { scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' } : {}}
                    whileTap={inStock ? { scale: 0.97 } : {}}
                    animate={
                      isAddingToCart
                        ? {
                            scale: [1, 0.96, 1.04, 1],
                            boxShadow: [
                              '0 0 0 0 rgba(39,174,96,0)',
                              '0 0 0 8px rgba(39,174,96,0.3)',
                              '0 0 0 16px rgba(39,174,96,0)',
                            ],
                          }
                        : {}
                    }
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      whileHover={inStock ? { x: '100%' } : {}}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {!inStock ? 'Out of Stock' : isAddingToCart ? `Added ${quantity} to Cart` : `Add to Cart (${quantity})`}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={handleBuyNow}
                    disabled={!inStock}
                    className={`relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white sm:py-5 sm:text-lg ${
                      inStock ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'cursor-not-allowed bg-gray-300'
                    }`}
                    whileHover={inStock ? { scale: 1.02, boxShadow: '0 10px 30px rgba(39,174,96,0.35)' } : {}}
                    whileTap={inStock ? { scale: 0.97 } : {}}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      whileHover={inStock ? { x: '100%' } : {}}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {inStock ? `Buy Now (${quantity}) - INR ${totalPrice.toFixed(2)}` : 'Unavailable'}
                    </span>
                  </motion.button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 sm:gap-6"
                >
                  <span>Secure Checkout</span>
                  <span>Fast Delivery</span>
                  <span>Easy Returns</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
