// Database of common medications organized by category
export const commonMedications = {
  // Cardiovascular
  cardiovascular: [
    'Losartana', 'Enalapril', 'Captopril', 'Atenolol', 'Propranolol', 'Metoprolol',
    'Sinvastatina', 'Atorvastatina', 'Rosuvastatina', 'Hidroclorotiazida', 'Furosemida',
    'AAS (Ácido Acetilsalicílico)', 'Clopidogrel', 'Digoxina', 'Verapamil'
  ],
  
  // Diabetes
  diabetes: [
    'Metformina', 'Glibenclamida', 'Gliclazida', 'Insulina NPH', 'Insulina Regular',
    'Insulina Lantus', 'Empagliflozina', 'Dapagliflozina', 'Liraglutida', 'Sitagliptina'
  ],
  
  // Antibiotics
  antibiotics: [
    'Amoxicilina', 'Azitromicina', 'Ciprofloxacina', 'Cefalexina', 'Doxiciclina',
    'Penicilina', 'Ampicilina', 'Clindamicina', 'Eritromicina', 'Tetraciclina'
  ],
  
  // Pain/Fever
  painFever: [
    'Paracetamol', 'Ibuprofeno', 'Dipirona', 'Diclofenaco', 'Nimesulida',
    'Naproxeno', 'Aspirina', 'Ketoprofeno', 'Meloxicam', 'Celecoxibe'
  ],
  
  // Respiratory
  respiratory: [
    'Salbutamol', 'Budesonida', 'Prednisolona', 'Loratadina', 'Desloratadina',
    'Cetirizina', 'Fexofenadina', 'Bromexina', 'Acetilcisteína', 'Dexametasona'
  ],
  
  // Gastrointestinal
  gastrointestinal: [
    'Omeprazol', 'Pantoprazol', 'Lansoprazol', 'Ranitidina', 'Domperidona',
    'Metoclopramida', 'Loperamida', 'Simeticona', 'Lactulose', 'Sulfassalazina'
  ],
  
  // Neurological/Psychiatric
  neurological: [
    'Fluoxetina', 'Sertralina', 'Paroxetina', 'Escitalopram', 'Clonazepam',
    'Alprazolam', 'Diazepam', 'Zolpidem', 'Carbamazepina', 'Fenitoína',
    'Levodopa', 'Risperidona', 'Quetiapina', 'Olanzapina'
  ],
  
  // Vitamins/Supplements
  vitamins: [
    'Vitamina D', 'Vitamina B12', 'Ácido Fólico', 'Vitamina C', 'Complexo B',
    'Ferro', 'Cálcio', 'Magnésio', 'Zinco', 'Ômega 3', 'Multivitamínico'
  ]
};

// Flatten all medications into a single array
export const allMedications = Object.values(commonMedications).flat();

// Disease to medication mapping for intelligent suggestions
export const diseaseToMedications = {
  'diabetes': commonMedications.diabetes,
  'hipertensão': commonMedications.cardiovascular.filter(med => 
    ['Losartana', 'Enalapril', 'Captopril', 'Atenolol', 'Propranolol', 'Hidroclorotiazida'].includes(med)
  ),
  'asma': ['Salbutamol', 'Budesonida', 'Prednisolona'],
  'bronquite': ['Salbutamol', 'Bromexina', 'Acetilcisteína'],
  'pneumonia': ['Amoxicilina', 'Azitromicina', 'Cefalexina'],
  'gripe': ['Paracetamol', 'Ibuprofeno', 'Vitamina C'],
  'resfriado': ['Paracetamol', 'Loratadina', 'Acetilcisteína'],
  'enxaqueca': ['Paracetamol', 'Ibuprofeno', 'Naproxeno'],
  'artrite': ['Diclofenaco', 'Nimesulida', 'Meloxicam'],
  'osteoporose': ['Cálcio', 'Vitamina D'],
  'depressão': ['Fluoxetina', 'Sertralina', 'Escitalopram'],
  'ansiedade': ['Clonazepam', 'Alprazolam', 'Escitalopram'],
  'insônia': ['Zolpidem', 'Melatonina'],
  'gastrite': ['Omeprazol', 'Pantoprazol', 'Ranitidina'],
  'úlcera': ['Omeprazol', 'Amoxicilina', 'Claritromicina'],
  'colesterol alto': ['Sinvastatina', 'Atorvastatina', 'Rosuvastatina'],
  'anemia': ['Ferro', 'Vitamina B12', 'Ácido Fólico'],
  'alergia': ['Loratadina', 'Cetirizina', 'Desloratadina'],
  'sinusite': ['Amoxicilina', 'Azitromicina', 'Loratadina']
};

// Function to get medication suggestions based on disease
export const getMedicationSuggestions = (diseaseName) => {
  const disease = diseaseName.toLowerCase();
  return diseaseToMedications[disease] || [];
};

// Function to filter medications based on input
export const filterMedications = (input, limit = 8) => {
  if (!input || input.length < 2) return [];
  
  const searchTerm = input.toLowerCase();
  const filtered = allMedications.filter(med =>
    med.toLowerCase().includes(searchTerm)
  );
  
  return filtered.slice(0, limit);
};