import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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

  // Reset quantity to 1 whenever product changes (new product opened or modal reopened)
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setImageLoaded(false);
    }
  }, [product]);

  if (!product) return null;

  const originalPrice = product.price + 100;
  const totalPrice = product.price * quantity;
  const totalOriginal = originalPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleIncrease = () => {
    if (quantity < 10) setQuantity(prev => prev + 1);
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    onAddToCart(product.id, quantity);
    setTimeout(() => {
      setIsAddingToCart(false);
      setQuantity(1);
    }, 600);
  };

  const handleBuyNow = () => {
    const selectedQty = quantity;
    setQuantity(1); // Reset quantity immediately
    onBuyNow(product.id, selectedQty);
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="relative w-full max-w-6xl my-4 md:my-0 rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-2xl text-gray-500 shadow-lg backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-500"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>

            {/* Content Layout */}
            <div className="flex flex-col lg:flex-row">
              {/* Image Section - Full size, no cropping */}
              <div className="relative lg:w-3/5 flex-shrink-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
                <div className="relative lg:rounded-l-3xl overflow-hidden">
                  {!imageLoaded && (
                    <div className="skeleton w-full h-80 sm:h-96 md:h-[500px] lg:h-[700px]" />
                  )}
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-80 sm:h-96 md:h-[500px] lg:h-[700px] object-contain p-4 sm:p-6 md:p-8 transition-opacity duration-500 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  {/* Category Badge */}
                  <motion.div
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute top-4 left-4 rounded-full bg-black/70 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm"
                  >
                    {product.category}
                  </motion.div>
                  {/* Savings Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 500 }}
                    className="absolute bottom-4 left-4 rounded-full bg-green-500 px-5 py-2 text-sm font-bold text-white shadow-lg"
                  >
                    Save ₹{(100 * quantity).toFixed(0)}!
                  </motion.div>
                </div>
              </div>

              {/* Details Section */}
              <div className="lg:w-2/5 p-6 sm:p-8 md:p-10 flex flex-col overflow-y-auto lg:max-h-[700px]">
                {/* Product Name */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3"
                >
                  {product.name}
                </motion.h2>

                {/* Category Label */}
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-5"
                >
                  {product.category}
                </motion.p>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6"
                >
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">About this product</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </motion.div>

                {/* Price Section */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 sm:p-6"
                >
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-sm text-gray-400 line-through">₹{originalPrice.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-green-600">-₹100 OFF</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">per unit</span>
                  </div>
                  {quantity > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Original ({quantity} items):</span>
                        <span className="line-through">₹{totalOriginal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-green-600">
                        <span>Your Price:</span>
                        <motion.span
                          key={totalPrice}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          ₹{totalPrice.toFixed(2)}
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Quantity Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-6"
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Quantity <span className="text-gray-400 font-normal">(Max 10)</span>
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.button
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
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
                      disabled={quantity >= 10}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      whileHover={quantity < 10 ? { scale: 1.1 } : {}}
                      whileTap={quantity < 10 ? { scale: 0.9 } : {}}
                    >
                      +
                    </motion.button>

                    {/* Quick select buttons */}
                    <div className="flex gap-1.5 ml-auto flex-wrap">
                      {[1, 3, 5, 10].map(num => (
                        <motion.button
                          key={num}
                          onClick={() => setQuantity(num)}
                          className={`h-10 w-10 rounded-lg text-xs font-bold transition-all ${
                            quantity === num
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {num}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Progress bar for max quantity */}
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                      initial={{ width: '10%' }}
                      animate={{ width: `${quantity * 10}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{quantity} of 10 selected</p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col gap-3 mt-auto"
                >
                  {/* Add to Cart Button */}
                  <motion.button
                    onClick={handleAddToCart}
                    className="ripple-container relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 py-4 sm:py-5 text-base sm:text-lg font-bold text-white"
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    animate={isAddingToCart ? {
                      scale: [1, 0.96, 1.04, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(39,174,96,0)',
                        '0 0 0 8px rgba(39,174,96,0.3)',
                        '0 0 0 16px rgba(39,174,96,0)',
                      ]
                    } : {}}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isAddingToCart ? (
                        <>✓ Added {quantity} to Cart!</>
                      ) : (
                        <>🛒 Add to Cart ({quantity})</>
                      )}
                    </span>
                  </motion.button>

                  {/* Buy Now Button */}
                  <motion.button
                    onClick={handleBuyNow}
                    className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 sm:py-5 text-base sm:text-lg font-bold text-white"
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(39,174,96,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      ⚡ Buy Now ({quantity}) — ₹{totalPrice.toFixed(2)}
                    </span>
                  </motion.button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400 flex-wrap"
                >
                  <span className="flex items-center gap-1.5">🔒 Secure Checkout</span>
                  <span className="flex items-center gap-1.5">🚚 Fast Delivery</span>
                  <span className="flex items-center gap-1.5">↩️ Easy Returns</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
