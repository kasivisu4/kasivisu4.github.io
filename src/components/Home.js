import React from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaBook,
  FaGraduationCap,
  FaTwitter,
  FaFileAlt,
  FaExternalLinkAlt,
  FaChartBar,
  FaFileDownload,
  FaChartLine
} from "react-icons/fa";
import { SiTableau, SiObservable } from "react-icons/si";
import "./Home.css";
/* Import the local resume file. Adjust path if necessary based on folder structure. 
   Assuming Home.js is in src/components, and resume is in src/kasi_resume_v10.pdf 
*/
import resumePdf from "../kasi_resume_v10.pdf";

import CodingActivity from './CodingActivity';

const Home = () => {
  // Data Definition
  const experiences = [
    {
      id: 1,
      title: "Lead Python Developer",
      company: "Virtusa (Consulting for Citi Bank)",
      period: "Jun'24 – Present",
      location: "Tampa, Florida",
      achievements: [
        "Designed and implemented microservices with REST APIs using FastAPI to extract, validate, transform, and load metadata into MongoDB and Oracle database.",
        "Migrated data validation scripts to Python, utilizing vectorized operations to reduce execution time by 60%, and deployed as a scalable microservice.",
        "Lead developer for Maphub project, driving architecture design, implementation, and mentorship.",
        "Integrated real-time ML training and inference using AWS AutoGluon, enabling a fully UI-driven workflow.",
      ],
    },
    {
      id: 2,
      title: "Specialist Programmer",
      company: "Infosys",
      period: "May'19 – Dec'21",
      location: "Hyderabad, India",
      achievements: [
        "Engineered a scalable streaming data pipeline on GCP, utilizing Pub/Sub and Cloud Run for automated data ingestion and processing.",
        "Built and managed independently four complex ETL batch data pipelines using Apache PySpark, Delta Lake, Databricks, Apache Airflow, and AWS services.",
        "Optimized data processing performance and resource utilization by strategically implementing window functions, leading to 30% reduction in Spark job runtime.",
      ],
    },
  ];

  const projects = [
    {
      id: 1,
      title: "Wander Finds",
      subtitle: "Gemini AI Hackathon'24",
      description:
        "AI-driven mobile app that generates personalized travel recommendations based on Google Maps data and user preference.",
      technologies: ["Flutter", "Firebase", "LangChain", "Gemini"],
      featured: true,
      link: "https://ai.google.dev/competition/projects/wander-finds",
    },
    {
      id: 2,
      title: "Shark Tank Analysis",
      subtitle: "Fall'23",
      description:
        "Developed an interactive dashboard to analyze entrepreneur participation across industries and states, highlighting trends in valuations.",
      technologies: ["Data Analysis", "D3.js", "JavaScript", "Tableau"],
      featured: true,
      link: "https://akhilasulgante.github.io/SharkTankInViz/",
    },
    {
      id: 3,
      title: "Hate Speech Detection",
      subtitle: "Summer'22",
      description:
        "Developed an in-browser hate speech detection dashboard, enabling real-time text classification as hate, offensive, or neutral categories.",
      technologies: ["ML", "XGBoost + TF-IDF", "Pyodide"],
      featured: false,
      link: "https://observablehq.com/@kasivisu4/hsd-visualization",
    },
  ];

  const skills = {
    Languages: ["Python", "JavaScript", "Java", "Bash", "C"],
    Databases: ["MongoDB", "MySQL", "Postgres", "DuckDB", "SQLite"],
    "Workflow & Platforms": ["Delta Lake", "Apache Spark", "Airflow", "Databricks", "Tableau", "D3.js"],
    "ML Tools": ["AWS AutoGluon", "GCP Cloud Run", "LangChain", "Scikit-learn", "XGBoost", "Pyodide"],
    Certifications: ["PCAP™ – Certified Associate Python Programmer", "Smart Analytics, ML, and AI on GCP"],
  };

  const education = [
    {
      id: 1,
      school: "Northeastern University",
      degree: "Master's in Computer Science",
      period: "Jan'22 – Dec'23",
      details: [
        "Teaching Assistant - Database Management Systems; Human-Computer Interaction",
        "Research Assistant - List Curator (Summer'22 - Fall'23)"
      ]
    },
    {
      id: 2,
      school: "Amrita School of Engineering",
      degree: "Bachelor of Technology in Computer Science",
      period: "Aug'15 – May'19",
      details: []
    }
  ];

  const publications = [
    {
      id: 1,
      title: "Hadoop and Natural Language Processing Based Analysis on Kisan Call Center (KCC) Data",
      conference: "2018 International Conference on Advances in Computing, Communication, and Informatics",
      role: "Author: Vandanapu kasi"
    }
  ];

  return (
    <div className="home-split-layout">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <motion.div 
            className="profile-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="profile-image-wrapper">
              <img
                src="/profile.png"
                alt="Kasi Vandanapu"
                className="profile-image"
              />
            </div>
            <h1 className="name">
              <span className="accent-char">K</span>asi <span className="accent-char">V</span>andanapu
            </h1>
            <h2 className="title">Senior Python Developer</h2>
          </motion.div>

          <div className="contact-info">
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <span>Brandon, FL 33510</span>
            </div>
            {/* Removed phone for privacy/cleanliness, or updated to be simpler */}
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <a href="mailto:kasivisu3109@gmail.com">kasivisu3109@gmail.com</a>
            </div>
             <div className="social-links">
              <div className="social-row">
                <a href="https://github.com/kasivisu4" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaGithub /> GitHub
                </a>
                <a href="https://www.linkedin.com/in/kasivisu4/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaLinkedin /> LinkedIn
                </a>
              </div>
              <div className="social-row">
                <a href="https://observablehq.com/@kasivisu4?page=1&sort=stars&direction=desc" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaChartLine /> Observable
                </a>
              </div>
            </div>
          </div>
          
          {/* Resume Button */}
          <div className="resume-section" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
             <a href={resumePdf} target="_blank" rel="noopener noreferrer" className="resume-button" style={{
                 display: 'inline-flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 padding: '0.75rem 1.25rem',
                 backgroundColor: '#1E40AF',
                 color: 'white',
                 borderRadius: '8px',
                 textDecoration: 'none',
                 fontWeight: '500',
                 boxShadow: '0 4px 6px rgba(30, 64, 175, 0.2)',
                 transition: 'all 0.2s ease'
             }}>
                 <FaFileDownload /> Download Resume
             </a>
          </div>

          <div className="sidebar-summary">
            <p>
              Senior Python Developer & Data Engineer with 5+ years of experience building scalable, cloud-native data platforms and AI-driven applications. Expert in Python, FastAPI, Apache Spark, and real-time ML workflows.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Section */}
      <main className="home-content">
        
        {/* Experience Section */}
        <section id="experience" className="section">
          <h2 className="section-title">
            <div className="title-text">
              <span className="section-title-accent">E</span>mployment
            </div>
          </h2>
          <div className="experience-timeline">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                className="experience-item"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="experience-header">
                  <h3>{exp.title}</h3>
                  <span className="company">{exp.company}</span>
                </div>
                <div className="experience-meta">
                  <span className="period"><FaCalendarAlt /> {exp.period}</span>
                  <span className="location">{exp.location}</span>
                </div>
                <ul className="achievements">
                  {exp.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="section">
          <h2 className="section-title">
             <div className="title-text">
               <span className="section-title-accent">P</span>rojects
             </div>
          </h2>
          <div className="projects-grid">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="project-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="project-header">
                  <h3>
                    {project.link ? (
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        {project.title}
                      </a>
                    ) : (
                      project.title
                    )}
                  </h3>
                  <span className="project-subtitle">{project.subtitle}</span>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-technologies">
                  {project.technologies.map((tech, idx) => (
                    <span key={idx} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Visualizations Section */}
        <section id="visualizations" className="section">
           <h2 className="section-title">
            <div className="title-text">
              <span className="section-title-accent">D</span>ata Visualizations
            </div>
          </h2>
          <div className="projects-grid">
            <div className="project-card viz-card">
               <div className="viz-preview">
                 <img src={require('../viz_tableau_profile.png')} alt="Tableau Profile" />
                 <div className="viz-overlay">
                   <a href="https://public.tableau.com/app/profile/kasi.viswanath.vandanapu/vizzes" target="_blank" rel="noopener noreferrer" className="viz-link-btn">
                     <SiTableau /> View Portfolio
                   </a>
                 </div>
               </div>
               <div className="viz-info">
                 <h3>Tableau Profile</h3>
                 <p>Interactive dashboard collection on Tableau Public.</p>
               </div>
            </div>

            <div className="project-card viz-card">
               <div className="viz-preview">
                 <img src={require('../viz_utilization.png')} alt="Utilization Dashboard" />
                 <div className="viz-overlay">
                    <a href="https://public.tableau.com/app/profile/kasi.viswanath.vandanapu/viz/UtilizationMetrics/Dashboard1" target="_blank" rel="noopener noreferrer" className="viz-link-btn">
                     <SiTableau /> View Dashboard
                   </a>
                 </div>
               </div>
               <div className="viz-info">
                 <h3>Utilization Metrics</h3>
                 <p>Advanced utilization tracking dashboard.</p>
               </div>
            </div>

            <div className="project-card viz-card">
               <div className="viz-preview">
                 <img src={require('../viz_observable.png')} alt="Observable Collection" />
                 <div className="viz-overlay">
                    <a href="https://observablehq.com/collection/@kasivisu4/dataviz" target="_blank" rel="noopener noreferrer" className="viz-link-btn">
                     <SiObservable /> View Collection
                   </a>
                 </div>
               </div>
               <div className="viz-info">
                 <h3>Observable HQ</h3>
                 <p>D3.js & Data Viz experiments.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="section">
          <h2 className="section-title">
            <div className="title-text">
              <span className="section-title-accent">S</span>kills
            </div>
          </h2>
          <div className="skills-grid">
            {Object.entries(skills).map(([category, skillList], index) => (
              <div key={category} className="skill-category">
                <h3>{category}</h3>
                <div className="skill-tags">
                  {skillList.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coding Activity Section */}
        <CodingActivity />
        
        {/* Education Section */}
        <section id="education" className="section">
            <h2 className="section-title">
                <div className="title-text">
                  <span className="section-title-accent">E</span>ducation
                </div>
            </h2>
          <div className="education-grid">
            {education.map((edu, index) => (
              <div key={edu.id} className="education-item">
                <div className="edu-icon">
                    <FaGraduationCap />
                </div>
                <div className="education-content">
                    <h3>{edu.school}</h3>
                    <p className="degree">{edu.degree}</p>
                    <span className="edu-period">{edu.period}</span>
                    {edu.details.length > 0 && (
                    <ul className="edu-details">
                        {edu.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                        ))}
                    </ul>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Publications Section */}
        <section id="publications" className="section">
            <h2 className="section-title">
                <div className="title-text">
                  <span className="section-title-accent">P</span>ublication
                </div>
            </h2>
          <div className="publications-list">
            {publications.map((pub, index) => (
              <div key={pub.id} className="publication-item">
                <FaBook className="pub-icon" />
                <div className="pub-content">
                  <h3>{pub.title}</h3>
                  <p className="pub-conference">{pub.conference}</p>
                  <p className="pub-role">{pub.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
