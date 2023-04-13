import { Button } from "bootstrap";
import "./App.css";
import NavBar from "./NavBar";
import Resume from "./Kasi_Resume.pdf";
function App() {
  return (
    <div className="App">
      <NavBar></NavBar>
      <div className="container d-flex flex-wrap">
        <div className="left-container d-flex flex-row">
          <img
            src="/profile.jpg"
            height="300"
            width="300"
            className="img"
          ></img>
          <div className="contact">
            <div className="Resume">
              <button className="btn btn-outline-info">
                <a
                  className="contact-link"
                  href={Resume}
                  download="kasi_resume.pdf"
                >
                  Here is my resume
                </a>
              </button>
            </div>
            <div className="Mail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-envelope"
                viewBox="0 0 16 16"
              >
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
              </svg>
              <a className="contact-link" href="mailto:kasivisu3109@gmail.com">
                kasivisu3109@gmail.com
              </a>
            </div>
            <div className="linkedin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-linkedin"
                viewBox="0 0 16 16"
              >
                <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
              </svg>
              <a
                className="contact-link"
                href="https://www.linkedin.com/in/kasivisu4/"
              >
                LinkedIn
              </a>
            </div>
            <div className="Twitter">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-twitter"
                viewBox="0 0 16 16"
              >
                <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
              </svg>
              <a
                className="contact-link"
                href="https://twitter.com/kasi_vandanapu"
              >
                Twitter
              </a>
            </div>
            <div className="Facebook">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-facebook"
                viewBox="0 0 16 16"
              >
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
              </svg>
              <a
                className="contact-link"
                href="https://www.facebook.com/vandanapu.kasi/"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
        <div className="right-container">
          <div className="section-1">
            <a href="https://git.io/typing-svg">
              <img
                src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=3000&pause=3000&color=76C2DE&repeat=false&width=435&height=100&lines=Hello+I'm+Kasi+Viswanath+Vandanapu%F0%9F%91%8B;I'm+looking+for+Summer'23+Internships..."
                alt="Typing SVG"
              />
            </a>
            <div className="Intro">
              <p>
                I am currently pursuing my Master's degree in Computer Science
                at{" "}
                <a href="https://sanfrancisco.northeastern.edu/">
                  Northeastern University, San Francisco Campus
                </a>{" "}
                and I am currently in my third semester. As a part of my
                academic curriculum, I have taken Human-Computer Interaction,
                Data Visualization, Programming Design Paradigms, Natural
                Language Processing and Machine Learning courses.
              </p>
              I am also working as a Research Assistant advised by Prof.{" "}
              <a href="https://johnguerra.co/">John Alexis Guerra Gomez </a>. My
              primary research focus is on developing a framework for
              benchmarking in-browser data filtering techniques on Arquero,
              DuckDB-WASM, and Vanilla JS. You could find more details about my
              research
              <a
                className="link"
                href="https://observablehq.com/d/dc562520a7fa44d0?collection=@kasivisu4/data-processing-benchmark"
              >
                here.
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
