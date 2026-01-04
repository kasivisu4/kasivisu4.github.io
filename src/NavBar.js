import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function NavBar({
  projectScroll,
  publicationsScroll,
  researchScroll,
  activitiesScroll,
}) {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navStyle = {
    background: scrolled ? "rgba(15, 23, 42, 0.85)" : "transparent",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
    transition: "all 0.3s ease",
    padding: scrolled ? "0.5rem 0" : "1rem 0",
  };

  const linkStyle = {
    color: "var(--text-primary)",
    fontWeight: "500",
    fontSize: "0.95rem",
    transition: "color 0.2s ease",
  };

  return (
    <nav
      className="navbar navbar-expand-md fixed-top w-100"
      style={navStyle}
    >
      <div className="container">
        <a 
          className="navbar-brand" 
          href="#"
          style={{
            color: "var(--text-primary)",
            fontWeight: "700",
            fontSize: "1.25rem",
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          KV
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
          onClick={handleNavCollapse}
          style={{ border: "none", color: "var(--text-primary)" }}
        >
          <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }}></span>
        </button>
        <div
          className={`${
            isNavCollapsed ? "collapse" : ""
          } navbar-collapse justify-content-end`}
          id="navbarNavDropdown"
        >
          <ul className="navbar-nav" style={{ gap: "1rem" }}>
            <li className="nav-item">
              <button
                className="nav-link btn-link"
                onClick={() => projectScroll.current.scrollIntoView({ behavior: 'smooth' })}
                style={linkStyle}
              >
                Projects
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn-link"
                onClick={() => publicationsScroll.current.scrollIntoView({ behavior: 'smooth' })}
                style={linkStyle}
              >
                Publications
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn-link"
                onClick={() => researchScroll.current.scrollIntoView({ behavior: 'smooth' })}
                style={linkStyle}
              >
                Research
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn-link"
                onClick={() => activitiesScroll.current.scrollIntoView({ behavior: 'smooth' })}
                style={linkStyle}
              >
                Activities
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
