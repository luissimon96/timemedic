import { motion } from 'framer-motion';
import { Brain, ChevronDown, Zap, TrendingUp, Shield } from 'lucide-react';

const Hero = () => {
  const stats = [
    { number: '500+', label: 'Medicamentos', icon: Shield },
    { number: '1000+', label: 'Diagnósticos', icon: TrendingUp },
    { number: '2000+', label: 'Exames', icon: Zap }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'backOut'
      }
    }
  };

  const orbVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          variants={orbVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"
        />
        <motion.div
          variants={orbVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="absolute top-40 right-20 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl animate-float"
        />
        <motion.div
          variants={orbVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1 }}
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-purple-400/25 rounded-full blur-2xl animate-pulse-slow"
        />
        <motion.div
          variants={orbVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.5 }}
          className="absolute bottom-40 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float"
        />
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* AI Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90"
        >
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium">Powered by AI</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          <span className="block">Controle Inteligente</span>
          <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
            de Medicamentos
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed"
        >
          Revolucione seu cuidado de saúde com inteligência artificial avançada. 
          Monitore medicamentos, acompanhe diagnósticos e gerencie exames com precisão e segurança.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 backdrop-blur-sm"
          >
            Começar Agora
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
          >
            Saber Mais
          </motion.button>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8"
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={statsVariants}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="group p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 group-hover:from-purple-500/30 group-hover:to-fuchsia-500/30 transition-all duration-300">
                    <IconComponent className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                  </div>
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/70 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { delay: 2, duration: 0.6 }
        }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
        >
          <ChevronDown className="w-6 h-6 text-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;