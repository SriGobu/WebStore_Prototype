import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import "./Styles/index.css";
import App from "./App.jsx";
import ManifestSwitcher from "./Components/Admin/ManifestSwitcher.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ManifestSwitcher />
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
