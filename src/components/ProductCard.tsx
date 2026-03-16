import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const originalPrice = product.price + 100;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click

    // Ripple effect
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsAdding(true);
    onAddToCart(product.id);
    setTimeout(() => setIsAdding(false), 500);
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
        damping: 15
      }}
      whileHover={{
        y: -12,
        scale: 1.03,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        transition: { duration: 0.3 }
      }}
      onClick={() => onProductClick(product)}
      className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-5 md:p-7 shadow-xl backdrop-blur-sm cursor-pointer"
    >
      {/* Hover gradient overlay */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(135deg, rgba(138,43,226,0.03) 0%, rgba(0,191,255,0.03) 100%)'
        }}
      />

      {/* View Details hint */}
      <motion.div
        className="absolute top-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-sm"
        initial={false}
      >
        View Details →
      </motion.div>

      <div className="relative overflow-hidden rounded-2xl shadow-md mb-5">
        {!imageLoaded && (
          <div className="skeleton h-56 md:h-72 w-full" />
        )}
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-56 md:h-72 object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
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
        className="mb-2 text-lg md:text-xl font-semibold leading-tight text-gray-800"
      >
        {product.name}
      </motion.div>

      {/* Short description preview */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.35 }}
        className="mb-3 text-xs text-gray-400 line-clamp-2 leading-relaxed"
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
        <div className="text-sm text-gray-400 line-through">₹{originalPrice.toFixed(2)}</div>
        <div className="text-2xl md:text-3xl font-bold text-green-600">₹{product.price.toFixed(2)}</div>
        <motion.span
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 + 0.5, type: 'spring', stiffness: 500 }}
          className="mt-2 inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white"
        >
          Save ₹100!
        </motion.span>
      </motion.div>

      <motion.button
        ref={btnRef}
        onClick={handleAddToCart}
        className="ripple-container w-full rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 py-3.5 md:py-4 text-sm md:text-base font-semibold text-white relative overflow-hidden"
        whileHover={{
          scale: 1.05,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}
        whileTap={{ scale: 0.95 }}
        animate={isAdding ? {
          scale: [1, 0.95, 1.08, 1],
          boxShadow: [
            '0 0 0 0 rgba(39,174,96,0)',
            '0 0 0 10px rgba(39,174,96,0.3)',
            '0 0 0 20px rgba(39,174,96,0)',
          ]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {isAdding ? '✓ Added!' : 'Add to Cart'}
      </motion.button>
    </motion.div>
  );
}
