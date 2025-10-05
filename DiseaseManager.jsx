import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/DiseaseManager.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=43ff1a3f"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$(), _s5 = $RefreshSig$(), _s6 = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=43ff1a3f"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react; const useState = __vite__cjsImport3_react["useState"]; const useEffect = __vite__cjsImport3_react["useEffect"]; const useRef = __vite__cjsImport3_react["useRef"];
import { motion, AnimatePresence } from "/node_modules/.vite/deps/framer-motion.js?v=43ff1a3f";
import { Plus, Pill, Trash2, Sparkles, Calendar, Brain, Loader, Edit, Save, XCircle, Stethoscope } from "/node_modules/.vite/deps/lucide-react.js?v=43ff1a3f";
import { Button } from "/src/components/ui/button.jsx";
import { Input } from "/src/components/ui/input.jsx";
import { Textarea } from "/src/components/ui/textarea.jsx";
import { toast } from "/src/components/ui/use-toast.js";
import { getDiseases, saveDisease, deleteDisease, addMedicationToDisease, deleteMedicationFromDisease, updateMedicationInDisease, addTreatmentToDisease, deleteTreatmentFromDisease, updateTreatmentInDisease } from "/src/lib/storage.js";
import { AIAnalysisModal } from "/src/components/AIAnalysisModal.jsx";
import { AISuggestionModal } from "/src/components/AISuggestionModal.jsx";
import { useDebounce } from "/src/hooks/useDebounce.js";
const DiseaseForm = ({
  onDiseaseAdded
}) => {
  _s();
  const [diseaseName, setDiseaseName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const debouncedSearchTerm = useDebounce(diseaseName, 500);
  const formRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formRef]);
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsSuggesting(true);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "openai/gpt-3.5-turbo",
            "messages": [{
              "role": "system",
              "content": "Você é um assistente de autocompletar. Responda em português do Brasil. Dado um texto parcial, sugira 5 nomes de doenças que começam com esse texto. Formate a resposta como um array JSON de strings. Exemplo: ['Doença 1', 'Doença 2']."
            }, {
              "role": "user",
              "content": `Sugira nomes de doenças começando com: "${debouncedSearchTerm}"`
            }]
          })
        });
        if (!response.ok)
          throw new Error("Failed to fetch suggestions");
        const data = await response.json();
        const content = data.choices[0].message.content;
        setSuggestions(JSON.parse(content));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchTerm]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diseaseName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome da doença.",
        variant: "destructive"
      });
      return;
    }
    const newDisease = {
      id: Date.now().toString(),
      name: diseaseName,
      medications: [],
      treatments: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveDisease(newDisease);
    onDiseaseAdded();
    setDiseaseName("");
    setSuggestions([]);
    toast({
      title: "✅ Sucesso!",
      description: "Doença adicionada."
    });
  };
  const handleSuggestionClick = (suggestion) => {
    setDiseaseName(suggestion);
    setSuggestions([]);
  };
  return /* @__PURE__ */ jsxDEV(motion.div, { initial: {
    opacity: 0,
    y: 30
  }, whileInView: {
    opacity: 1,
    y: 0
  }, viewport: {
    once: true
  }, transition: {
    duration: 0.8
  }, className: "glass-effect p-8 md:p-12 rounded-3xl glow-effect mb-12 relative z-20", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-3xl md:text-4xl font-bold mb-3", "data-edit-disabled": "true", children: [
        "Gerenciar ",
        /* @__PURE__ */ jsxDEV("span", { className: "gradient-text", children: "Doenças" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 129,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 128,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-purple-300", "data-edit-id": "src/components/DiseaseManager.jsx:104:9", children: "Adicione uma doença para começar a monitorar" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 131,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 127,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "relative", ref: formRef, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4 items-center", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "relative flex-grow", children: [
          /* @__PURE__ */ jsxDEV(Input, { value: diseaseName, onChange: (e) => setDiseaseName(e.target.value), placeholder: "Ex: Hipertensão (digite para ver sugestões da IA)", className: "bg-white/5 border-white/20 text-white placeholder:text-purple-300" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 136,
            columnNumber: 13
          }, this),
          isSuggesting && /* @__PURE__ */ jsxDEV(Loader, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-purple-400" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 137,
            columnNumber: 30
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 135,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { type: "submit", className: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold py-3 px-6 rounded-xl", "data-edit-disabled": "true", children: [
          /* @__PURE__ */ jsxDEV(Plus, { className: "w-5 h-5 mr-2" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 140,
            columnNumber: 13
          }, this),
          "Adicionar"
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 139,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 134,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(AnimatePresence, { children: suggestions.length > 0 && /* @__PURE__ */ jsxDEV(motion.ul, { initial: {
        opacity: 0,
        y: -10
      }, animate: {
        opacity: 1,
        y: 0
      }, exit: {
        opacity: 0,
        y: -10
      }, className: "absolute top-full left-0 right-0 mt-2 bg-violet-900/80 backdrop-blur-md border border-white/20 rounded-lg z-30 overflow-hidden", children: suggestions.map((s, i) => /* @__PURE__ */ jsxDEV("li", { onClick: () => handleSuggestionClick(s), className: "px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors", children: s }, i, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 155,
        columnNumber: 42
      }, this)) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 145,
        columnNumber: 38
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 144,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 133,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 116,
    columnNumber: 10
  }, this);
};
_s(DiseaseForm, "90A9U9zHrWluqPEjHPthtwj0hww=", false, function() {
  return [useDebounce];
});
_c = DiseaseForm;
const MedicationForm = ({
  diseaseId,
  onMedicationAdded
}) => {
  _s2();
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    examResults: ""
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleAIAnalysis = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Atenção",
        description: "Informe o nome do medicamento para análise.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    setIsModalOpen(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-3.5-turbo",
          "messages": [{
            "role": "system",
            "content": "Você é um assistente farmacêutico. Responda em português do Brasil. Forneça uma lista de efeitos colaterais comuns e raros para um medicamento. Formate a resposta em JSON com duas chaves: 'comuns' e 'raros', cada uma contendo um array de strings."
          }, {
            "role": "user",
            "content": `Quais os efeitos colaterais comuns e raros do medicamento: ${formData.name}?`
          }]
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const content = data.choices[0].message.content;
      setAnalysisResult(JSON.parse(content));
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível obter a análise. Tente novamente.",
        variant: "destructive"
      });
      setAnalysisResult({
        error: "Falha ao buscar dados."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do medicamento é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    const newMedication = {
      id: Date.now().toString(),
      ...formData
    };
    addMedicationToDisease(diseaseId, newMedication);
    onMedicationAdded();
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      examResults: ""
    });
    toast({
      title: "✅ Sucesso!",
      description: "Medicamento adicionado à doença."
    });
  };
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(AIAnalysisModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), result: analysisResult, isLoading, medicationName: formData.name }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 254,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(motion.form, { onSubmit: handleSubmit, className: "space-y-4 mt-4 p-4 bg-white/5 rounded-lg", initial: {
      opacity: 0,
      height: 0
    }, animate: {
      opacity: 1,
      height: "auto"
    }, exit: {
      opacity: 0,
      height: 0
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV(Input, { value: formData.name, onChange: (e) => setFormData({
          ...formData,
          name: e.target.value
        }), placeholder: "Nome do Medicamento *", className: "bg-white/10 border-white/20" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 266,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(Input, { value: formData.dosage, onChange: (e) => setFormData({
          ...formData,
          dosage: e.target.value
        }), placeholder: "Dosagem (ex: 500mg)", className: "bg-white/10 border-white/20" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 270,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 265,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Input, { value: formData.frequency, onChange: (e) => setFormData({
        ...formData,
        frequency: e.target.value
      }), placeholder: "Frequência (ex: 1x ao dia)", className: "bg-white/10 border-white/20" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 275,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Textarea, { value: formData.examResults, onChange: (e) => setFormData({
        ...formData,
        examResults: e.target.value
      }), placeholder: "Resultados de exames (opcional)", className: "bg-white/10 border-white/20" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 279,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsxDEV(Button, { type: "submit", className: "flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-3 rounded-lg", "data-edit-disabled": "true", children: [
          /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 mr-2" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 285,
            columnNumber: 13
          }, this),
          " Adicionar Medicamento"
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 284,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { type: "button", onClick: handleAIAnalysis, variant: "outline", className: "flex-1 border-purple-400 text-purple-300 hover:bg-purple-400/10 font-semibold py-3 rounded-lg", "data-edit-disabled": "true", children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 mr-2" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 288,
            columnNumber: 13
          }, this),
          " Analisar Efeitos Colaterais"
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 287,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 283,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 255,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 253,
    columnNumber: 10
  }, this);
};
_s2(MedicationForm, "PU4lYDF8Umo1v02oIWAwEldcJAI=");
_c2 = MedicationForm;
const EditableMedication = ({
  med,
  diseaseId,
  onSave,
  onCancel
}) => {
  _s3();
  const [editedMed, setEditedMed] = useState(med);
  const handleSave = () => {
    updateMedicationInDisease(diseaseId, editedMed.id, editedMed);
    onSave();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 p-2 bg-white/5 rounded-lg", children: [
    /* @__PURE__ */ jsxDEV(Input, { value: editedMed.name, onChange: (e) => setEditedMed({
      ...editedMed,
      name: e.target.value
    }), placeholder: "Nome do Medicamento", className: "bg-white/10 border-white/20 text-sm" }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 306,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxDEV(Input, { value: editedMed.dosage, onChange: (e) => setEditedMed({
        ...editedMed,
        dosage: e.target.value
      }), placeholder: "Dosagem", className: "bg-white/10 border-white/20 text-sm" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 311,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Input, { value: editedMed.frequency, onChange: (e) => setEditedMed({
        ...editedMed,
        frequency: e.target.value
      }), placeholder: "Frequência", className: "bg-white/10 border-white/20 text-sm" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 315,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 310,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxDEV(Button, { size: "icon", variant: "ghost", onClick: onCancel, className: "h-8 w-8 text-red-400 hover:bg-red-400/10", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(XCircle, { className: "w-4 h-4" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 321,
        columnNumber: 151
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 321,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "icon", variant: "ghost", onClick: handleSave, className: "h-8 w-8 text-green-400 hover:bg-green-400/10", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Save, { className: "w-4 h-4" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 322,
        columnNumber: 157
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 322,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 320,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 305,
    columnNumber: 10
  }, this);
};
_s3(EditableMedication, "7bPH1Chm8lPEhZWcs2VvA0PqN8g=");
_c3 = EditableMedication;
const EditableTreatment = ({
  treatment,
  diseaseId,
  onSave,
  onCancel
}) => {
  _s4();
  const [editedTreatment, setEditedTreatment] = useState(treatment);
  const handleSave = () => {
    updateTreatmentInDisease(diseaseId, editedTreatment.id, editedTreatment);
    onSave();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 p-2 bg-white/5 rounded-lg", children: [
    /* @__PURE__ */ jsxDEV(Input, { value: editedTreatment.name, onChange: (e) => setEditedTreatment({
      ...editedTreatment,
      name: e.target.value
    }), placeholder: "Nome do Tratamento", className: "bg-white/10 border-white/20 text-sm" }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 338,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxDEV(Button, { size: "icon", variant: "ghost", onClick: onCancel, className: "h-8 w-8 text-red-400 hover:bg-red-400/10", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(XCircle, { className: "w-4 h-4" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 343,
        columnNumber: 151
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 343,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(Button, { size: "icon", variant: "ghost", onClick: handleSave, className: "h-8 w-8 text-green-400 hover:bg-green-400/10", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Save, { className: "w-4 h-4" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 344,
        columnNumber: 157
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 344,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 342,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 337,
    columnNumber: 10
  }, this);
};
_s4(EditableTreatment, "CO8C6m8hLOef0/wpKhDVR0D/7K4=");
_c4 = EditableTreatment;
const DiseaseCard = ({
  disease,
  onUpdate,
  onDeleteMedication,
  onDeleteTreatment
}) => {
  _s5();
  const [showMedForm, setShowMedForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [editingTreatmentId, setEditingTreatmentId] = useState(null);
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const handleSaveEdit = () => {
    setEditingMedId(null);
    setEditingTreatmentId(null);
    onUpdate();
    toast({
      title: "✅ Salvo!",
      description: "As alterações foram salvas."
    });
  };
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(AISuggestionModal, { isOpen: isSuggestionModalOpen, onClose: () => setSuggestionModalOpen(false), diseaseName: disease.name, diseaseId: disease.id, onSuggestionsAdded: () => {
      onUpdate();
      setSuggestionModalOpen(false);
    } }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 368,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV(motion.div, { layout: true, initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, exit: {
      opacity: 0,
      scale: 0.9
    }, whileHover: {
      scale: 1.02,
      y: -5
    }, className: "glass-effect p-6 rounded-2xl hover:glow-effect transition-all duration-300 flex flex-col", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center", children: /* @__PURE__ */ jsxDEV(Brain, { className: "w-6 h-6 text-white" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 388,
            columnNumber: 13
          }, this) }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 387,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "font-bold text-xl", "data-edit-disabled": "true", children: disease.name }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 391,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-purple-300", "data-edit-disabled": "true", children: [
              disease.medications.length,
              " meds, ",
              disease.treatments?.length || 0,
              " tratamentos"
            ] }, void 0, true, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 392,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 390,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 386,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { variant: "ghost", size: "icon", onClick: () => onUpdate(disease.id), className: "text-red-400 hover:text-red-300 hover:bg-red-400/10", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4 h-4" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 396,
          columnNumber: 11
        }, this) }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 395,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 385,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-grow", children: [
        /* @__PURE__ */ jsxDEV(AnimatePresence, { children: disease.medications.map((med) => /* @__PURE__ */ jsxDEV(motion.div, { layout: true, initial: {
          opacity: 0
        }, animate: {
          opacity: 1
        }, exit: {
          opacity: 0
        }, className: "border-t border-white/10 py-3", children: editingMedId === med.id ? /* @__PURE__ */ jsxDEV(EditableMedication, { med, diseaseId: disease.id, onSave: handleSaveEdit, onCancel: () => setEditingMedId(null) }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 409,
          columnNumber: 48
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start group", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 font-semibold", children: [
              /* @__PURE__ */ jsxDEV(Pill, { className: "w-4 h-4 text-fuchsia-400" }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 411,
                columnNumber: 88
              }, this),
              med.name
            ] }, void 0, true, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 411,
              columnNumber: 33
            }, this),
            med.dosage && /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-purple-300 pl-6", "data-edit-disabled": "true", children: med.dosage }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 412,
              columnNumber: 48
            }, this),
            med.frequency && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-sm text-purple-300 pl-6", children: [
              /* @__PURE__ */ jsxDEV(Calendar, { className: "w-3 h-3" }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 413,
                columnNumber: 121
              }, this),
              med.frequency
            ] }, void 0, true, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 413,
              columnNumber: 51
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 410,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex opacity-0 group-hover:opacity-100 transition-opacity", children: [
            /* @__PURE__ */ jsxDEV(Button, { variant: "ghost", size: "icon", onClick: () => setEditingMedId(med.id), className: "text-blue-400/70 hover:text-blue-300 hover:bg-blue-400/10 h-8 w-8", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Edit, { className: "w-3 h-3" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 416,
              columnNumber: 213
            }, this) }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 416,
              columnNumber: 33
            }, this),
            /* @__PURE__ */ jsxDEV(Button, { variant: "ghost", size: "icon", onClick: () => onDeleteMedication(disease.id, med.id), className: "text-red-400/70 hover:text-red-300 hover:bg-red-400/10 h-8 w-8", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3 h-3" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 417,
              columnNumber: 225
            }, this) }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 417,
              columnNumber: 33
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 415,
            columnNumber: 29
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 409,
          columnNumber: 169
        }, this) }, med.id, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 402,
          columnNumber: 47
        }, this)) }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 401,
          columnNumber: 9
        }, this),
        disease.treatments?.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxDEV("h4", { className: "font-semibold text-purple-200 mb-2", "data-edit-id": "src/components/DiseaseManager.jsx:358:17", children: "Outros Tratamentos" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 424,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(AnimatePresence, { children: disease.treatments.map((treatment) => /* @__PURE__ */ jsxDEV(motion.div, { layout: true, initial: {
            opacity: 0
          }, animate: {
            opacity: 1
          }, exit: {
            opacity: 0
          }, className: "border-t border-white/10 py-3", children: editingTreatmentId === treatment.id ? /* @__PURE__ */ jsxDEV(EditableTreatment, { treatment, diseaseId: disease.id, onSave: handleSaveEdit, onCancel: () => setEditingTreatmentId(null) }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 433,
            columnNumber: 69
          }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start group", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV(Stethoscope, { className: "w-4 h-4 text-teal-400" }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 434,
                columnNumber: 78
              }, this),
              treatment.name
            ] }, void 0, true, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 434,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsxDEV(Button, { variant: "ghost", size: "icon", onClick: () => setEditingTreatmentId(treatment.id), className: "text-blue-400/70 hover:text-blue-300 hover:bg-blue-400/10 h-8 w-8", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Edit, { className: "w-3 h-3" }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 436,
                columnNumber: 233
              }, this) }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 436,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV(Button, { variant: "ghost", size: "icon", onClick: () => onDeleteTreatment(disease.id, treatment.id), className: "text-red-400/70 hover:text-red-300 hover:bg-red-400/10 h-8 w-8", "data-edit-disabled": "true", children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3 h-3" }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 437,
                columnNumber: 238
              }, this) }, void 0, false, {
                fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
                lineNumber: 437,
                columnNumber: 41
              }, this)
            ] }, void 0, true, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
              lineNumber: 435,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 433,
            columnNumber: 207
          }, this) }, treatment.id, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 426,
            columnNumber: 60
          }, this)) }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 425,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 423,
          columnNumber: 44
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 400,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mt-auto pt-4 space-y-2", children: [
        /* @__PURE__ */ jsxDEV(Button, { onClick: () => setSuggestionModalOpen(true), variant: "outline", className: "w-full border-purple-400 text-purple-300 hover:bg-purple-400/10 font-semibold", "data-edit-disabled": "true", children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 mr-2" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
            lineNumber: 447,
            columnNumber: 13
          }, this),
          " Sugerir Tratamento com IA"
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 446,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV(Button, { onClick: () => setShowMedForm(!showMedForm), variant: "outline", className: "w-full border-dashed border-white/30 text-white/70 hover:bg-white/10", "data-edit-disabled": "true", children: showMedForm ? "Fechar Formulário" : "Adicionar Manualmente" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
          lineNumber: 449,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 445,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV(AnimatePresence, { children: showMedForm && /* @__PURE__ */ jsxDEV(MedicationForm, { diseaseId: disease.id, onMedicationAdded: () => {
        onUpdate();
        setShowMedForm(false);
      } }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 455,
        columnNumber: 25
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 454,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 372,
      columnNumber: 5
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 367,
    columnNumber: 10
  }, this);
};
_s5(DiseaseCard, "L6i8TI7PVr7evFQTiMQgj5dhagw=");
_c5 = DiseaseCard;
const DiseaseManager = () => {
  _s6();
  const [diseases, setDiseases] = useState([]);
  const loadDiseases = () => setDiseases(getDiseases());
  useEffect(() => {
    loadDiseases();
    window.addEventListener("diseasesUpdated", loadDiseases);
    return () => window.removeEventListener("diseasesUpdated", loadDiseases);
  }, []);
  const handleDeleteDisease = (id) => {
    deleteDisease(id);
    loadDiseases();
    toast({
      title: "✅ Removido",
      description: "Doença e seus registros foram removidos."
    });
  };
  const handleDeleteMedication = (diseaseId, medicationId) => {
    deleteMedicationFromDisease(diseaseId, medicationId);
    loadDiseases();
    toast({
      title: "✅ Removido",
      description: "Medicamento removido."
    });
  };
  const handleDeleteTreatment = (diseaseId, treatmentId) => {
    deleteTreatmentFromDisease(diseaseId, treatmentId);
    loadDiseases();
    toast({
      title: "✅ Removido",
      description: "Tratamento removido."
    });
  };
  return /* @__PURE__ */ jsxDEV("section", { id: "manager", className: "py-20 px-4", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxDEV(DiseaseForm, { onDiseaseAdded: loadDiseases }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 497,
      columnNumber: 9
    }, this),
    diseases.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-6 relative z-10", children: /* @__PURE__ */ jsxDEV(AnimatePresence, { children: diseases.map((d) => /* @__PURE__ */ jsxDEV(DiseaseCard, { disease: d, onUpdate: loadDiseases, onDeleteMedication: handleDeleteMedication, onDeleteTreatment: handleDeleteTreatment }, d.id, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 501,
      columnNumber: 36
    }, this)) }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 500,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 499,
      columnNumber: 32
    }, this) : /* @__PURE__ */ jsxDEV(motion.div, { initial: {
      opacity: 0
    }, animate: {
      opacity: 1
    }, className: "text-center glass-effect p-12 rounded-3xl", children: [
      /* @__PURE__ */ jsxDEV(Brain, { className: "w-16 h-16 mx-auto mb-4 text-purple-400" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 508,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-2xl font-bold mb-2", "data-edit-id": "src/components/DiseaseManager.jsx:448:13", children: "Nenhuma doença cadastrada" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 509,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-purple-300", "data-edit-id": "src/components/DiseaseManager.jsx:449:13", children: "Adicione uma doença para começar." }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
        lineNumber: 510,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
      lineNumber: 503,
      columnNumber: 20
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 496,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx",
    lineNumber: 495,
    columnNumber: 10
  }, this);
};
_s6(DiseaseManager, "pD+QrNoXCsYCVVHkHjlZIzxcoiQ=");
_c6 = DiseaseManager;
export default DiseaseManager;
var _c, _c2, _c3, _c4, _c5, _c6;
$RefreshReg$(_c, "DiseaseForm");
$RefreshReg$(_c2, "MedicationForm");
$RefreshReg$(_c3, "EditableMedication");
$RefreshReg$(_c4, "EditableTreatment");
$RefreshReg$(_c5, "DiseaseCard");
$RefreshReg$(_c6, "DiseaseManager");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports)
        return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/DiseaseManager.jsx", currentExports, nextExports);
      if (invalidateMessage)
        import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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QUE7QUFBQTtBQUFBO0FBQUEsV0FLNkMsQ0FFOUMsS0FUSDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBVUEsS0FYRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBWUEsSUFFQSx1QkFBQyxPQUFPLEtBQVAsRUFBVyxTQUFTO0FBQUEsTUFBRVcsU0FBUztBQUFBLElBQUUsR0FBRyxTQUFTO0FBQUEsTUFBRUEsU0FBUztBQUFBLElBQUUsR0FBRyxXQUFVLDZDQUN0RTtBQUFBLDZCQUFDLFNBQU0sV0FBVSw0Q0FBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQUF5RDtBQUFBLE1BQ3pELHVCQUFDLFFBQUcsV0FBVSwyQkFBeUIsNERBQUMseUNBQXhDO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBaUU7QUFBQSxNQUNqRSx1QkFBQyxPQUFFLFdBQVUsbUJBQWlCLDREQUFDLGlEQUEvQjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQWdFO0FBQUEsU0FIbEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUlBO0FBQUEsT0F0Qko7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQXdCQSxLQXpCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBMEJBO0FBRUo7QUFBQzhELElBMURLRCxnQkFBYztBQUFBWSxNQUFkWjtBQTRETixlQUFlQTtBQUFjLElBQUFyRCxJQUFBb0IsS0FBQVMsS0FBQU0sS0FBQWlCLEtBQUFhO0FBQUFDLGFBQUFsRSxJQUFBO0FBQUFrRSxhQUFBOUMsS0FBQTtBQUFBOEMsYUFBQXJDLEtBQUE7QUFBQXFDLGFBQUEvQixLQUFBO0FBQUErQixhQUFBZCxLQUFBO0FBQUFjLGFBQUFELEtBQUEiLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlRWZmZWN0IiwidXNlUmVmIiwibW90aW9uIiwiQW5pbWF0ZVByZXNlbmNlIiwiUGx1cyIsIlBpbGwiLCJUcmFzaDIiLCJTcGFya2xlcyIsIkNhbGVuZGFyIiwiQnJhaW4iLCJMb2FkZXIiLCJFZGl0IiwiU2F2ZSIsIlhDaXJjbGUiLCJTdGV0aG9zY29wZSIsIkJ1dHRvbiIsIklucHV0IiwiVGV4dGFyZWEiLCJ0b2FzdCIsImdldERpc2Vhc2VzIiwic2F2ZURpc2Vhc2UiLCJkZWxldGVEaXNlYXNlIiwiYWRkTWVkaWNhdGlvblRvRGlzZWFzZSIsImRlbGV0ZU1lZGljYXRpb25Gcm9tRGlzZWFzZSIsInVwZGF0ZU1lZGljYXRpb25JbkRpc2Vhc2UiLCJhZGRUcmVhdG1lbnRUb0Rpc2Vhc2UiLCJkZWxldGVUcmVhdG1lbnRGcm9tRGlzZWFzZSIsInVwZGF0ZVRyZWF0bWVudEluRGlzZWFzZSIsIkFJQW5hbHlzaXNNb2RhbCIsIkFJU3VnZ2VzdGlvbk1vZGFsIiwidXNlRGVib3VuY2UiLCJEaXNlYXNlRm9ybSIsIm9uRGlzZWFzZUFkZGVkIiwiX3MiLCJkaXNlYXNlTmFtZSIsInNldERpc2Vhc2VOYW1lIiwic3VnZ2VzdGlvbnMiLCJzZXRTdWdnZXN0aW9ucyIsImlzU3VnZ2VzdGluZyIsInNldElzU3VnZ2VzdGluZyIsImRlYm91bmNlZFNlYXJjaFRlcm0iLCJmb3JtUmVmIiwiaGFuZGxlQ2xpY2tPdXRzaWRlIiwiZXZlbnQiLCJjdXJyZW50IiwiY29udGFpbnMiLCJ0YXJnZXQiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZmV0Y2hTdWdnZXN0aW9ucyIsImxlbmd0aCIsInJlc3BvbnNlIiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJvayIsIkVycm9yIiwiZGF0YSIsImpzb24iLCJjb250ZW50IiwiY2hvaWNlcyIsIm1lc3NhZ2UiLCJwYXJzZSIsImVycm9yIiwiY29uc29sZSIsImhhbmRsZVN1Ym1pdCIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInRyaW0iLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidmFyaWFudCIsIm5ld0Rpc2Vhc2UiLCJpZCIsIkRhdGUiLCJub3ciLCJ0b1N0cmluZyIsIm5hbWUiLCJtZWRpY2F0aW9ucyIsInRyZWF0bWVudHMiLCJjcmVhdGVkQXQiLCJ0b0lTT1N0cmluZyIsImhhbmRsZVN1Z2dlc3Rpb25DbGljayIsInN1Z2dlc3Rpb24iLCJvcGFjaXR5IiwieSIsIm9uY2UiLCJkdXJhdGlvbiIsInZhbHVlIiwibWFwIiwicyIsImkiLCJfYyIsIk1lZGljYXRpb25Gb3JtIiwiZGlzZWFzZUlkIiwib25NZWRpY2F0aW9uQWRkZWQiLCJfczIiLCJmb3JtRGF0YSIsInNldEZvcm1EYXRhIiwiZG9zYWdlIiwiZnJlcXVlbmN5IiwiZXhhbVJlc3VsdHMiLCJpc01vZGFsT3BlbiIsInNldElzTW9kYWxPcGVuIiwiYW5hbHlzaXNSZXN1bHQiLCJzZXRBbmFseXNpc1Jlc3VsdCIsImlzTG9hZGluZyIsInNldElzTG9hZGluZyIsImhhbmRsZUFJQW5hbHlzaXMiLCJzdGF0dXMiLCJuZXdNZWRpY2F0aW9uIiwiaGVpZ2h0IiwiX2MyIiwiRWRpdGFibGVNZWRpY2F0aW9uIiwibWVkIiwib25TYXZlIiwib25DYW5jZWwiLCJfczMiLCJlZGl0ZWRNZWQiLCJzZXRFZGl0ZWRNZWQiLCJoYW5kbGVTYXZlIiwiX2MzIiwiRWRpdGFibGVUcmVhdG1lbnQiLCJ0cmVhdG1lbnQiLCJfczQiLCJlZGl0ZWRUcmVhdG1lbnQiLCJzZXRFZGl0ZWRUcmVhdG1lbnQiLCJfYzQiLCJEaXNlYXNlQ2FyZCIsImRpc2Vhc2UiLCJvblVwZGF0ZSIsIm9uRGVsZXRlTWVkaWNhdGlvbiIsIm9uRGVsZXRlVHJlYXRtZW50IiwiX3M1Iiwic2hvd01lZEZvcm0iLCJzZXRTaG93TWVkRm9ybSIsImVkaXRpbmdNZWRJZCIsInNldEVkaXRpbmdNZWRJZCIsImVkaXRpbmdUcmVhdG1lbnRJZCIsInNldEVkaXRpbmdUcmVhdG1lbnRJZCIsImlzU3VnZ2VzdGlvbk1vZGFsT3BlbiIsInNldFN1Z2dlc3Rpb25Nb2RhbE9wZW4iLCJoYW5kbGVTYXZlRWRpdCIsInNjYWxlIiwiX2M1IiwiRGlzZWFzZU1hbmFnZXIiLCJfczYiLCJkaXNlYXNlcyIsInNldERpc2Vhc2VzIiwibG9hZERpc2Vhc2VzIiwid2luZG93IiwiaGFuZGxlRGVsZXRlRGlzZWFzZSIsImhhbmRsZURlbGV0ZU1lZGljYXRpb24iLCJtZWRpY2F0aW9uSWQiLCJoYW5kbGVEZWxldGVUcmVhdG1lbnQiLCJ0cmVhdG1lbnRJZCIsImQiLCJfYzYiLCIkUmVmcmVzaFJlZyQiXSwic291cmNlcyI6WyJzcmMvY29tcG9uZW50cy9EaXNlYXNlTWFuYWdlci5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG1vdGlvbiwgQW5pbWF0ZVByZXNlbmNlIH0gZnJvbSAnZnJhbWVyLW1vdGlvbic7XG5pbXBvcnQgeyBQbHVzLCBQaWxsLCBUcmFzaDIsIFNwYXJrbGVzLCBDYWxlbmRhciwgQnJhaW4sIExvYWRlciwgRWRpdCwgU2F2ZSwgWENpcmNsZSwgU3RldGhvc2NvcGUgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL2J1dHRvbic7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJ0AvY29tcG9uZW50cy91aS9pbnB1dCc7XG5pbXBvcnQgeyBUZXh0YXJlYSB9IGZyb20gJ0AvY29tcG9uZW50cy91aS90ZXh0YXJlYSc7XG5pbXBvcnQgeyB0b2FzdCB9IGZyb20gJ0AvY29tcG9uZW50cy91aS91c2UtdG9hc3QnO1xuaW1wb3J0IHsgZ2V0RGlzZWFzZXMsIHNhdmVEaXNlYXNlLCBkZWxldGVEaXNlYXNlLCBhZGRNZWRpY2F0aW9uVG9EaXNlYXNlLCBkZWxldGVNZWRpY2F0aW9uRnJvbURpc2Vhc2UsIHVwZGF0ZU1lZGljYXRpb25JbkRpc2Vhc2UsIGFkZFRyZWF0bWVudFRvRGlzZWFzZSwgZGVsZXRlVHJlYXRtZW50RnJvbURpc2Vhc2UsIHVwZGF0ZVRyZWF0bWVudEluRGlzZWFzZSB9IGZyb20gJ0AvbGliL3N0b3JhZ2UnO1xuaW1wb3J0IHsgQUlBbmFseXNpc01vZGFsIH0gZnJvbSAnQC9jb21wb25lbnRzL0FJQW5hbHlzaXNNb2RhbCc7XG5pbXBvcnQgeyBBSVN1Z2dlc3Rpb25Nb2RhbCB9IGZyb20gJ0AvY29tcG9uZW50cy9BSVN1Z2dlc3Rpb25Nb2RhbCc7XG5pbXBvcnQgeyB1c2VEZWJvdW5jZSB9IGZyb20gJ0AvaG9va3MvdXNlRGVib3VuY2UnO1xuXG5jb25zdCBEaXNlYXNlRm9ybSA9ICh7IG9uRGlzZWFzZUFkZGVkIH0pID0+IHtcbiAgY29uc3QgW2Rpc2Vhc2VOYW1lLCBzZXREaXNlYXNlTmFtZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtzdWdnZXN0aW9ucywgc2V0U3VnZ2VzdGlvbnNdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbaXNTdWdnZXN0aW5nLCBzZXRJc1N1Z2dlc3RpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBkZWJvdW5jZWRTZWFyY2hUZXJtID0gdXNlRGVib3VuY2UoZGlzZWFzZU5hbWUsIDUwMCk7XG4gIGNvbnN0IGZvcm1SZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVDbGlja091dHNpZGUgPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChmb3JtUmVmLmN1cnJlbnQgJiYgIWZvcm1SZWYuY3VycmVudC5jb250YWlucyhldmVudC50YXJnZXQpKSB7XG4gICAgICAgIHNldFN1Z2dlc3Rpb25zKFtdKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgaGFuZGxlQ2xpY2tPdXRzaWRlKTtcbiAgICByZXR1cm4gKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBoYW5kbGVDbGlja091dHNpZGUpO1xuICB9LCBbZm9ybVJlZl0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZmV0Y2hTdWdnZXN0aW9ucyA9IGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChkZWJvdW5jZWRTZWFyY2hUZXJtLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgc2V0U3VnZ2VzdGlvbnMoW10pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXRJc1N1Z2dlc3RpbmcodHJ1ZSk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9vcGVucm91dGVyLmFpL2FwaS92MS9jaGF0L2NvbXBsZXRpb25zXCIsIHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyIHNrLW9yLXYxLWNlNjE5MGFiYjA2MjJlYTYxODA3MzA1YTJiN2U3ZDcwZmEzZThmMzJhNzZiMjM1ZjZjZDU4OGYwMzYwN2U0MzNgLFxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFwibW9kZWxcIjogXCJvcGVuYWkvZ3B0LTMuNS10dXJib1wiLFxuICAgICAgICAgICAgXCJtZXNzYWdlc1wiOiBbXG4gICAgICAgICAgICAgIHsgXCJyb2xlXCI6IFwic3lzdGVtXCIsIFwiY29udGVudFwiOiBcIlZvY8OqIMOpIHVtIGFzc2lzdGVudGUgZGUgYXV0b2NvbXBsZXRhci4gUmVzcG9uZGEgZW0gcG9ydHVndcOqcyBkbyBCcmFzaWwuIERhZG8gdW0gdGV4dG8gcGFyY2lhbCwgc3VnaXJhIDUgbm9tZXMgZGUgZG9lbsOnYXMgcXVlIGNvbWXDp2FtIGNvbSBlc3NlIHRleHRvLiBGb3JtYXRlIGEgcmVzcG9zdGEgY29tbyB1bSBhcnJheSBKU09OIGRlIHN0cmluZ3MuIEV4ZW1wbG86IFsnRG9lbsOnYSAxJywgJ0RvZW7Dp2EgMiddLlwiIH0sXG4gICAgICAgICAgICAgIHsgXCJyb2xlXCI6IFwidXNlclwiLCBcImNvbnRlbnRcIjogYFN1Z2lyYSBub21lcyBkZSBkb2Vuw6dhcyBjb21lw6dhbmRvIGNvbTogXCIke2RlYm91bmNlZFNlYXJjaFRlcm19XCJgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZmV0Y2ggc3VnZ2VzdGlvbnMnKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ7XG4gICAgICAgIHNldFN1Z2dlc3Rpb25zKEpTT04ucGFyc2UoY29udGVudCkpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIHN1Z2dlc3Rpb25zOlwiLCBlcnJvcik7XG4gICAgICAgIHNldFN1Z2dlc3Rpb25zKFtdKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHNldElzU3VnZ2VzdGluZyhmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoU3VnZ2VzdGlvbnMoKTtcbiAgfSwgW2RlYm91bmNlZFNlYXJjaFRlcm1dKTtcblxuICBjb25zdCBoYW5kbGVTdWJtaXQgPSAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoIWRpc2Vhc2VOYW1lLnRyaW0oKSkge1xuICAgICAgdG9hc3QoeyB0aXRsZTogXCJFcnJvXCIsIGRlc2NyaXB0aW9uOiBcIlBvciBmYXZvciwgaW5mb3JtZSBvIG5vbWUgZGEgZG9lbsOnYS5cIiwgdmFyaWFudDogXCJkZXN0cnVjdGl2ZVwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBuZXdEaXNlYXNlID0ge1xuICAgICAgaWQ6IERhdGUubm93KCkudG9TdHJpbmcoKSxcbiAgICAgIG5hbWU6IGRpc2Vhc2VOYW1lLFxuICAgICAgbWVkaWNhdGlvbnM6IFtdLFxuICAgICAgdHJlYXRtZW50czogW10sXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuICAgIHNhdmVEaXNlYXNlKG5ld0Rpc2Vhc2UpO1xuICAgIG9uRGlzZWFzZUFkZGVkKCk7XG4gICAgc2V0RGlzZWFzZU5hbWUoJycpO1xuICAgIHNldFN1Z2dlc3Rpb25zKFtdKTtcbiAgICB0b2FzdCh7IHRpdGxlOiBcIuKchSBTdWNlc3NvIVwiLCBkZXNjcmlwdGlvbjogXCJEb2Vuw6dhIGFkaWNpb25hZGEuXCIgfSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlU3VnZ2VzdGlvbkNsaWNrID0gKHN1Z2dlc3Rpb24pID0+IHtcbiAgICBzZXREaXNlYXNlTmFtZShzdWdnZXN0aW9uKTtcbiAgICBzZXRTdWdnZXN0aW9ucyhbXSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8bW90aW9uLmRpdlxuICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAzMCB9fVxuICAgICAgd2hpbGVJblZpZXc9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxuICAgICAgdmlld3BvcnQ9e3sgb25jZTogdHJ1ZSB9fVxuICAgICAgdHJhbnNpdGlvbj17eyBkdXJhdGlvbjogMC44IH19XG4gICAgICBjbGFzc05hbWU9XCJnbGFzcy1lZmZlY3QgcC04IG1kOnAtMTIgcm91bmRlZC0zeGwgZ2xvdy1lZmZlY3QgbWItMTIgcmVsYXRpdmUgei0yMFwiXG4gICAgPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBtYi04XCI+XG4gICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBtZDp0ZXh0LTR4bCBmb250LWJvbGQgbWItM1wiPlxuICAgICAgICAgIEdlcmVuY2lhciA8c3BhbiBjbGFzc05hbWU9XCJncmFkaWVudC10ZXh0XCI+RG9lbsOnYXM8L3NwYW4+XG4gICAgICAgIDwvaDI+XG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtcHVycGxlLTMwMFwiPkFkaWNpb25lIHVtYSBkb2Vuw6dhIHBhcmEgY29tZcOnYXIgYSBtb25pdG9yYXI8L3A+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXR9IGNsYXNzTmFtZT1cInJlbGF0aXZlXCIgcmVmPXtmb3JtUmVmfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC00IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleC1ncm93XCI+XG4gICAgICAgICAgICA8SW5wdXRcbiAgICAgICAgICAgICAgdmFsdWU9e2Rpc2Vhc2VOYW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldERpc2Vhc2VOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFeDogSGlwZXJ0ZW5zw6NvIChkaWdpdGUgcGFyYSB2ZXIgc3VnZXN0w7VlcyBkYSBJQSlcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy13aGl0ZS81IGJvcmRlci13aGl0ZS8yMCB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyOnRleHQtcHVycGxlLTMwMFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAge2lzU3VnZ2VzdGluZyAmJiA8TG9hZGVyIGNsYXNzTmFtZT1cImFic29sdXRlIHJpZ2h0LTMgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHctNCBoLTQgYW5pbWF0ZS1zcGluIHRleHQtcHVycGxlLTQwMFwiIC8+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxCdXR0b24gdHlwZT1cInN1Ym1pdFwiIGNsYXNzTmFtZT1cImJnLWdyYWRpZW50LXRvLXIgZnJvbS12aW9sZXQtNjAwIHRvLWZ1Y2hzaWEtNjAwIGhvdmVyOmZyb20tdmlvbGV0LTcwMCBob3Zlcjp0by1mdWNoc2lhLTcwMCB0ZXh0LXdoaXRlIGZvbnQtc2VtaWJvbGQgcHktMyBweC02IHJvdW5kZWQteGxcIj5cbiAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNSBoLTUgbXItMlwiIC8+XG4gICAgICAgICAgICBBZGljaW9uYXJcbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxBbmltYXRlUHJlc2VuY2U+XG4gICAgICAgICAge3N1Z2dlc3Rpb25zLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgPG1vdGlvbi51bFxuICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IC0xMCB9fVxuICAgICAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cbiAgICAgICAgICAgICAgZXhpdD17eyBvcGFjaXR5OiAwLCB5OiAtMTAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLWZ1bGwgbGVmdC0wIHJpZ2h0LTAgbXQtMiBiZy12aW9sZXQtOTAwLzgwIGJhY2tkcm9wLWJsdXItbWQgYm9yZGVyIGJvcmRlci13aGl0ZS8yMCByb3VuZGVkLWxnIHotMzAgb3ZlcmZsb3ctaGlkZGVuXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3N1Z2dlc3Rpb25zLm1hcCgocywgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxsaVxuICAgICAgICAgICAgICAgICAga2V5PXtpfVxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU3VnZ2VzdGlvbkNsaWNrKHMpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGN1cnNvci1wb2ludGVyIGhvdmVyOmJnLXdoaXRlLzEwIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7c31cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvbW90aW9uLnVsPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvQW5pbWF0ZVByZXNlbmNlPlxuICAgICAgPC9mb3JtPlxuICAgIDwvbW90aW9uLmRpdj5cbiAgKTtcbn07XG5cbmNvbnN0IE1lZGljYXRpb25Gb3JtID0gKHsgZGlzZWFzZUlkLCBvbk1lZGljYXRpb25BZGRlZCB9KSA9PiB7XG4gIGNvbnN0IFtmb3JtRGF0YSwgc2V0Rm9ybURhdGFdID0gdXNlU3RhdGUoeyBuYW1lOiAnJywgZG9zYWdlOiAnJywgZnJlcXVlbmN5OiAnJywgZXhhbVJlc3VsdHM6ICcnIH0pO1xuICBjb25zdCBbaXNNb2RhbE9wZW4sIHNldElzTW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2FuYWx5c2lzUmVzdWx0LCBzZXRBbmFseXNpc1Jlc3VsdF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2lzTG9hZGluZywgc2V0SXNMb2FkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBoYW5kbGVBSUFuYWx5c2lzID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghZm9ybURhdGEubmFtZS50cmltKCkpIHtcbiAgICAgIHRvYXN0KHsgdGl0bGU6IFwiQXRlbsOnw6NvXCIsIGRlc2NyaXB0aW9uOiBcIkluZm9ybWUgbyBub21lIGRvIG1lZGljYW1lbnRvIHBhcmEgYW7DoWxpc2UuXCIsIHZhcmlhbnQ6IFwiZGVzdHJ1Y3RpdmVcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0SXNMb2FkaW5nKHRydWUpO1xuICAgIHNldEFuYWx5c2lzUmVzdWx0KG51bGwpO1xuICAgIHNldElzTW9kYWxPcGVuKHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxL2NoYXQvY29tcGxldGlvbnNcIiwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGBCZWFyZXIgc2stb3ItdjEtY2U2MTkwYWJiMDYyMmVhNjE4MDczMDVhMmI3ZTdkNzBmYTNlOGYzMmE3NmIyMzVmNmNkNTg4ZjAzNjA3ZTQzM2AsXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFwibW9kZWxcIjogXCJvcGVuYWkvZ3B0LTMuNS10dXJib1wiLFxuICAgICAgICAgIFwibWVzc2FnZXNcIjogW1xuICAgICAgICAgICAgeyBcInJvbGVcIjogXCJzeXN0ZW1cIiwgXCJjb250ZW50XCI6IFwiVm9jw6ogw6kgdW0gYXNzaXN0ZW50ZSBmYXJtYWPDqnV0aWNvLiBSZXNwb25kYSBlbSBwb3J0dWd1w6pzIGRvIEJyYXNpbC4gRm9ybmXDp2EgdW1hIGxpc3RhIGRlIGVmZWl0b3MgY29sYXRlcmFpcyBjb211bnMgZSByYXJvcyBwYXJhIHVtIG1lZGljYW1lbnRvLiBGb3JtYXRlIGEgcmVzcG9zdGEgZW0gSlNPTiBjb20gZHVhcyBjaGF2ZXM6ICdjb211bnMnIGUgJ3Jhcm9zJywgY2FkYSB1bWEgY29udGVuZG8gdW0gYXJyYXkgZGUgc3RyaW5ncy5cIiB9LFxuICAgICAgICAgICAgeyBcInJvbGVcIjogXCJ1c2VyXCIsIFwiY29udGVudFwiOiBgUXVhaXMgb3MgZWZlaXRvcyBjb2xhdGVyYWlzIGNvbXVucyBlIHJhcm9zIGRvIG1lZGljYW1lbnRvOiAke2Zvcm1EYXRhLm5hbWV9P2AgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLmNob2ljZXNbMF0ubWVzc2FnZS5jb250ZW50O1xuICAgICAgc2V0QW5hbHlzaXNSZXN1bHQoSlNPTi5wYXJzZShjb250ZW50KSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIEFJIGFuYWx5c2lzOlwiLCBlcnJvcik7XG4gICAgICB0b2FzdCh7IHRpdGxlOiBcIkVycm8gbmEgQW7DoWxpc2VcIiwgZGVzY3JpcHRpb246IFwiTsOjbyBmb2kgcG9zc8OtdmVsIG9idGVyIGEgYW7DoWxpc2UuIFRlbnRlIG5vdmFtZW50ZS5cIiwgdmFyaWFudDogXCJkZXN0cnVjdGl2ZVwiIH0pO1xuICAgICAgc2V0QW5hbHlzaXNSZXN1bHQoeyBlcnJvcjogXCJGYWxoYSBhbyBidXNjYXIgZGFkb3MuXCIgfSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVN1Ym1pdCA9IChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghZm9ybURhdGEubmFtZS50cmltKCkpIHtcbiAgICAgIHRvYXN0KHsgdGl0bGU6IFwiRXJyb1wiLCBkZXNjcmlwdGlvbjogXCJPIG5vbWUgZG8gbWVkaWNhbWVudG8gw6kgb2JyaWdhdMOzcmlvLlwiLCB2YXJpYW50OiBcImRlc3RydWN0aXZlXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5ld01lZGljYXRpb24gPSB7IGlkOiBEYXRlLm5vdygpLnRvU3RyaW5nKCksIC4uLmZvcm1EYXRhIH07XG4gICAgYWRkTWVkaWNhdGlvblRvRGlzZWFzZShkaXNlYXNlSWQsIG5ld01lZGljYXRpb24pO1xuICAgIG9uTWVkaWNhdGlvbkFkZGVkKCk7XG4gICAgc2V0Rm9ybURhdGEoeyBuYW1lOiAnJywgZG9zYWdlOiAnJywgZnJlcXVlbmN5OiAnJywgZXhhbVJlc3VsdHM6ICcnIH0pO1xuICAgIHRvYXN0KHsgdGl0bGU6IFwi4pyFIFN1Y2Vzc28hXCIsIGRlc2NyaXB0aW9uOiBcIk1lZGljYW1lbnRvIGFkaWNpb25hZG8gw6AgZG9lbsOnYS5cIiB9KTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8QUlBbmFseXNpc01vZGFsXG4gICAgICAgIGlzT3Blbj17aXNNb2RhbE9wZW59XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldElzTW9kYWxPcGVuKGZhbHNlKX1cbiAgICAgICAgcmVzdWx0PXthbmFseXNpc1Jlc3VsdH1cbiAgICAgICAgaXNMb2FkaW5nPXtpc0xvYWRpbmd9XG4gICAgICAgIG1lZGljYXRpb25OYW1lPXtmb3JtRGF0YS5uYW1lfVxuICAgICAgLz5cbiAgICAgIDxtb3Rpb24uZm9ybVxuICAgICAgICBvblN1Ym1pdD17aGFuZGxlU3VibWl0fVxuICAgICAgICBjbGFzc05hbWU9XCJzcGFjZS15LTQgbXQtNCBwLTQgYmctd2hpdGUvNSByb3VuZGVkLWxnXCJcbiAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCBoZWlnaHQ6IDAgfX1cbiAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCBoZWlnaHQ6ICdhdXRvJyB9fVxuICAgICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIGhlaWdodDogMCB9fVxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTRcIj5cbiAgICAgICAgICA8SW5wdXQgdmFsdWU9e2Zvcm1EYXRhLm5hbWV9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgbmFtZTogZS50YXJnZXQudmFsdWUgfSl9IHBsYWNlaG9sZGVyPVwiTm9tZSBkbyBNZWRpY2FtZW50byAqXCIgY2xhc3NOYW1lPVwiYmctd2hpdGUvMTAgYm9yZGVyLXdoaXRlLzIwXCIgLz5cbiAgICAgICAgICA8SW5wdXQgdmFsdWU9e2Zvcm1EYXRhLmRvc2FnZX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBkb3NhZ2U6IGUudGFyZ2V0LnZhbHVlIH0pfSBwbGFjZWhvbGRlcj1cIkRvc2FnZW0gKGV4OiA1MDBtZylcIiBjbGFzc05hbWU9XCJiZy13aGl0ZS8xMCBib3JkZXItd2hpdGUvMjBcIiAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPElucHV0IHZhbHVlPXtmb3JtRGF0YS5mcmVxdWVuY3l9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgZnJlcXVlbmN5OiBlLnRhcmdldC52YWx1ZSB9KX0gcGxhY2Vob2xkZXI9XCJGcmVxdcOqbmNpYSAoZXg6IDF4IGFvIGRpYSlcIiBjbGFzc05hbWU9XCJiZy13aGl0ZS8xMCBib3JkZXItd2hpdGUvMjBcIiAvPlxuICAgICAgICA8VGV4dGFyZWEgdmFsdWU9e2Zvcm1EYXRhLmV4YW1SZXN1bHRzfSBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1EYXRhKHsgLi4uZm9ybURhdGEsIGV4YW1SZXN1bHRzOiBlLnRhcmdldC52YWx1ZSB9KX0gcGxhY2Vob2xkZXI9XCJSZXN1bHRhZG9zIGRlIGV4YW1lcyAob3BjaW9uYWwpXCIgY2xhc3NOYW1lPVwiYmctd2hpdGUvMTAgYm9yZGVyLXdoaXRlLzIwXCIgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IGdhcC00XCI+XG4gICAgICAgICAgPEJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiZmxleC0xIGJnLWZ1Y2hzaWEtNjAwIGhvdmVyOmJnLWZ1Y2hzaWEtNzAwIHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCBweS0zIHJvdW5kZWQtbGdcIj5cbiAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNCBoLTQgbXItMlwiIC8+IEFkaWNpb25hciBNZWRpY2FtZW50b1xuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDxCdXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9e2hhbmRsZUFJQW5hbHlzaXN9IHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwiZmxleC0xIGJvcmRlci1wdXJwbGUtNDAwIHRleHQtcHVycGxlLTMwMCBob3ZlcjpiZy1wdXJwbGUtNDAwLzEwIGZvbnQtc2VtaWJvbGQgcHktMyByb3VuZGVkLWxnXCI+XG4gICAgICAgICAgICA8U3BhcmtsZXMgY2xhc3NOYW1lPVwidy00IGgtNCBtci0yXCIgLz4gQW5hbGlzYXIgRWZlaXRvcyBDb2xhdGVyYWlzXG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9tb3Rpb24uZm9ybT5cbiAgICA8Lz5cbiAgKTtcbn07XG5cbmNvbnN0IEVkaXRhYmxlTWVkaWNhdGlvbiA9ICh7IG1lZCwgZGlzZWFzZUlkLCBvblNhdmUsIG9uQ2FuY2VsIH0pID0+IHtcbiAgICBjb25zdCBbZWRpdGVkTWVkLCBzZXRFZGl0ZWRNZWRdID0gdXNlU3RhdGUobWVkKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSAoKSA9PiB7XG4gICAgICAgIHVwZGF0ZU1lZGljYXRpb25JbkRpc2Vhc2UoZGlzZWFzZUlkLCBlZGl0ZWRNZWQuaWQsIGVkaXRlZE1lZCk7XG4gICAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMiBwLTIgYmctd2hpdGUvNSByb3VuZGVkLWxnXCI+XG4gICAgICAgICAgICA8SW5wdXQgdmFsdWU9e2VkaXRlZE1lZC5uYW1lfSBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRlZE1lZCh7Li4uZWRpdGVkTWVkLCBuYW1lOiBlLnRhcmdldC52YWx1ZX0pfSBwbGFjZWhvbGRlcj1cIk5vbWUgZG8gTWVkaWNhbWVudG9cIiBjbGFzc05hbWU9XCJiZy13aGl0ZS8xMCBib3JkZXItd2hpdGUvMjAgdGV4dC1zbVwiIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8SW5wdXQgdmFsdWU9e2VkaXRlZE1lZC5kb3NhZ2V9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdGVkTWVkKHsuLi5lZGl0ZWRNZWQsIGRvc2FnZTogZS50YXJnZXQudmFsdWV9KX0gcGxhY2Vob2xkZXI9XCJEb3NhZ2VtXCIgY2xhc3NOYW1lPVwiYmctd2hpdGUvMTAgYm9yZGVyLXdoaXRlLzIwIHRleHQtc21cIiAvPlxuICAgICAgICAgICAgICAgIDxJbnB1dCB2YWx1ZT17ZWRpdGVkTWVkLmZyZXF1ZW5jeX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0ZWRNZWQoey4uLmVkaXRlZE1lZCwgZnJlcXVlbmN5OiBlLnRhcmdldC52YWx1ZX0pfSBwbGFjZWhvbGRlcj1cIkZyZXF1w6puY2lhXCIgY2xhc3NOYW1lPVwiYmctd2hpdGUvMTAgYm9yZGVyLXdoaXRlLzIwIHRleHQtc21cIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJpY29uXCIgdmFyaWFudD1cImdob3N0XCIgb25DbGljaz17b25DYW5jZWx9IGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1yZWQtNDAwIGhvdmVyOmJnLXJlZC00MDAvMTBcIj48WENpcmNsZSBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz48L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJpY29uXCIgdmFyaWFudD1cImdob3N0XCIgb25DbGljaz17aGFuZGxlU2F2ZX0gY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWdyZWVuLTQwMCBob3ZlcjpiZy1ncmVlbi00MDAvMTBcIj48U2F2ZSBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz48L0J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufTtcblxuY29uc3QgRWRpdGFibGVUcmVhdG1lbnQgPSAoeyB0cmVhdG1lbnQsIGRpc2Vhc2VJZCwgb25TYXZlLCBvbkNhbmNlbCB9KSA9PiB7XG4gICAgY29uc3QgW2VkaXRlZFRyZWF0bWVudCwgc2V0RWRpdGVkVHJlYXRtZW50XSA9IHVzZVN0YXRlKHRyZWF0bWVudCk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gKCkgPT4ge1xuICAgICAgICB1cGRhdGVUcmVhdG1lbnRJbkRpc2Vhc2UoZGlzZWFzZUlkLCBlZGl0ZWRUcmVhdG1lbnQuaWQsIGVkaXRlZFRyZWF0bWVudCk7XG4gICAgICAgIG9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMiBwLTIgYmctd2hpdGUvNSByb3VuZGVkLWxnXCI+XG4gICAgICAgICAgICA8SW5wdXQgdmFsdWU9e2VkaXRlZFRyZWF0bWVudC5uYW1lfSBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRlZFRyZWF0bWVudCh7Li4uZWRpdGVkVHJlYXRtZW50LCBuYW1lOiBlLnRhcmdldC52YWx1ZX0pfSBwbGFjZWhvbGRlcj1cIk5vbWUgZG8gVHJhdGFtZW50b1wiIGNsYXNzTmFtZT1cImJnLXdoaXRlLzEwIGJvcmRlci13aGl0ZS8yMCB0ZXh0LXNtXCIgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWVuZCBnYXAtMlwiPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cImljb25cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXtvbkNhbmNlbH0gY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LXJlZC00MDAgaG92ZXI6YmctcmVkLTQwMC8xMFwiPjxYQ2lyY2xlIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPjwvQnV0dG9uPlxuICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cImljb25cIiB2YXJpYW50PVwiZ2hvc3RcIiBvbkNsaWNrPXtoYW5kbGVTYXZlfSBjbGFzc05hbWU9XCJoLTggdy04IHRleHQtZ3JlZW4tNDAwIGhvdmVyOmJnLWdyZWVuLTQwMC8xMFwiPjxTYXZlIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPjwvQnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59O1xuXG5jb25zdCBEaXNlYXNlQ2FyZCA9ICh7IGRpc2Vhc2UsIG9uVXBkYXRlLCBvbkRlbGV0ZU1lZGljYXRpb24sIG9uRGVsZXRlVHJlYXRtZW50IH0pID0+IHtcbiAgY29uc3QgW3Nob3dNZWRGb3JtLCBzZXRTaG93TWVkRm9ybV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtlZGl0aW5nTWVkSWQsIHNldEVkaXRpbmdNZWRJZF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2VkaXRpbmdUcmVhdG1lbnRJZCwgc2V0RWRpdGluZ1RyZWF0bWVudElkXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbaXNTdWdnZXN0aW9uTW9kYWxPcGVuLCBzZXRTdWdnZXN0aW9uTW9kYWxPcGVuXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBoYW5kbGVTYXZlRWRpdCA9ICgpID0+IHtcbiAgICBzZXRFZGl0aW5nTWVkSWQobnVsbCk7XG4gICAgc2V0RWRpdGluZ1RyZWF0bWVudElkKG51bGwpO1xuICAgIG9uVXBkYXRlKCk7XG4gICAgdG9hc3QoeyB0aXRsZTogXCLinIUgU2Fsdm8hXCIsIGRlc2NyaXB0aW9uOiBcIkFzIGFsdGVyYcOnw7VlcyBmb3JhbSBzYWx2YXMuXCIgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgIDxBSVN1Z2dlc3Rpb25Nb2RhbCBcbiAgICAgICAgaXNPcGVuPXtpc1N1Z2dlc3Rpb25Nb2RhbE9wZW59XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFN1Z2dlc3Rpb25Nb2RhbE9wZW4oZmFsc2UpfVxuICAgICAgICBkaXNlYXNlTmFtZT17ZGlzZWFzZS5uYW1lfVxuICAgICAgICBkaXNlYXNlSWQ9e2Rpc2Vhc2UuaWR9XG4gICAgICAgIG9uU3VnZ2VzdGlvbnNBZGRlZD17KCkgPT4ge1xuICAgICAgICAgICAgb25VcGRhdGUoKTtcbiAgICAgICAgICAgIHNldFN1Z2dlc3Rpb25Nb2RhbE9wZW4oZmFsc2UpO1xuICAgICAgICB9fVxuICAgIC8+XG4gICAgPG1vdGlvbi5kaXZcbiAgICAgIGxheW91dFxuICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fVxuICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XG4gICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIHNjYWxlOiAwLjkgfX1cbiAgICAgIHdoaWxlSG92ZXI9e3sgc2NhbGU6IDEuMDIsIHk6IC01IH19XG4gICAgICBjbGFzc05hbWU9XCJnbGFzcy1lZmZlY3QgcC02IHJvdW5kZWQtMnhsIGhvdmVyOmdsb3ctZWZmZWN0IHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBmbGV4IGZsZXgtY29sXCJcbiAgICA+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIG1iLTRcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xMiBoLTEyIHJvdW5kZWQteGwgYmctZ3JhZGllbnQtdG8tYnIgZnJvbS12aW9sZXQtNTAwIHRvLXB1cnBsZS01MDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxCcmFpbiBjbGFzc05hbWU9XCJ3LTYgaC02IHRleHQtd2hpdGVcIiAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQteGxcIj57ZGlzZWFzZS5uYW1lfTwvaDM+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtcHVycGxlLTMwMFwiPntkaXNlYXNlLm1lZGljYXRpb25zLmxlbmd0aH0gbWVkcywge2Rpc2Vhc2UudHJlYXRtZW50cz8ubGVuZ3RoIHx8IDB9IHRyYXRhbWVudG9zPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIG9uQ2xpY2s9eygpID0+IG9uVXBkYXRlKGRpc2Vhc2UuaWQpfSBjbGFzc05hbWU9XCJ0ZXh0LXJlZC00MDAgaG92ZXI6dGV4dC1yZWQtMzAwIGhvdmVyOmJnLXJlZC00MDAvMTBcIj5cbiAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICA8L0J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtZ3Jvd1wiPlxuICAgICAgICA8QW5pbWF0ZVByZXNlbmNlPlxuICAgICAgICAgICAge2Rpc2Vhc2UubWVkaWNhdGlvbnMubWFwKG1lZCA9PiAoXG4gICAgICAgICAgICAgICAgPG1vdGlvbi5kaXYga2V5PXttZWQuaWR9IGxheW91dCBpbml0aWFsPXt7IG9wYWNpdHk6IDAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19IGV4aXQ9e3sgb3BhY2l0eTogMCB9fSBjbGFzc05hbWU9XCJib3JkZXItdCBib3JkZXItd2hpdGUvMTAgcHktM1wiPlxuICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ01lZElkID09PSBtZWQuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8RWRpdGFibGVNZWRpY2F0aW9uIG1lZD17bWVkfSBkaXNlYXNlSWQ9e2Rpc2Vhc2UuaWR9IG9uU2F2ZT17aGFuZGxlU2F2ZUVkaXR9IG9uQ2FuY2VsPXsoKSA9PiBzZXRFZGl0aW5nTWVkSWQobnVsbCl9IC8+XG4gICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLXN0YXJ0IGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBmb250LXNlbWlib2xkXCI+PFBpbGwgY2xhc3NOYW1lPVwidy00IGgtNCB0ZXh0LWZ1Y2hzaWEtNDAwXCIgLz57bWVkLm5hbWV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttZWQuZG9zYWdlICYmIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1wdXJwbGUtMzAwIHBsLTZcIj57bWVkLmRvc2FnZX08L3A+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bWVkLmZyZXF1ZW5jeSAmJiA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQtc20gdGV4dC1wdXJwbGUtMzAwIHBsLTZcIj48Q2FsZW5kYXIgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+e21lZC5mcmVxdWVuY3l9PC9kaXY+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBvcGFjaXR5LTAgZ3JvdXAtaG92ZXI6b3BhY2l0eS0xMDAgdHJhbnNpdGlvbi1vcGFjaXR5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImdob3N0XCIgc2l6ZT1cImljb25cIiBvbkNsaWNrPXsoKSA9PiBzZXRFZGl0aW5nTWVkSWQobWVkLmlkKX0gY2xhc3NOYW1lPVwidGV4dC1ibHVlLTQwMC83MCBob3Zlcjp0ZXh0LWJsdWUtMzAwIGhvdmVyOmJnLWJsdWUtNDAwLzEwIGgtOCB3LThcIj48RWRpdCBjbGFzc05hbWU9XCJ3LTMgaC0zXCIgLz48L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIG9uQ2xpY2s9eygpID0+IG9uRGVsZXRlTWVkaWNhdGlvbihkaXNlYXNlLmlkLCBtZWQuaWQpfSBjbGFzc05hbWU9XCJ0ZXh0LXJlZC00MDAvNzAgaG92ZXI6dGV4dC1yZWQtMzAwIGhvdmVyOmJnLXJlZC00MDAvMTAgaC04IHctOFwiPjxUcmFzaDIgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+PC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgPC9BbmltYXRlUHJlc2VuY2U+XG5cbiAgICAgICAge2Rpc2Vhc2UudHJlYXRtZW50cz8ubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTRcIj5cbiAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LXB1cnBsZS0yMDAgbWItMlwiPk91dHJvcyBUcmF0YW1lbnRvczwvaDQ+XG4gICAgICAgICAgICAgICAgPEFuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICAgICAgICAgICAge2Rpc2Vhc2UudHJlYXRtZW50cy5tYXAodHJlYXRtZW50ID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2IGtleT17dHJlYXRtZW50LmlkfSBsYXlvdXQgaW5pdGlhbD17eyBvcGFjaXR5OiAwIH19IGFuaW1hdGU9e3sgb3BhY2l0eTogMSB9fSBleGl0PXt7IG9wYWNpdHk6IDAgfX0gY2xhc3NOYW1lPVwiYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzEwIHB5LTNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRpbmdUcmVhdG1lbnRJZCA9PT0gdHJlYXRtZW50LmlkID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdGFibGVUcmVhdG1lbnQgdHJlYXRtZW50PXt0cmVhdG1lbnR9IGRpc2Vhc2VJZD17ZGlzZWFzZS5pZH0gb25TYXZlPXtoYW5kbGVTYXZlRWRpdH0gb25DYW5jZWw9eygpID0+IHNldEVkaXRpbmdUcmVhdG1lbnRJZChudWxsKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLXN0YXJ0IGdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+PFN0ZXRob3Njb3BlIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC10ZWFsLTQwMFwiIC8+e3RyZWF0bWVudC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IG9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCB0cmFuc2l0aW9uLW9wYWNpdHlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJnaG9zdFwiIHNpemU9XCJpY29uXCIgb25DbGljaz17KCkgPT4gc2V0RWRpdGluZ1RyZWF0bWVudElkKHRyZWF0bWVudC5pZCl9IGNsYXNzTmFtZT1cInRleHQtYmx1ZS00MDAvNzAgaG92ZXI6dGV4dC1ibHVlLTMwMCBob3ZlcjpiZy1ibHVlLTQwMC8xMCBoLTggdy04XCI+PEVkaXQgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+PC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwiZ2hvc3RcIiBzaXplPVwiaWNvblwiIG9uQ2xpY2s9eygpID0+IG9uRGVsZXRlVHJlYXRtZW50KGRpc2Vhc2UuaWQsIHRyZWF0bWVudC5pZCl9IGNsYXNzTmFtZT1cInRleHQtcmVkLTQwMC83MCBob3Zlcjp0ZXh0LXJlZC0zMDAgaG92ZXI6YmctcmVkLTQwMC8xMCBoLTggdy04XCI+PFRyYXNoMiBjbGFzc05hbWU9XCJ3LTMgaC0zXCIgLz48L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L0FuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtYXV0byBwdC00IHNwYWNlLXktMlwiPlxuICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFN1Z2dlc3Rpb25Nb2RhbE9wZW4odHJ1ZSl9IHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwidy1mdWxsIGJvcmRlci1wdXJwbGUtNDAwIHRleHQtcHVycGxlLTMwMCBob3ZlcjpiZy1wdXJwbGUtNDAwLzEwIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTQgaC00IG1yLTJcIiAvPiBTdWdlcmlyIFRyYXRhbWVudG8gY29tIElBXG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dNZWRGb3JtKCFzaG93TWVkRm9ybSl9IHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwidy1mdWxsIGJvcmRlci1kYXNoZWQgYm9yZGVyLXdoaXRlLzMwIHRleHQtd2hpdGUvNzAgaG92ZXI6Ymctd2hpdGUvMTBcIj5cbiAgICAgICAgICAgIHtzaG93TWVkRm9ybSA/ICdGZWNoYXIgRm9ybXVsw6FyaW8nIDogJ0FkaWNpb25hciBNYW51YWxtZW50ZSd9XG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxBbmltYXRlUHJlc2VuY2U+XG4gICAgICAgIHtzaG93TWVkRm9ybSAmJiA8TWVkaWNhdGlvbkZvcm0gZGlzZWFzZUlkPXtkaXNlYXNlLmlkfSBvbk1lZGljYXRpb25BZGRlZD17KCkgPT4geyBvblVwZGF0ZSgpOyBzZXRTaG93TWVkRm9ybShmYWxzZSk7IH19IC8+fVxuICAgICAgPC9BbmltYXRlUHJlc2VuY2U+XG4gICAgPC9tb3Rpb24uZGl2PlxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgRGlzZWFzZU1hbmFnZXIgPSAoKSA9PiB7XG4gIGNvbnN0IFtkaXNlYXNlcywgc2V0RGlzZWFzZXNdID0gdXNlU3RhdGUoW10pO1xuXG4gIGNvbnN0IGxvYWREaXNlYXNlcyA9ICgpID0+IHNldERpc2Vhc2VzKGdldERpc2Vhc2VzKCkpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbG9hZERpc2Vhc2VzKCk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Rpc2Vhc2VzVXBkYXRlZCcsIGxvYWREaXNlYXNlcyk7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkaXNlYXNlc1VwZGF0ZWQnLCBsb2FkRGlzZWFzZXMpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlRGVsZXRlRGlzZWFzZSA9IChpZCkgPT4ge1xuICAgIGRlbGV0ZURpc2Vhc2UoaWQpO1xuICAgIGxvYWREaXNlYXNlcygpO1xuICAgIHRvYXN0KHsgdGl0bGU6IFwi4pyFIFJlbW92aWRvXCIsIGRlc2NyaXB0aW9uOiBcIkRvZW7Dp2EgZSBzZXVzIHJlZ2lzdHJvcyBmb3JhbSByZW1vdmlkb3MuXCIgfSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRGVsZXRlTWVkaWNhdGlvbiA9IChkaXNlYXNlSWQsIG1lZGljYXRpb25JZCkgPT4ge1xuICAgIGRlbGV0ZU1lZGljYXRpb25Gcm9tRGlzZWFzZShkaXNlYXNlSWQsIG1lZGljYXRpb25JZCk7XG4gICAgbG9hZERpc2Vhc2VzKCk7XG4gICAgdG9hc3QoeyB0aXRsZTogXCLinIUgUmVtb3ZpZG9cIiwgZGVzY3JpcHRpb246IFwiTWVkaWNhbWVudG8gcmVtb3ZpZG8uXCIgfSk7XG4gIH07XG4gIFxuICBjb25zdCBoYW5kbGVEZWxldGVUcmVhdG1lbnQgPSAoZGlzZWFzZUlkLCB0cmVhdG1lbnRJZCkgPT4ge1xuICAgIGRlbGV0ZVRyZWF0bWVudEZyb21EaXNlYXNlKGRpc2Vhc2VJZCwgdHJlYXRtZW50SWQpO1xuICAgIGxvYWREaXNlYXNlcygpO1xuICAgIHRvYXN0KHsgdGl0bGU6IFwi4pyFIFJlbW92aWRvXCIsIGRlc2NyaXB0aW9uOiBcIlRyYXRhbWVudG8gcmVtb3ZpZG8uXCIgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8c2VjdGlvbiBpZD1cIm1hbmFnZXJcIiBjbGFzc05hbWU9XCJweS0yMCBweC00XCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC13LTZ4bCBteC1hdXRvXCI+XG4gICAgICAgIDxEaXNlYXNlRm9ybSBvbkRpc2Vhc2VBZGRlZD17bG9hZERpc2Vhc2VzfSAvPlxuXG4gICAgICAgIHtkaXNlYXNlcy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBtZDpncmlkLWNvbHMtMiBnYXAtNiByZWxhdGl2ZSB6LTEwXCI+XG4gICAgICAgICAgICA8QW5pbWF0ZVByZXNlbmNlPlxuICAgICAgICAgICAgICB7ZGlzZWFzZXMubWFwKGQgPT4gKFxuICAgICAgICAgICAgICAgIDxEaXNlYXNlQ2FyZCBcbiAgICAgICAgICAgICAgICAgICAga2V5PXtkLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgZGlzZWFzZT17ZH0gXG4gICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlPXtsb2FkRGlzZWFzZXN9IFxuICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZU1lZGljYXRpb249e2hhbmRsZURlbGV0ZU1lZGljYXRpb259XG4gICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlVHJlYXRtZW50PXtoYW5kbGVEZWxldGVUcmVhdG1lbnR9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L0FuaW1hdGVQcmVzZW5jZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8bW90aW9uLmRpdiBpbml0aWFsPXt7IG9wYWNpdHk6IDAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIGdsYXNzLWVmZmVjdCBwLTEyIHJvdW5kZWQtM3hsXCI+XG4gICAgICAgICAgICA8QnJhaW4gY2xhc3NOYW1lPVwidy0xNiBoLTE2IG14LWF1dG8gbWItNCB0ZXh0LXB1cnBsZS00MDBcIiAvPlxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCBtYi0yXCI+TmVuaHVtYSBkb2Vuw6dhIGNhZGFzdHJhZGE8L2gzPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1wdXJwbGUtMzAwXCI+QWRpY2lvbmUgdW1hIGRvZW7Dp2EgcGFyYSBjb21lw6dhci48L3A+XG4gICAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgPC9zZWN0aW9uPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRGlzZWFzZU1hbmFnZXI7Il0sImZpbGUiOiIvaG9tZS91MjI1MDg0NDE3L3dlYnNpdGVzL1JQVjlsUXlFYi9wdWJsaWNfaHRtbC9zcmMvY29tcG9uZW50cy9EaXNlYXNlTWFuYWdlci5qc3gifQ==