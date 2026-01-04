import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import "./NavBar.css";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Height of navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    closeMenu();
  };

  const navItems = [
    { id: "hero", label: "Home" }, // Though "hero" is usually top, keeping id
    { id: "experience", label: "Experience" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    // Removed "About" if it's redundant with the sidebar/hero
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Academic sites often just have the name in the text or no logo at all in the nav if sidebar has it */}
        <div className="nav-logo" onClick={() => scrollToSection("hero")}>
           {/* Keeping it empty or minimal if desired, or we can put the name here if sidebar is gone. 
               Reference site has "Arnav Verma" as a big header, not in nav bar initially. 
               We will keep it simple. */}
           <span className="logo-text">KV</span> 
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
          {navItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className="nav-link"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
