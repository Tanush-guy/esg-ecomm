import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { Product } from '../data/products';

interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart: (id: number) => void;
  onProductClick: (product: Product) => void;
}

export function ProductCard({ product, index, onAddToCart, onProductClick }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const originalPrice = product.price + 100;
  const inStock = product.inventoryCount > 0;

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!inStock) {
      return;
    }

    const button = buttonRef.current;

    if (button) {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 600);
    }

    setIsAdding(true);
    onAddToCart(product.id);
    window.setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        y: -12,
        scale: 1.03,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        transition: { duration: 0.3 },
      }}
      onClick={() => onProductClick(product)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-5 shadow-xl backdrop-blur-sm md:p-7"
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(135deg, rgba(138,43,226,0.03) 0%, rgba(0,191,255,0.03) 100%)',
        }}
      />

      <motion.div
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
        initial={false}
      >
        View Details →
      </motion.div>

      {!inStock ? (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
          Out of stock
        </div>
      ) : null}

      <div className="relative mb-5 overflow-hidden rounded-2xl shadow-md">
        {!imageLoaded ? <div className="skeleton h-56 w-full md:h-72" /> : null}
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`h-56 w-full object-cover transition-opacity duration-500 md:h-72 ${
            imageLoaded ? 'opacity-100' : 'absolute inset-0 opacity-0'
          }`}
          whileHover={{ scale: 1.12, rotate: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.2 }}
        className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-800"
      >
        {product.category}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.3 }}
        className="mb-2 text-lg font-semibold leading-tight text-gray-800 md:text-xl"
      >
        {product.name}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.35 }}
        className="line-clamp-2 mb-3 text-xs leading-relaxed text-gray-400"
      >
        {product.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.4 }}
        className="mb-4"
      >
        <div className="text-sm text-gray-400 line-through">INR {originalPrice.toFixed(2)}</div>
        <div className="text-2xl font-bold text-green-600 md:text-3xl">INR {product.price.toFixed(2)}</div>
        <div className={`mt-2 text-xs font-semibold uppercase tracking-wide ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
          {inStock ? `${product.inventoryCount} in stock` : 'Currently unavailable'}
        </div>
        <motion.span
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 + 0.5, type: 'spring', stiffness: 500 }}
          className="mt-2 inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white"
        >
          Save INR 100
        </motion.span>
      </motion.div>

      <motion.button
        ref={buttonRef}
        onClick={handleAddToCart}
        disabled={!inStock}
        className={`ripple-container relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white md:py-4 md:text-base ${
          inStock ? 'bg-gradient-to-r from-gray-900 to-gray-700' : 'cursor-not-allowed bg-gray-300'
        }`}
        whileHover={{
          scale: inStock ? 1.05 : 1,
          boxShadow: inStock ? '0 10px 30px rgba(0,0,0,0.35)' : 'none',
        }}
        whileTap={inStock ? { scale: 0.95 } : {}}
        animate={
          isAdding
            ? {
                scale: [1, 0.95, 1.08, 1],
                boxShadow: [
                  '0 0 0 0 rgba(39,174,96,0)',
                  '0 0 0 10px rgba(39,174,96,0.3)',
                  '0 0 0 20px rgba(39,174,96,0)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {inStock ? (isAdding ? 'Added!' : 'Add to Cart') : 'Unavailable'}
      </motion.button>
    </motion.div>
  );
}
