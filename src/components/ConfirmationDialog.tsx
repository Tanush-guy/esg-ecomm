import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '../data/products';
import type { OrderData } from './CheckoutModal';
import { calculateTotals } from '../data/products';

interface ConfirmationDialogProps {
  show: boolean;
  orderData: OrderData | null;
  cart: CartItem[];
  onConfirm: (confirmed: boolean) => void;
  sending?: boolean;
}

export function ConfirmationDialog({ show, orderData, cart, onConfirm, sending = false }: ConfirmationDialogProps) {
  if (!orderData) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateTotals(subtotal);
  const itemsList = cart.map(item => `${item.name} (×${item.quantity})`).join(', ');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={(e) => !sending && e.target === e.currentTarget && onConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-10 text-center shadow-2xl"
          >
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-2xl md:text-3xl font-bold text-gray-900"
            >
              📱 Order Confirmation
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-5 md:p-7 text-left mb-6 md:mb-8"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mb-4 text-center font-bold text-purple-600 text-sm md:text-base"
              >
                Essential Goods
              </motion.p>
              {[
                { label: 'Name', value: orderData.name },
                { label: 'Items', value: itemsList },
                { label: 'Email', value: orderData.email },
                { label: 'Phone', value: orderData.phone },
                { label: 'Address', value: orderData.address },
              ].map((item, i) => (
                <motion.p
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="my-2 text-sm md:text-base break-words"
                >
                  <strong className="text-gray-900">{item.label}:</strong> {item.value}
                </motion.p>
              ))}

              <motion.hr
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 }}
                className="my-5 border-t-2 border-gray-200 origin-left"
              />

              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="my-2 text-sm md:text-base"
              >
                <strong>Subtotal:</strong> ₹{totals.subtotal.toFixed(2)}
              </motion.p>

              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="my-2 text-sm md:text-base"
              >
                <strong>Tax (18%):</strong>{' '}
                <span className="line-through text-gray-400">₹{totals.tax.toFixed(2)}</span>{' '}
                <span className="font-bold text-green-600">FREE</span>
              </motion.p>

              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="my-2 text-sm md:text-base"
              >
                <strong>Shipping (10%):</strong> ₹{totals.shipping.toFixed(2)}
              </motion.p>

              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="my-2 text-sm md:text-base"
              >
                <strong>Handling (10%):</strong> ₹{totals.handling.toFixed(2)}
              </motion.p>

              <motion.hr
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.75 }}
                className="my-5 border-t-2 border-gray-200 origin-left"
              />

              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                className="text-center text-2xl md:text-3xl font-bold text-green-600 my-3"
              >
                Total: ₹{totals.total.toFixed(2)}
              </motion.p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mb-6 md:mb-8 text-lg md:text-xl font-semibold text-gray-700"
            >
              Confirm this order?
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex gap-4 md:gap-6 flex-col md:flex-row"
            >
              <motion.button
                onClick={() => onConfirm(true)}
                disabled={sending}
                className={`flex-1 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg md:text-xl font-bold text-white shadow-lg shadow-green-200 flex items-center justify-center gap-3 ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={sending ? {} : { y: -3, boxShadow: '0 12px 30px rgba(39,174,96,0.4)' }}
                whileTap={sending ? {} : { scale: 0.95 }}
              >
                {sending ? (
                  <>
                    <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  '✅ YES'
                )}
              </motion.button>
              <motion.button
                onClick={() => onConfirm(false)}
                disabled={sending}
                className={`flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-4 text-lg md:text-xl font-bold text-white shadow-lg shadow-red-200 ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={sending ? {} : { y: -3, boxShadow: '0 12px 30px rgba(231,76,60,0.4)' }}
                whileTap={sending ? {} : { scale: 0.95 }}
              >
                ❌ NO
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
