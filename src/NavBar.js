import "./NavBar.css";
function NavBar({ projectScroll, publicationsScroll, researchScroll }) {
  return (
    <div>
      <nav className="navbar navbar-expand-lg w-100 border-bottom">
        <div className="container justify-content-between">
          <div>
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
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
          <div
            className="collapse navbar-collapse right"
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
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
