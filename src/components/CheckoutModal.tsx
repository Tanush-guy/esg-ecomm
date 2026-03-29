import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { CartItem } from '../data/products';
import { calculateTotals } from '../data/products';

export interface OrderData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CheckoutSubmission {
  customer: OrderData;
  botField: string;
  startedAt: number;
}

interface CheckoutModalProps {
  show: boolean;
  cart: CartItem[];
  onClose: () => void;
  onSubmit: (submission: CheckoutSubmission) => void;
}

export function CheckoutModal({ show, cart, onClose, onSubmit }: CheckoutModalProps) {
  const [formData, setFormData] = useState<OrderData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [botField, setBotField] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!show) {
      return;
    }

    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setBotField('');
    setStartedAt(Date.now());
  }, [show]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateTotals(subtotal);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      customer: formData,
      botField,
      startedAt,
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const inputVariants = {
    focus: {
      scale: 1.01,
      borderColor: '#8a2be2',
      boxShadow: '0 0 0 3px rgba(138,43,226,0.1)',
    },
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="mb-6 flex items-center justify-between border-b-2 border-gray-100 pb-4">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
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
              <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website-field">Website</label>
                <input
                  id="website-field"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={botField}
                  onChange={(event) => setBotField(event.target.value)}
                />
              </div>

              {[
                { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Doe' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              ].map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="mb-5"
                >
                  <label className="mb-2 block text-sm font-semibold text-gray-700 md:text-base">{field.label}</label>
                  <motion.input
                    type={field.type}
                    name={field.name}
                    required
                    placeholder={field.placeholder}
                    value={formData[field.name as keyof OrderData]}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 md:text-base"
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
                <label className="mb-2 block text-sm font-semibold text-gray-700 md:text-base">Delivery Address</label>
                <motion.textarea
                  name="address"
                  required
                  placeholder="123 Main St, Apartment 4B..."
                  value={formData.address}
                  onChange={handleChange}
                  className="min-h-[100px] w-full resize-y rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-[inherit] transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 md:text-base"
                  variants={inputVariants}
                  whileFocus="focus"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 border-t-2 border-gray-100 pt-5"
              >
                <div className="flex justify-between py-2 font-semibold text-gray-700">
                  <span>Subtotal:</span>
                  <span>INR {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-500">
                  <span>Tax (18%):</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400 line-through">INR {totals.tax.toFixed(2)}</span>
                    <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white">FREE</span>
                  </span>
                </div>
                <div className="flex justify-between py-2 text-gray-500">
                  <span>Shipping (10%):</span>
                  <span>INR {totals.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-500">
                  <span>Handling (10%):</span>
                  <span>INR {totals.handling.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t-[3px] border-gray-800 pt-5 text-xl font-bold md:text-2xl">
                  <span>Total:</span>
                  <span>INR {totals.total.toFixed(2)}</span>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 py-4 text-base font-bold text-white md:text-lg"
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
      ) : null}
    </AnimatePresence>
  );
}
