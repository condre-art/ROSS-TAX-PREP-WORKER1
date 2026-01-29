import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Intake from "./pages/Intake";
import Success from "./pages/Success";
import CRM from "./pages/CRM";
import "./index.css";

function Header() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="brand">
          <img 
            className="brand-logo" 
            src="/rtb-logo.png" 
            alt="Ross Tax & Bookkeeping"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <div className="brand-text">
            <div className="brand-name">Ross Tax &amp; Bookkeeping</div>
            <div className="brand-sub">Accurate. Compliant. Confident.</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
            Home
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
            Services
          </NavLink>
          <NavLink to="/intake" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
            Intake
          </NavLink>
          <NavLink to="/crm" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
            CRM
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

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
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
