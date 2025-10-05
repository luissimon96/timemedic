import { motion } from 'framer-motion';
import { Brain, Shield, Zap, Clock } from 'lucide-react';

const Features = () => {
  const features = [
    {
      id: 'ai-integrada',
      title: 'IA Integrada',
      description: 'Análise inteligente com integração OpenRouter AI para diagnósticos precisos e recomendações personalizadas.',
      icon: Brain,
      gradient: 'from-purple-500 to-purple-700',
      iconBg: 'from-purple-500/20 to-purple-600/20',
      glowColor: 'purple-500/50'
    },
    {
      id: 'seguro-privado',
      title: 'Seguro & Privado',
      description: 'Criptografia de ponta a ponta e proteção total dos seus dados médicos com máxima privacidade.',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'from-emerald-500/20 to-teal-600/20',
      glowColor: 'emerald-500/50'
    },
    {
      id: 'rapido-eficiente',
      title: 'Rápido & Eficiente',
      description: 'Acesso instantâneo ao seu histórico médico completo com interface otimizada e responsiva.',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'from-yellow-500/20 to-orange-500/20',
      glowColor: 'yellow-500/50'
    },
    {
      id: 'lembretes-automaticos',
      title: 'Lembretes Automáticos',
      description: 'Sistema inteligente de notificações para medicamentos, consultas e exames programados.',
      icon: Clock,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'from-blue-500/20 to-indigo-600/20',
      glowColor: 'blue-500/50'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90"
          >
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">Recursos Principais</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="block">Tecnologia Avançada</span>
            <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
              para Sua Saúde
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Descubra como nossa plataforma revoluciona o gerenciamento de saúde com recursos 
            inteligentes e interface intuitiva.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <motion.div
                key={feature.id}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative p-8 lg:p-10 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 h-full">
                  {/* Icon */}
                  <motion.div
                    variants={iconVariants}
                    whileHover="hover"
                    className="flex items-center justify-center mb-6"
                  >
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.iconBg} group-hover:shadow-lg group-hover:shadow-${feature.glowColor} transition-all duration-500`}>
                      <IconComponent className="w-8 h-8 text-white group-hover:text-white transition-colors duration-300" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 group-hover:text-white transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-white/70 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative gradient line */}
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-24`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16 lg:mt-20"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 backdrop-blur-sm"
          >
            Explorar Todos os Recursos
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;