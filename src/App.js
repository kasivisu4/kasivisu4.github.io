import { Button } from "bootstrap";
import logo from "./logo.svg";
import "./App.css";
import NavBar from "./NavBar";
import Resume from "./kasi_vandanapu_resume.pdf";
import { useRef } from "react";

function App() {
  const scrollToProjects = useRef();
  const scrollToPublications = useRef();
  const scrollToResearch = useRef();
  const scrollToActivities = useRef();
  return (
    <div className="App">
      <NavBar
        projectScroll={scrollToProjects}
        publicationsScroll={scrollToPublications}
        researchScroll={scrollToResearch}
        activitiesScroll={scrollToActivities}
      ></NavBar>
      <div className="container d-flex flex-md-nowrap flex-wrap mt-5">
        <div className="left-container d-flex flex-column position-relative">
          <div className="text-center">
            <img
              src="/profile.jpg"
              height="300"
              width="300"
              className="profile-pic"
            ></img>
          </div>
          <div className="Resume pt-3 flex-md-1">
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
          <div className="contact d-flex flex-md-column flex-wrap  justify-content-center gap-md-0 gap-3">
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
              <a
                className="contact-link p-2"
                href="mailto:kasivisu3109@gmail.com"
              >
                kasivisu3109@gmail.com
              </a>
            </div>
            <div className="Github">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-github"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <a
                className="contact-link p-2"
                href="https://github.com/kasivisu4"
              >
                GitHub
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
                className="contact-link p-2"
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
                className="contact-link p-2"
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
                className="contact-link p-2"
                href="https://www.facebook.com/vandanapu.kasi/"
              >
                Facebook
              </a>
            </div>
            {/* <div className="footer">
              Made in React
              <img src={logo} className="App-logo" alt="logo" />
            </div> */}
          </div>
        </div>

        <div className="right-container pt-md-0 pt-3">
          <div className="section-1">
            <div className="Intro p-1 p-md-5">
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
          <div className="section-2 p-1 p-md-5">
            <h5>Work Experience</h5>
            <ul>
              <li>
                Infosys - Specialist Programmer (May'19 - Dec'21)
                <br />
                Worked for the following clients:
                <ul>
                  <li>
                    Levi's : Built and deployed batch data pipelines in the
                    Production Environment, scheduled and monitored complex data
                    transformations using Apache Spark, Delta Lake, Databricks,
                    Apache Airflow, and AWS services for the Demand Forecast
                    Application
                  </li>
                  <li>
                    Kraft Heinz : Implemented Event-driven framework for batch
                    data pipelines and extended it to handle stream data
                    pipelines using Google Cloud Platform Services
                  </li>
                  <li>
                    HCSC : Developed, Scheduled and Monitored complex data
                    pipelines using Pyspark and Zena scheduler
                  </li>
                </ul>
              </li>
              <br></br>
              <li>
                Health Edge Inc - Software Developer, Intern (Feb'19 - May'19)
                <ul>
                  <li>
                    Built and tested microservice applications using tools such
                    as Spring Boot, Hibernate and Apache Maven.
                  </li>
                </ul>
              </li>
              <br></br>

              <li>
                Virtusa - Technology, Intern (Jun'18 - May'18)
                <ul>
                  <li>
                    Gained Industrial exposure to the Apache Kafka framework
                    while implementing a schema generator for sample data using
                    Hadoop (MapReduce) and Python.
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div ref={scrollToProjects} className="projects p-1 p-md-5">
            <h5>Projects</h5>
            <ul>
              <li>
                <a href="https://github.com/bsander15/obm-nn">
                  Combinatorial Optimization (Fall’22){" "}
                </a>
                : Trained neural network with reinforcement learning on
                G-Mission dataset and achieved 87% optimality ratio on online
                bipartite matching
              </li>

              <li>
                <a href="https://www.figma.com/proto/0iePl2P2xORfNhmtRrn9sa/Kasi-HCI-Hi-Fi?node-id=14-10132&starting-point-node-id=14%3A10132">
                  Apartment Finder (Fall’22){" "}
                </a>
                : Designed a Web Application to find the apartments that are
                closer to specific locations and share the shortlisted with
                friends/family to get their opinion
              </li>

              <li>
                <a href="https://observablehq.com/@kasivisu4/hsd-visualization">
                  Hate Speech Detection (Summer'22){" "}
                </a>
                : Created a dashboard to detect whether the text is hate,
                offensive or neither speech. Published in the observable
                platform
              </li>

              <li>
                <a href="https://github.com/kasivisu4/cordiance-experential-project">
                  Cordiance Project (Spring'22){" "}
                </a>
                : This is an experiential Algorithm course project in
                collaboration with the Cordiance Company. The goal of this
                project is to get the closest possible UNSPSC code match for the
                Avalara Tax description
              </li>
            </ul>
          </div>
          <div ref={scrollToPublications} className="publication p-1 p-md-5">
            <h5>Publications / Contributions </h5>
            <ul>
              <li>
                <a href="https://startsfoundation.org/"> Starts Foundation </a>
                :Contributor in building the Starts Foundation website, an NGO
                based in Nepal. Developed with Gatsby, React, and Sanity Studio.{" "}
                <a href="https://github.com/yianan261/StartsFoundation">
                  {" "}
                  [Source Code]
                </a>
              </li>
              <li>
                <a href="https://observablehq.com/@john-guerra/multi-auto-select">
                  {" "}
                  Nested Selection{" "}
                </a>
                :Added a new feature to simplify UI that allows users to select
                multiple items within the same element. For instance, they can
                choose both State & Gender simultaneously, in one selection
                <a href="https://observablehq.com/@john-guerra/multi-auto-select">
                  [Notebook]
                </a>
              </li>
              <li>
                <a href="https://ieeexplore.ieee.org/author/37086530665">
                  Hadoop and Natural Language Processing Based Analysis on Kisan
                  Call Center (KCC) Data
                </a>
                : Published in 2018 International Conference on Advances in
                Computing, Communication, and Informatics.
              </li>
            </ul>
          </div>
          <div ref={scrollToResearch} className="research p-1 p-md-5">
            <h5>Research</h5>
            <ul>
              <li>
                <a href="https://observablehq.com/collection/@kasivisu4/data-filtering-benchmark">
                  Spring'23{" "}
                </a>
                : Working on Benchmarking In Browser backends such as Arquero,
                Duck-DB WASM and VanillaJS (Under Guidance of Prof. John Alexis
                Guerra Gomez)
              </li>
              <li>
                <a href="https://observablehq.com/@kasivisu4/list-curator-home-page?collection=@kasivisu4/list_curator">
                  Fall'22{" "}
                </a>
                : Worked on prototyping List Curator Application which is a
                Reusable data curation framework developing with HCI Design
                Guidelines (Under Guidance of Prof. John Alexis Guerra Gomez)
              </li>
              <li>
                <a href="https://observablehq.com/@kasivisu4/data_filterer?collection=@kasivisu4/list_curator">
                  Summer'22{" "}
                </a>
                : Worked on prototyping List Curator Application mainly
                concentrated on developing filterer that having features such as
                Cross Filter, filter with Advanced Data Transformations (Under
                Guidance of Prof. John Alexis Guerra Gomez)
              </li>
              <li>
                <a href="#">Dec'17-May'18 </a>: Worked on Analyzing Indian Kisan
                Call Center Data using Hadoop and Natural Language Processing
                (Under Guidance of Prof. Saravanan Selvam)
              </li>
            </ul>
          </div>
          <div ref={scrollToActivities} className="activities p-1 p-md-5">
            <h5> Activities</h5>
            <ul>
              <li>
                <a href="https://www.khoury.northeastern.edu/event/40th-anniversary-of-khoury-college-silicon-valley-celebration/">
                  Khoury'40{" "}
                </a>
                :Presented my research on a reusable widget called Data Filter
                at Northeastern University's Silicon Valley Campus{" "}
                <a href="https://www.figma.com/proto/S4oBQiDJ1OgIxZpLfpBzwm/Data-Filter-Poster?node-id=7-3&scaling=scale-down">
                  [Poster]
                </a>
              </li>
              <li>
                <a href="http://fotofiesta2k18.website2.me/">FotoFiesta2k18 </a>
                :Being Secretary of Smriti - The Photography & Design Club,
                hosted FotoFiesta2k18(flagship event)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
