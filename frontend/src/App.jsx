
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import FooterComponent from "./components/Footer";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Intake from "./pages/Intake";
import Success from "./pages/Success";
import CRM from "./pages/CRM";
import FAQ from "./pages/FAQ";
import EFileWizard from "./pages/EFileWizard";
import DIYEFileWizard from "./pages/DIYEFileWizard";
import Invoice from "./pages/Invoice";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("darkMode", darkMode);
      window.darkMode = darkMode;
      window.setDarkMode = setDarkMode;
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/success" element={<Success />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/lms" element={<LazyLms />} />
          <Route path="/efile" element={<EFileWizard />} />
          <Route path="/diy-efile" element={<DIYEFileWizard />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>
      <FooterComponent />
    </BrowserRouter>
  );
}

function LazyLms() {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import("./pages/Lms").then(m => setComp(() => m.default));
  }, []);
  if (!Comp) return <div className="section"><div className="container">Loading LMS…</div></div>;
  return <Comp />;
}
