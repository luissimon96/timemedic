import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Brain, 
  Pill, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  X,
  Loader2,
  Stethoscope,
  Activity
} from 'lucide-react';
import { openRouterAPI } from '../utils/api.js';
import { allMedications, filterMedications, getMedicationSuggestions } from '../utils/medicationData.js';

const DiseaseManager = () => {
  // State management
  const [diseases, setDiseases] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    symptoms: '',
    medications: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', content: '', title: '' });
  const [loading, setLoading] = useState({ ai: false, suggestions: false });
  const [diseaseSuggestions, setDiseaseSuggestions] = useState([]);
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [showDiseaseSuggestions, setShowDiseaseSuggestions] = useState(false);
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Common disease names for autocompletion
  const commonDiseases = [
    'Diabetes', 'Hipertensão', 'Asma', 'Bronquite', 'Pneumonia', 'Gripe', 'Resfriado',
    'Enxaqueca', 'Artrite', 'Osteoporose', 'Depressão', 'Ansiedade', 'Insônia',
    'Gastrite', 'Úlcera', 'Colesterol Alto', 'Anemia', 'Alergia', 'Sinusite'
  ];

  // Load diseases from localStorage on component mount
  useEffect(() => {
    const savedDiseases = localStorage.getItem('medicontrol-diseases');
    if (savedDiseases) {
      setDiseases(JSON.parse(savedDiseases));
    }
  }, []);

  // Save diseases to localStorage whenever diseases change
  useEffect(() => {
    localStorage.setItem('medicontrol-diseases', JSON.stringify(diseases));
  }, [diseases]);

  // Debounced search for disease suggestions
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Filter disease suggestions based on input
  const filterDiseaseSuggestions = useCallback(
    debounce((value) => {
      if (value.length > 1) {
        const filtered = commonDiseases.filter(disease =>
          disease.toLowerCase().includes(value.toLowerCase())
        );
        setDiseaseSuggestions(filtered.slice(0, 5));
        setShowDiseaseSuggestions(true);
      } else {
        setDiseaseSuggestions([]);
        setShowDiseaseSuggestions(false);
      }
    }, 300),
    []
  );

  // Filter medication suggestions based on input
  const filterMedicationSuggestions = useCallback(
    debounce((value) => {
      if (value.length > 1) {
        const filtered = filterMedications(value, 6);
        setMedicationSuggestions(filtered);
        setShowMedicationSuggestions(true);
      } else {
        setMedicationSuggestions([]);
        setShowMedicationSuggestions(false);
      }
    }, 300),
    []
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      filterDiseaseSuggestions(value);
    } else if (name === 'medications') {
      filterMedicationSuggestions(value);
    }
  };

  // Handle disease suggestion click
  const handleDiseaseSuggestionClick = (suggestion) => {
    setFormData(prev => ({ ...prev, name: suggestion }));
    setDiseaseSuggestions([]);
    setShowDiseaseSuggestions(false);
    
    // Auto-suggest medications for this disease
    const suggestedMeds = getMedicationSuggestions(suggestion);
    if (suggestedMeds.length > 0 && !formData.medications) {
      setMedicationSuggestions(suggestedMeds);
      setShowMedicationSuggestions(true);
    }
  };

  // Handle medication suggestion click
  const handleMedicationSuggestionClick = (suggestion) => {
    const currentMeds = formData.medications;
    const newMeds = currentMeds ? `${currentMeds}, ${suggestion}` : suggestion;
    setFormData(prev => ({ ...prev, medications: newMeds }));
    setMedicationSuggestions([]);
    setShowMedicationSuggestions(false);
  };

  // Handle click outside to close suggestions
  const handleClickOutside = () => {
    setShowDiseaseSuggestions(false);
    setShowMedicationSuggestions(false);
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Add or update disease
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Nome da doença é obrigatório', 'error');
      return;
    }

    const newDisease = {
      id: editingId || Date.now(),
      name: formData.name.trim(),
      symptoms: formData.symptoms.trim(),
      medications: formData.medications.trim(),
      createdAt: editingId ? diseases.find(d => d.id === editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      setDiseases(prev => prev.map(disease => 
        disease.id === editingId ? newDisease : disease
      ));
      showToast('Doença atualizada com sucesso!');
      setEditingId(null);
    } else {
      setDiseases(prev => [...prev, newDisease]);
      showToast('Doença adicionada com sucesso!');
    }

    setFormData({ name: '', symptoms: '', medications: '' });
    setSuggestions([]);
  };

  // Edit disease
  const handleEdit = (disease) => {
    setFormData({
      name: disease.name,
      symptoms: disease.symptoms,
      medications: disease.medications
    });
    setEditingId(disease.id);
    setSuggestions([]);
  };

  // Delete disease
  const handleDelete = (id) => {
    setDiseases(prev => prev.filter(disease => disease.id !== id));
    showToast('Doença removida com sucesso!');
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({ name: '', symptoms: '', medications: '' });
    setEditingId(null);
    setSuggestions([]);
  };

  // AI Analysis
  const handleAIAnalysis = async (disease) => {
    setLoading(prev => ({ ...prev, ai: true }));
    setShowModal(true);
    setModalContent({
      type: 'analysis',
      title: `Análise IA: ${disease.name}`,
      content: 'Analisando...'
    });

    try {
      const analysis = await openRouterAPI.analyzeMedication(
        disease.medications || 'Nenhum medicamento informado',
        disease.name
      );
      
      setModalContent({
        type: 'analysis',
        title: `Análise IA: ${disease.name}`,
        content: analysis
      });
    } catch (error) {
      setModalContent({
        type: 'analysis',
        title: `Análise IA: ${disease.name}`,
        content: 'Erro ao obter análise. Tente novamente.'
      });
    } finally {
      setLoading(prev => ({ ...prev, ai: false }));
    }
  };

  // AI Medication Suggestions
  const handleMedicationSuggestions = async (disease) => {
    setLoading(prev => ({ ...prev, suggestions: true }));
    setShowModal(true);
    setModalContent({
      type: 'suggestions',
      title: `Sugestões de Medicamentos: ${disease.name}`,
      content: 'Buscando sugestões...'
    });

    try {
      const suggestions = await openRouterAPI.suggestMedications(disease.name);
      
      setModalContent({
        type: 'suggestions',
        title: `Sugestões de Medicamentos: ${disease.name}`,
        content: suggestions
      });
    } catch (error) {
      setModalContent({
        type: 'suggestions',
        title: `Sugestões de Medicamentos: ${disease.name}`,
        content: 'Erro ao obter sugestões. Tente novamente.'
      });
    } finally {
      setLoading(prev => ({ ...prev, suggestions: false }));
    }
  };

  // Filter diseases based on search term
  const filteredDiseases = diseases.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.medications.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8"
      onClick={handleClickOutside}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90">
            <Stethoscope className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">Gerenciamento de Doenças</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
              MediControl
            </span>
          </h1>
          
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Gerencie suas condições médicas com inteligência artificial integrada
          </p>
        </motion.div>

        {/* Disease Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative p-6 lg:p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Disease Name Input with Autocomplete */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nome da Doença *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="Ex: Diabetes, Hipertensão..."
                    required
                  />
                  
                  {/* Disease Autocomplete Suggestions */}
                  <AnimatePresence>
                    {showDiseaseSuggestions && diseaseSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg"
                      >
                        {diseaseSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDiseaseSuggestionClick(suggestion)}
                            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                          >
                            <Activity className="w-4 h-4 text-purple-400" />
                            {suggestion}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Symptoms Input */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Sintomas
                  </label>
                  <input
                    type="text"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="Descreva os sintomas..."
                  />
                </div>

                {/* Medications Input with Autocomplete */}
                <div className="relative">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Medicamentos Atuais
                    <span className="text-xs text-purple-300 ml-2">(separados por vírgula)</span>
                  </label>
                  <input
                    type="text"
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => {
                      if (formData.name && !formData.medications) {
                        const suggestions = getMedicationSuggestions(formData.name);
                        if (suggestions.length > 0) {
                          setMedicationSuggestions(suggestions);
                          setShowMedicationSuggestions(true);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="Ex: Metformina, Losartana, Omeprazol..."
                  />
                  
                  {/* Medication Autocomplete Suggestions */}
                  <AnimatePresence>
                    {showMedicationSuggestions && medicationSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {medicationSuggestions.map((medication, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleMedicationSuggestionClick(medication)}
                            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                          >
                            <Pill className="w-4 h-4 text-green-400" />
                            {medication}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {editingId && (
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    Cancelar
                  </motion.button>
                )}
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {editingId ? 'Atualizar Doença' : 'Adicionar Doença'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Buscar doenças..."
            />
          </div>
        </motion.div>

        {/* Diseases Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredDiseases.map((disease, index) => (
              <motion.div
                key={disease.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white truncate">
                        {disease.name}
                      </h3>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(disease)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(disease.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 mb-6">
                    {disease.symptoms && (
                      <div>
                        <p className="text-sm text-white/60 mb-1">Sintomas:</p>
                        <p className="text-white/80 text-sm">{disease.symptoms}</p>
                      </div>
                    )}
                    
                    {disease.medications && (
                      <div>
                        <p className="text-sm text-white/60 mb-1">Medicamentos:</p>
                        <p className="text-white/80 text-sm">{disease.medications}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Actions */}
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAIAnalysis(disease)}
                      disabled={loading.ai}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-fuchsia-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading.ai ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      Análise IA
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMedicationSuggestions(disease)}
                      disabled={loading.suggestions}
                      className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-gradient-to-r hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading.suggestions ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pill className="w-4 h-4" />
                      )}
                      Sugestões
                    </motion.button>
                  </div>

                  {/* Date */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/50">
                      {disease.updatedAt ? `Atualizado: ${new Date(disease.updatedAt).toLocaleDateString('pt-BR')}` : 
                       `Criado: ${new Date(disease.createdAt).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredDiseases.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <Stethoscope className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              {searchTerm ? 'Nenhuma doença encontrada' : 'Nenhuma doença cadastrada'}
            </h3>
            <p className="text-white/50">
              {searchTerm ? 'Tente ajustar os termos de busca' : 'Adicione sua primeira doença usando o formulário acima'}
            </p>
          </motion.div>
        )}
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  {modalContent.type === 'analysis' ? (
                    <Brain className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Pill className="w-5 h-5 text-emerald-400" />
                  )}
                  {modalContent.title}
                </h2>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="prose prose-invert max-w-none">
                {(loading.ai || loading.suggestions) ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                ) : (
                  <p className="text-white/80 leading-relaxed whitespace-pre-line">
                    {modalContent.content}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`px-6 py-4 rounded-lg backdrop-blur-lg border flex items-center gap-3 min-w-[300px] ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiseaseManager;