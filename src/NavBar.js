import React, { useState } from "react";
function NavBar({
  projectScroll,
  publicationsScroll,
  researchScroll,
  activitiesScroll,
}) {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  return (
    <nav className="navbar navbar-expand-md w-100 border-bottom fixed-top p-0 bg-white">
      <div className="container vw-md-100">
        <a className="navbar-brand" href="#">
          Kasi Viswanath Vandanapu
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
          onClick={handleNavCollapse}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className={`${
            isNavCollapsed ? "collapse" : ""
          } navbar-collapse justify-content-end`}
          id="navbarNavDropdown"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => projectScroll.current.scrollIntoView()}
              >
                Projects
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => publicationsScroll.current.scrollIntoView()}
              >
                Publications
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => researchScroll.current.scrollIntoView()}
              >
                Research
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => activitiesScroll.current.scrollIntoView()}
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
