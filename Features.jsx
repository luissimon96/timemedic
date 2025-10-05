import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/Features.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=43ff1a3f"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
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
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=43ff1a3f"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react;
import { motion } from "/node_modules/.vite/deps/framer-motion.js?v=43ff1a3f";
import { Brain, Shield, Zap, Clock } from "/node_modules/.vite/deps/lucide-react.js?v=43ff1a3f";
const features = [{
  icon: Brain,
  title: "IA Integrada",
  description: "Análise inteligente de medicamentos e interações com OpenRouter AI",
  color: "from-violet-500 to-purple-500"
}, {
  icon: Shield,
  title: "Seguro & Privado",
  description: "Seus dados protegidos com criptografia de ponta a ponta",
  color: "from-fuchsia-500 to-pink-500"
}, {
  icon: Zap,
  title: "Rápido & Eficiente",
  description: "Acesso instantâneo ao seu histórico médico completo",
  color: "from-purple-500 to-indigo-500"
}, {
  icon: Clock,
  title: "Lembretes Automáticos",
  description: "Nunca esqueça de tomar seus medicamentos no horário",
  color: "from-pink-500 to-rose-500"
}];
const Features = () => {
  return /* @__PURE__ */ jsxDEV("section", { className: "py-20 px-4 relative", children: /* @__PURE__ */ jsxDEV("div", { className: "max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxDEV(motion.div, { initial: {
      opacity: 0,
      y: 30
    }, whileInView: {
      opacity: 1,
      y: 0
    }, viewport: {
      once: true
    }, transition: {
      duration: 0.8
    }, className: "text-center mb-16", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-4xl md:text-5xl font-bold mb-4", "data-edit-disabled": "true", children: [
        "Recursos ",
        /* @__PURE__ */ jsxDEV("span", { className: "gradient-text", children: "Poderosos" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
          lineNumber: 59,
          columnNumber: 22
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 58,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xl text-purple-300 max-w-2xl mx-auto", "data-edit-id": "src/components/Features.jsx:47:11", children: "Tudo que você precisa para gerenciar sua saúde de forma inteligente" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 61,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
      lineNumber: 47,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6", children: features.map((feature, index) => /* @__PURE__ */ jsxDEV(motion.div, { initial: {
      opacity: 0,
      y: 30
    }, whileInView: {
      opacity: 1,
      y: 0
    }, viewport: {
      once: true
    }, transition: {
      duration: 0.5,
      delay: index * 0.1
    }, whileHover: {
      scale: 1.05,
      y: -5
    }, className: "glass-effect p-6 rounded-2xl hover:glow-effect transition-all duration-300", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`, children: /* @__PURE__ */ jsxDEV(feature.icon, { className: "w-7 h-7 text-white" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 83,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 82,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-bold mb-2", "data-edit-disabled": "true", children: feature.title }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 85,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-purple-300", "data-edit-disabled": "true", children: feature.description }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
        lineNumber: 86,
        columnNumber: 15
      }, this)
    ] }, index, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
      lineNumber: 67,
      columnNumber: 45
    }, this)) }, void 0, false, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
      lineNumber: 66,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
    lineNumber: 46,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx",
    lineNumber: 45,
    columnNumber: 10
  }, this);
};
_c = Features;
export default Features;
var _c;
$RefreshReg$(_c, "Features");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports)
        return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Features.jsx", currentExports, nextExports);
      if (invalidateMessage)
        import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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QVEsSUFBQVU7QUFBQUMsYUFBQUQsSUFBQSIsIm5hbWVzIjpbIlJlYWN0IiwibW90aW9uIiwiQnJhaW4iLCJTaGllbGQiLCJaYXAiLCJDbG9jayIsImZlYXR1cmVzIiwiaWNvbiIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJjb2xvciIsIkZlYXR1cmVzIiwib3BhY2l0eSIsInkiLCJvbmNlIiwiZHVyYXRpb24iLCJtYXAiLCJmZWF0dXJlIiwiaW5kZXgiLCJkZWxheSIsInNjYWxlIiwiX2MiLCIkUmVmcmVzaFJlZyQiXSwic291cmNlcyI6WyJzcmMvY29tcG9uZW50cy9GZWF0dXJlcy5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgbW90aW9uIH0gZnJvbSAnZnJhbWVyLW1vdGlvbic7XG5pbXBvcnQgeyBCcmFpbiwgU2hpZWxkLCBaYXAsIENsb2NrIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcblxuY29uc3QgZmVhdHVyZXMgPSBbXG4gIHtcbiAgICBpY29uOiBCcmFpbixcbiAgICB0aXRsZTogJ0lBIEludGVncmFkYScsXG4gICAgZGVzY3JpcHRpb246ICdBbsOhbGlzZSBpbnRlbGlnZW50ZSBkZSBtZWRpY2FtZW50b3MgZSBpbnRlcmHDp8O1ZXMgY29tIE9wZW5Sb3V0ZXIgQUknLFxuICAgIGNvbG9yOiAnZnJvbS12aW9sZXQtNTAwIHRvLXB1cnBsZS01MDAnXG4gIH0sXG4gIHtcbiAgICBpY29uOiBTaGllbGQsXG4gICAgdGl0bGU6ICdTZWd1cm8gJiBQcml2YWRvJyxcbiAgICBkZXNjcmlwdGlvbjogJ1NldXMgZGFkb3MgcHJvdGVnaWRvcyBjb20gY3JpcHRvZ3JhZmlhIGRlIHBvbnRhIGEgcG9udGEnLFxuICAgIGNvbG9yOiAnZnJvbS1mdWNoc2lhLTUwMCB0by1waW5rLTUwMCdcbiAgfSxcbiAge1xuICAgIGljb246IFphcCxcbiAgICB0aXRsZTogJ1LDoXBpZG8gJiBFZmljaWVudGUnLFxuICAgIGRlc2NyaXB0aW9uOiAnQWNlc3NvIGluc3RhbnTDom5lbyBhbyBzZXUgaGlzdMOzcmljbyBtw6lkaWNvIGNvbXBsZXRvJyxcbiAgICBjb2xvcjogJ2Zyb20tcHVycGxlLTUwMCB0by1pbmRpZ28tNTAwJ1xuICB9LFxuICB7XG4gICAgaWNvbjogQ2xvY2ssXG4gICAgdGl0bGU6ICdMZW1icmV0ZXMgQXV0b23DoXRpY29zJyxcbiAgICBkZXNjcmlwdGlvbjogJ051bmNhIGVzcXVlw6dhIGRlIHRvbWFyIHNldXMgbWVkaWNhbWVudG9zIG5vIGhvcsOhcmlvJyxcbiAgICBjb2xvcjogJ2Zyb20tcGluay01MDAgdG8tcm9zZS01MDAnXG4gIH1cbl07XG5cbmNvbnN0IEZlYXR1cmVzID0gKCkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInB5LTIwIHB4LTQgcmVsYXRpdmVcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG9cIj5cbiAgICAgICAgPG1vdGlvbi5kaXZcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDMwIH19XG4gICAgICAgICAgd2hpbGVJblZpZXc9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxuICAgICAgICAgIHZpZXdwb3J0PXt7IG9uY2U6IHRydWUgfX1cbiAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjggfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBtYi0xNlwiXG4gICAgICAgID5cbiAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC00eGwgbWQ6dGV4dC01eGwgZm9udC1ib2xkIG1iLTRcIj5cbiAgICAgICAgICAgIFJlY3Vyc29zIDxzcGFuIGNsYXNzTmFtZT1cImdyYWRpZW50LXRleHRcIj5Qb2Rlcm9zb3M8L3NwYW4+XG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhsIHRleHQtcHVycGxlLTMwMCBtYXgtdy0yeGwgbXgtYXV0b1wiPlxuICAgICAgICAgICAgVHVkbyBxdWUgdm9jw6ogcHJlY2lzYSBwYXJhIGdlcmVuY2lhciBzdWEgc2HDumRlIGRlIGZvcm1hIGludGVsaWdlbnRlXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L21vdGlvbi5kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIG1kOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy00IGdhcC02XCI+XG4gICAgICAgICAge2ZlYXR1cmVzLm1hcCgoZmVhdHVyZSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDxtb3Rpb24uZGl2XG4gICAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMzAgfX1cbiAgICAgICAgICAgICAgd2hpbGVJblZpZXc9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxuICAgICAgICAgICAgICB2aWV3cG9ydD17eyBvbmNlOiB0cnVlIH19XG4gICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDAuNSwgZGVsYXk6IGluZGV4ICogMC4xIH19XG4gICAgICAgICAgICAgIHdoaWxlSG92ZXI9e3sgc2NhbGU6IDEuMDUsIHk6IC01IH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImdsYXNzLWVmZmVjdCBwLTYgcm91bmRlZC0yeGwgaG92ZXI6Z2xvdy1lZmZlY3QgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2B3LTE0IGgtMTQgcm91bmRlZC14bCBiZy1ncmFkaWVudC10by1iciAke2ZlYXR1cmUuY29sb3J9IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG1iLTRgfT5cbiAgICAgICAgICAgICAgICA8ZmVhdHVyZS5pY29uIGNsYXNzTmFtZT1cInctNyBoLTcgdGV4dC13aGl0ZVwiIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgbWItMlwiPntmZWF0dXJlLnRpdGxlfTwvaDM+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtcHVycGxlLTMwMFwiPntmZWF0dXJlLmRlc2NyaXB0aW9ufTwvcD5cbiAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L3NlY3Rpb24+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBGZWF0dXJlcztcbiAgIl0sImZpbGUiOiIvaG9tZS91MjI1MDg0NDE3L3dlYnNpdGVzL1JQVjlsUXlFYi9wdWJsaWNfaHRtbC9zcmMvY29tcG9uZW50cy9GZWF0dXJlcy5qc3gifQ==