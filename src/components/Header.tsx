import { motion } from 'framer-motion';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export function Header({ cartCount, onCartClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="sticky top-3 z-50 mx-auto flex items-center justify-between rounded-2xl border border-white/20 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl md:top-5 md:px-5 md:py-4"
    >
      <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
        <motion.img
          src="https://i.postimg.cc/qRSTb55n/Logo-L.png"
          alt="Essential Goods"
          className="h-10 w-10 rounded-lg object-contain drop-shadow-md md:h-12 md:w-12"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-lg font-bold text-transparent md:text-2xl">
          Essential Goods
        </span>
      </motion.div>

      <motion.button
        onClick={onCartClick}
        className="relative rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-2.5 text-sm font-semibold text-white md:px-6 md:py-3 md:text-base"
        whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.95 }}
      >
        Cart
        {cartCount > 0 ? (
          <motion.span
            key={cartCount}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="cart-badge-glow absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
          >
            {cartCount}
          </motion.span>
        ) : null}
      </motion.button>
    </motion.header>
  );
}
