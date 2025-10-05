import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/Hero.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=43ff1a3f"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
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
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=43ff1a3f"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react;
import { motion } from "/node_modules/.vite/deps/framer-motion.js?v=43ff1a3f";
import { Pill, Activity, FileText, Sparkles } from "/node_modules/.vite/deps/lucide-react.js?v=43ff1a3f";
const Hero = () => {
  return /* @__PURE__ */ jsxDEV("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 26,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl animate-pulse delay-1000" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 27,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
      lineNumber: 25,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "relative z-10 max-w-6xl mx-auto text-center", children: [
      /* @__PURE__ */ jsxDEV(motion.div, { initial: {
        opacity: 0,
        y: -30
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.8
      }, className: "mb-6", children: /* @__PURE__ */ jsxDEV("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-8", children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 text-yellow-400" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 41,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-medium", "data-edit-id": "src/components/Hero.jsx:23:13", children: "Powered by AI" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 42,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 40,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 31,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(motion.h1, { initial: {
        opacity: 0,
        y: 30
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.8,
        delay: 0.2
      }, className: "text-5xl md:text-7xl font-bold mb-6 leading-tight", "data-edit-disabled": "true", children: [
        "Controle Inteligente de",
        /* @__PURE__ */ jsxDEV("span", { className: "gradient-text block mt-2", children: "Medicamentos" }, void 0, false, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 57,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 46,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(motion.p, { initial: {
        opacity: 0,
        y: 30
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.8,
        delay: 0.4
      }, className: "text-xl md:text-2xl text-purple-200 mb-12 max-w-3xl mx-auto", "data-edit-id": "src/components/Hero.jsx:37:9", children: "Gerencie medicamentos, diagnósticos e exames com inteligência artificial. Tudo em um só lugar, seguro e fácil de usar." }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 60,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(motion.div, { initial: {
        opacity: 0,
        y: 30
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.8,
        delay: 0.6
      }, className: "flex flex-wrap gap-8 justify-center", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 glass-effect px-6 py-4 rounded-2xl glow-effect", children: [
          /* @__PURE__ */ jsxDEV(Pill, { className: "w-8 h-8 text-violet-400" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 84,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-2xl font-bold", "data-edit-id": "src/components/Hero.jsx:55:15", children: "500+" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 86,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-purple-300", "data-edit-id": "src/components/Hero.jsx:56:15", children: "Medicamentos" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 87,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 85,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 83,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 glass-effect px-6 py-4 rounded-2xl glow-effect", children: [
          /* @__PURE__ */ jsxDEV(Activity, { className: "w-8 h-8 text-fuchsia-400" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 92,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-2xl font-bold", "data-edit-id": "src/components/Hero.jsx:63:15", children: "1000+" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 94,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-purple-300", "data-edit-id": "src/components/Hero.jsx:64:15", children: "Diagnósticos" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 95,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 93,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 91,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 glass-effect px-6 py-4 rounded-2xl glow-effect", children: [
          /* @__PURE__ */ jsxDEV(FileText, { className: "w-8 h-8 text-pink-400" }, void 0, false, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 100,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-2xl font-bold", "data-edit-id": "src/components/Hero.jsx:71:15", children: "2000+" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 102,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-purple-300", "data-edit-id": "src/components/Hero.jsx:72:15", children: "Exames" }, void 0, false, {
              fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
              lineNumber: 103,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
            lineNumber: 101,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
          lineNumber: 99,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
        lineNumber: 73,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
      lineNumber: 30,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx",
    lineNumber: 24,
    columnNumber: 10
  }, this);
};
_c = Hero;
export default Hero;
var _c;
$RefreshReg$(_c, "Hero");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports)
        return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/home/u225084417/websites/RPV9lQyEb/public_html/src/components/Hero.jsx", currentExports, nextExports);
      if (invalidateMessage)
        import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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bW90aW9uIiwiUGlsbCIsIkFjdGl2aXR5IiwiRmlsZVRleHQiLCJTcGFya2xlcyIsIkhlcm8iLCJvcGFjaXR5IiwieSIsImR1cmF0aW9uIiwiZGVsYXkiLCJfYyIsIiRSZWZyZXNoUmVnJCJdLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL0hlcm8uanN4Il0sInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG1vdGlvbiB9IGZyb20gJ2ZyYW1lci1tb3Rpb24nO1xuaW1wb3J0IHsgUGlsbCwgQWN0aXZpdHksIEZpbGVUZXh0LCBTcGFya2xlcyB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5cbmNvbnN0IEhlcm8gPSAoKSA9PiB7XG4gIHJldHVybiAoXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicmVsYXRpdmUgbWluLWgtc2NyZWVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiBweC00IHB5LTIwXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGluc2V0LTAgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTEvNCBsZWZ0LTEvNCB3LTk2IGgtOTYgYmctcHVycGxlLTUwMC8zMCByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgYW5pbWF0ZS1wdWxzZVwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIGJvdHRvbS0xLzQgcmlnaHQtMS80IHctOTYgaC05NiBiZy1mdWNoc2lhLTUwMC8zMCByb3VuZGVkLWZ1bGwgYmx1ci0zeGwgYW5pbWF0ZS1wdWxzZSBkZWxheS0xMDAwXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB6LTEwIG1heC13LTZ4bCBteC1hdXRvIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxtb3Rpb24uZGl2XG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAtMzAgfX1cbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cbiAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjggfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJtYi02XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHB4LTQgcHktMiByb3VuZGVkLWZ1bGwgZ2xhc3MtZWZmZWN0IG1iLThcIj5cbiAgICAgICAgICAgIDxTcGFya2xlcyBjbGFzc05hbWU9XCJ3LTQgaC00IHRleHQteWVsbG93LTQwMFwiIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+UG93ZXJlZCBieSBBSTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9tb3Rpb24uZGl2PlxuXG4gICAgICAgIDxtb3Rpb24uaDFcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDMwIH19XG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XG4gICAgICAgICAgdHJhbnNpdGlvbj17eyBkdXJhdGlvbjogMC44LCBkZWxheTogMC4yIH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC01eGwgbWQ6dGV4dC03eGwgZm9udC1ib2xkIG1iLTYgbGVhZGluZy10aWdodFwiXG4gICAgICAgID5cbiAgICAgICAgICBDb250cm9sZSBJbnRlbGlnZW50ZSBkZVxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImdyYWRpZW50LXRleHQgYmxvY2sgbXQtMlwiPk1lZGljYW1lbnRvczwvc3Bhbj5cbiAgICAgICAgPC9tb3Rpb24uaDE+XG5cbiAgICAgICAgPG1vdGlvbi5wXG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAzMCB9fVxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDAuOCwgZGVsYXk6IDAuNCB9fVxuICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQteGwgbWQ6dGV4dC0yeGwgdGV4dC1wdXJwbGUtMjAwIG1iLTEyIG1heC13LTN4bCBteC1hdXRvXCJcbiAgICAgICAgPlxuICAgICAgICAgIEdlcmVuY2llIG1lZGljYW1lbnRvcywgZGlhZ27Ds3N0aWNvcyBlIGV4YW1lcyBjb20gaW50ZWxpZ8OqbmNpYSBhcnRpZmljaWFsLiBUdWRvIGVtIHVtIHPDsyBsdWdhciwgc2VndXJvIGUgZsOhY2lsIGRlIHVzYXIuXG4gICAgICAgIDwvbW90aW9uLnA+XG5cbiAgICAgICAgPG1vdGlvbi5kaXZcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDMwIH19XG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19XG4gICAgICAgICAgdHJhbnNpdGlvbj17eyBkdXJhdGlvbjogMC44LCBkZWxheTogMC42IH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTgganVzdGlmeS1jZW50ZXJcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBnbGFzcy1lZmZlY3QgcHgtNiBweS00IHJvdW5kZWQtMnhsIGdsb3ctZWZmZWN0XCI+XG4gICAgICAgICAgICA8UGlsbCBjbGFzc05hbWU9XCJ3LTggaC04IHRleHQtdmlvbGV0LTQwMFwiIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj41MDArPC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtcHVycGxlLTMwMFwiPk1lZGljYW1lbnRvczwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBnbGFzcy1lZmZlY3QgcHgtNiBweS00IHJvdW5kZWQtMnhsIGdsb3ctZWZmZWN0XCI+XG4gICAgICAgICAgICA8QWN0aXZpdHkgY2xhc3NOYW1lPVwidy04IGgtOCB0ZXh0LWZ1Y2hzaWEtNDAwXCIgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1sZWZ0XCI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZFwiPjEwMDArPC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtcHVycGxlLTMwMFwiPkRpYWduw7NzdGljb3M8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgZ2xhc3MtZWZmZWN0IHB4LTYgcHktNCByb3VuZGVkLTJ4bCBnbG93LWVmZmVjdFwiPlxuICAgICAgICAgICAgPEZpbGVUZXh0IGNsYXNzTmFtZT1cInctOCBoLTggdGV4dC1waW5rLTQwMFwiIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtbGVmdFwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGRcIj4yMDAwKzwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LXB1cnBsZS0zMDBcIj5FeGFtZXM8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9zZWN0aW9uPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgSGVybztcbiAgIl0sImZpbGUiOiIvaG9tZS91MjI1MDg0NDE3L3dlYnNpdGVzL1JQVjlsUXlFYi9wdWJsaWNfaHRtbC9zcmMvY29tcG9uZW50cy9IZXJvLmpzeCJ9