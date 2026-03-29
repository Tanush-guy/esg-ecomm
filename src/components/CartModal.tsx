import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '../data/products';
import { calculateTotals } from '../data/products';

interface CartModalProps {
  show: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

export function CartModal({ show, cart, onClose, onUpdateQuantity, onRemove, onCheckout }: CartModalProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateTotals(subtotal);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent"
              >
                Shopping Cart
              </motion.h2>
              <motion.button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-3xl text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
                className="py-12 text-center text-gray-400"
              >
                <motion.div
                  className="text-6xl mb-5 opacity-50"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  🛒
                </motion.div>
                <p className="text-lg font-semibold">Your cart is empty</p>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {cart.map((item, i) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 100, opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                      className="mb-3 flex gap-3 md:gap-4 rounded-xl bg-gray-50 p-3 md:p-4 transition-colors hover:bg-gray-100"
                    >
                      <motion.img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0 rounded-xl object-cover shadow-md"
                        whileHover={{ scale: 1.05, rotate: 2 }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{item.name}</p>
                        <p className="text-green-600 font-bold text-base md:text-lg mt-1">₹{item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg"
                          >
                            −
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="min-w-[30px] text-center font-bold text-gray-800"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg"
                          >
                            +
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemove(item.id)}
                            className="ml-auto rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                          >
                            Remove
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 border-t-2 border-gray-100 pt-5"
                >
                  <div className="flex justify-between py-2 font-semibold text-gray-700">
                    <span>Subtotal:</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-gray-500">
                    <span>Tax (18%):</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="line-through text-gray-400">₹{totals.tax.toFixed(2)}</span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white"
                      >
                        FREE
                      </motion.span>
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-gray-500">
                    <span>Shipping (10%):</span>
                    <span>₹{totals.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-gray-500">
                    <span>Handling (10%):</span>
                    <span>₹{totals.handling.toFixed(2)}</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="mt-4 flex justify-between items-center border-t-[3px] border-gray-800 pt-5 text-xl md:text-2xl font-bold"
                  >
                    <span>Total:</span>
                    <motion.span
                      key={totals.total}
                      initial={{ scale: 1.2, color: '#8a2be2' }}
                      animate={{ scale: 1, color: '#1a1a1a' }}
                      transition={{ duration: 0.5 }}
                    >
                      ₹{totals.total.toFixed(2)}
                    </motion.span>
                  </motion.div>
                </motion.div>

                <motion.button
                  onClick={onCheckout}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-base md:text-lg font-bold text-white relative overflow-hidden"
                  whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(39,174,96,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.span
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative">Proceed to Checkout</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
