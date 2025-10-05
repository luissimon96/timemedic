import { motion } from 'framer-motion';

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.footer
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="relative py-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Glass morphism container */}
          <div className="inline-block p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            {/* Branding message */}
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 mb-3 font-medium"
            >
              Feito com <span className="text-red-400 animate-pulse">❤️</span> para sua saúde
            </motion.p>

            {/* Copyright notice */}
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-white/70 text-sm sm:text-base"
            >
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent font-semibold">
                MediControl
              </span>{' '}
              © 2025
            </motion.p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;