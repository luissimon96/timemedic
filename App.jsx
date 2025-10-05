import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=43ff1a3f"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
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
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=43ff1a3f"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react;
import { Helmet } from "/node_modules/.vite/deps/react-helmet.js?v=43ff1a3f";
import { Toaster } from "/src/components/ui/toaster.jsx";
import Hero from "/src/components/Hero.jsx";
import Features from "/src/components/Features.jsx";
import DiseaseManager from "/src/components/DiseaseManager.jsx";
import Footer from "/src/components/Footer.jsx";
function App() {
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(Helmet, { children: [
      /* @__PURE__ */ jsxDEV("title", { children: "MediControl - Controle Inteligente de Saúde" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 32,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("meta", { name: "description", content: "Gerencie suas doenças e medicamentos de forma inteligente com IA integrada" }, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 33,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
      lineNumber: 31,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen", children: [
      /* @__PURE__ */ jsxDEV(Hero, {}, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 36,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Features, {}, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 37,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(DiseaseManager, {}, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 38,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Footer, {}, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 39,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Toaster, {}, void 0, false, {
        fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
        lineNumber: 40,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
      lineNumber: 35,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx",
    lineNumber: 30,
    columnNumber: 5
  }, this);
}
_c = App;
export default App;
var _c;
$RefreshReg$(_c, "App");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports)
        return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/home/u225084417/websites/RPV9lQyEb/public_html/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage)
        import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBVUksbUJBRUksY0FGSjs7Ozs7Ozs7Ozs7Ozs7OztBQVZKLE9BQU9BLFdBQVc7QUFDbEIsU0FBU0MsY0FBYztBQUN2QixTQUFTQyxlQUFlO0FBQ3hCLE9BQU9DLFVBQVU7QUFDakIsT0FBT0MsY0FBYztBQUNyQixPQUFPQyxvQkFBb0I7QUFDM0IsT0FBT0MsWUFBWTtBQUVuQixTQUFTQyxNQUFNO0FBQ2IsU0FDRSxtQ0FDRTtBQUFBLDJCQUFDLFVBQ0M7QUFBQSw2QkFBQyxXQUFNLDJEQUFQO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBa0Q7QUFBQSxNQUNsRCx1QkFBQyxVQUFLLE1BQUssZUFBYyxTQUFRLGdGQUFqQztBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQTZHO0FBQUEsU0FGL0c7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUdBO0FBQUEsSUFDQSx1QkFBQyxTQUFJLFdBQVUsZ0JBQ2I7QUFBQSw2QkFBQyxVQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBSztBQUFBLE1BQ0wsdUJBQUMsY0FBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQVM7QUFBQSxNQUNULHVCQUFDLG9CQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBZTtBQUFBLE1BQ2YsdUJBQUMsWUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQU87QUFBQSxNQUNQLHVCQUFDLGFBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQUFRO0FBQUEsU0FMVjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBTUE7QUFBQSxPQVhGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FZQTtBQUVKO0FBQUNDLEtBaEJRRDtBQWtCVCxlQUFlQTtBQUFJLElBQUFDO0FBQUFDLGFBQUFELElBQUEiLCJuYW1lcyI6WyJSZWFjdCIsIkhlbG1ldCIsIlRvYXN0ZXIiLCJIZXJvIiwiRmVhdHVyZXMiLCJEaXNlYXNlTWFuYWdlciIsIkZvb3RlciIsIkFwcCIsIl9jIiwiJFJlZnJlc2hSZWckIl0sInNvdXJjZXMiOlsiQXBwLmpzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSGVsbWV0IH0gZnJvbSAncmVhY3QtaGVsbWV0JztcbmltcG9ydCB7IFRvYXN0ZXIgfSBmcm9tICdAL2NvbXBvbmVudHMvdWkvdG9hc3Rlcic7XG5pbXBvcnQgSGVybyBmcm9tICdAL2NvbXBvbmVudHMvSGVybyc7XG5pbXBvcnQgRmVhdHVyZXMgZnJvbSAnQC9jb21wb25lbnRzL0ZlYXR1cmVzJztcbmltcG9ydCBEaXNlYXNlTWFuYWdlciBmcm9tICdAL2NvbXBvbmVudHMvRGlzZWFzZU1hbmFnZXInO1xuaW1wb3J0IEZvb3RlciBmcm9tICdAL2NvbXBvbmVudHMvRm9vdGVyJztcblxuZnVuY3Rpb24gQXBwKCkge1xuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8SGVsbWV0PlxuICAgICAgICA8dGl0bGU+TWVkaUNvbnRyb2wgLSBDb250cm9sZSBJbnRlbGlnZW50ZSBkZSBTYcO6ZGU8L3RpdGxlPlxuICAgICAgICA8bWV0YSBuYW1lPVwiZGVzY3JpcHRpb25cIiBjb250ZW50PVwiR2VyZW5jaWUgc3VhcyBkb2Vuw6dhcyBlIG1lZGljYW1lbnRvcyBkZSBmb3JtYSBpbnRlbGlnZW50ZSBjb20gSUEgaW50ZWdyYWRhXCIgLz5cbiAgICAgIDwvSGVsbWV0PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW5cIj5cbiAgICAgICAgPEhlcm8gLz5cbiAgICAgICAgPEZlYXR1cmVzIC8+XG4gICAgICAgIDxEaXNlYXNlTWFuYWdlciAvPlxuICAgICAgICA8Rm9vdGVyIC8+XG4gICAgICAgIDxUb2FzdGVyIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQXBwOyJdLCJmaWxlIjoiL2hvbWUvdTIyNTA4NDQxNy93ZWJzaXRlcy9SUFY5bFF5RWIvcHVibGljX2h0bWwvc3JjL0FwcC5qc3gifQ==