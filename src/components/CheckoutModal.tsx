import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { CartItem } from '../data/products';
import { calculateTotals } from '../data/products';

export interface OrderData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CheckoutModalProps {
  show: boolean;
  cart: CartItem[];
  onClose: () => void;
  onSubmit: (data: OrderData) => void;
}

export function CheckoutModal({ show, cart, onClose, onSubmit }: CheckoutModalProps) {
  const [formData, setFormData] = useState<OrderData>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateTotals(subtotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputVariants = {
    focus: { scale: 1.01, borderColor: '#8a2be2', boxShadow: '0 0 0 3px rgba(138,43,226,0.1)' }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent"
              >
                Checkout
              </motion.h2>
              <motion.button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-3xl text-gray-400 hover:bg-red-50 hover:text-red-500"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            <form onSubmit={handleSubmit}>
              {[
                { label: '👤 Full Name', name: 'name', type: 'text', placeholder: 'John Doe' },
                { label: '📧 Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: '📱 Phone Number', name: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              ].map((field, i) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  className="mb-5"
                >
                  <label className="block mb-2 font-semibold text-gray-700 text-sm md:text-base">
                    {field.label}
                  </label>
                  <motion.input
                    type={field.type}
                    name={field.name}
                    required
                    placeholder={field.placeholder}
                    value={formData[field.name as keyof OrderData]}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm md:text-base transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    variants={inputVariants}
                    whileFocus="focus"
                  />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-5"
              >
                <label className="block mb-2 font-semibold text-gray-700 text-sm md:text-base">
                  📍 Delivery Address
                </label>
                <motion.textarea
                  name="address"
                  required
                  placeholder="123 Main St, Apartment 4B..."
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm md:text-base transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 min-h-[100px] resize-y font-[inherit]"
                  variants={inputVariants}
                  whileFocus="focus"
                />
              </motion.div>

              {/* Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 border-t-2 border-gray-100 pt-5"
              >
                <div className="flex justify-between py-2 font-semibold text-gray-700">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-500">
                  <span>Tax (18%):</span>
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="line-through text-gray-400">₹{totals.tax.toFixed(2)}</span>
                    <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white">FREE</span>
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
                <div className="mt-4 flex justify-between items-center border-t-[3px] border-gray-800 pt-5 text-xl md:text-2xl font-bold">
                  <span>Total:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 py-4 text-base md:text-lg font-bold text-white"
                whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Complete Purchase
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
