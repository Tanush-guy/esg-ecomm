import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t-4 border-purple-600 bg-gradient-to-br from-gray-900/[0.98] to-gray-800/[0.98] text-white backdrop-blur-xl">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-[20%] h-full w-1/2 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-0 right-[20%] h-full w-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <motion.img
                src="https://i.postimg.cc/qRSTb55n/Logo-L.png"
                alt="Essential Goods Logo"
                className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(138,43,226,0.5))' }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              />
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Essential Goods
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6 text-sm md:text-base">
              Essential Goods brings you a carefully curated collection of premium quality products.
              We are committed to providing exceptional value, outstanding customer service, and
              innovative solutions that enhance your daily life. Your satisfaction is our top priority.
            </p>
            <div className="flex gap-8 flex-wrap">
              {[
                { number: '10k+', label: 'Happy Customers' },
                { number: '100%', label: 'Satisfaction' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center min-w-[80px]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 + 0.3 }}
                >
                  <motion.span
                    className="block text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.4, type: 'spring', stiffness: 300 }}
                  >
                    {stat.number}
                  </motion.span>
                  <span className="text-xs uppercase tracking-wider text-gray-500 mt-1">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="relative mb-5 pb-3 text-lg md:text-xl font-bold uppercase tracking-widest text-purple-500">
              Contact Us
              <span className="absolute bottom-0 left-0 h-[3px] w-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
            </h3>
            <div className="space-y-3">
              {[
                { icon: '📧', text: 'essentialgoodstp@gmail.com' },
                { icon: '📱', text: '+91 70549 91904' },
                { icon: '🕐', text: '24/7' },
                { icon: '📍', text: 'India' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-3 rounded-lg p-2.5 text-gray-300 transition-all hover:bg-purple-500/20 hover:translate-x-1 cursor-default text-sm md:text-base"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <span className="text-lg md:text-xl min-w-[25px]">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 border-t border-purple-500/30 pt-6 text-center text-xs md:text-sm text-gray-500"
        >
          <p>© 2025 Essential Goods. All Rights Reserved.</p>
          <p className="mt-1">Quality Products • Exceptional Service • Customer First</p>
        </motion.div>
      </div>
    </footer>
  );
}
