
import Navbar from "./components/Navbar";
import React, { useEffect, useState } from "react";
import FAQ from "./pages/FAQ";
import EFileWizard from "./pages/EFileWizard";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>© {new Date().getFullYear()} Ross Tax &amp; Bookkeeping. All rights reserved.</div>
        <div className="ptin">Condre Ross | Owner | Lead Tax Professional | PTIN P03215544</div>
      </div>
    </footer>
  );
}

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
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/success" element={<Success />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/lms" element={<LazyLms />} />
          <Route path="/efile" element={<EFileWizard />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>
      <Footer />
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
