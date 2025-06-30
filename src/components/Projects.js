import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaExternalLinkAlt, FaCalendarAlt } from 'react-icons/fa';
import './Projects.css';

const Projects = () => {
  const projects = [
    {
      id: 1,
      title: "Wander Finds",
      subtitle: "Gemini AI Hackathon'24",
      description: "AI-driven mobile app that generates personalized travel recommendations based on Google Maps data and user preference.",
      technologies: ["Flutter", "Firebase", "LangChain", "Gemini"],
      image: "/observable.png",
      github: "https://github.com/kasivisu4/wander-finds",
      live: "#",
      featured: true
    },
    {
      id: 2,
      title: "Shark Tank Analysis",
      subtitle: "Fall'23",
      description: "Developed an interactive dashboard to analyze entrepreneur participation across industries and states, highlighting trends in valuations.",
      technologies: ["Data Analysis", "D3.js", "JavaScript", "Tableau"],
      image: "/observable.png",
      github: "https://github.com/kasivisu4/shark-tank-analysis",
      live: "#",
      featured: true
    },
    {
      id: 3,
      title: "Hate Speech Detection",
      subtitle: "Summer'22",
      description: "Developed a hate speech detection tool deployed on Observable, enabling real-time text classification as hate, offensive, or neutral.",
      technologies: ["ML", "XGBoost + TF-IDF", "Pyodide"],
      image: "/observable.png",
      github: "https://github.com/kasivisu4/hate-speech-detection",
      live: "https://observablehq.com/@kasivisu4/hate-speech-detection",
      featured: false
    }
  ];

  const publications = [
    {
      id: 1,
      title: "Hadoop and Natural Language Processing Based Analysis on Kisan Call Center (KCC) Data",
      authors: "Vandanapu kasi",
      conference: "2018 International Conference on Advances in Computing, Communication, and Informatics",
      year: "2018",
      doi: "#"
    }
  ];

  return (
    <div className="projects">
      <div className="projects-container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="page-title">Projects & Publications</h1>
          
          {/* Featured Projects */}
          <section className="section">
            <h2 className="section-title">Featured Projects</h2>
            <div className="projects-grid">
              {projects.filter(p => p.featured).map((project, index) => (
                <motion.div
                  key={project.id}
                  className="project-card featured"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -10 }}
                >
                  <div className="project-image">
                    <img src={project.image} alt={project.title} />
                    <div className="project-overlay">
                      <div className="project-links">
                        {project.github && (
                          <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                            <FaGithub />
                          </a>
                        )}
                        {project.live && (
                          <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-link">
                            <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="project-content">
                    <div className="project-header">
                      <h3 className="project-title">{project.title}</h3>
                      <span className="project-subtitle">{project.subtitle}</span>
                    </div>
                    <p className="project-description">{project.description}</p>
                    <div className="project-technologies">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* All Projects */}
          <section className="section">
            <h2 className="section-title">All Projects</h2>
            <div className="projects-list">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className="project-item"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ x: 10 }}
                >
                  <div className="project-item-content">
                    <div className="project-item-header">
                      <h3 className="project-item-title">{project.title}</h3>
                      <span className="project-item-subtitle">{project.subtitle}</span>
                    </div>
                    <p className="project-item-description">{project.description}</p>
                    <div className="project-item-technologies">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="tech-tag small">{tech}</span>
                      ))}
                    </div>
                    <div className="project-item-links">
                      {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-item-link">
                          <FaGithub />
                          <span>Code</span>
                        </a>
                      )}
                      {project.live && (
                        <a href={project.live} target="_blank" rel="noopener noreferrer" className="project-item-link">
                          <FaExternalLinkAlt />
                          <span>Live</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Publications */}
          <section className="section">
            <h2 className="section-title">Publications</h2>
            <div className="publications-list">
              {publications.map((pub, index) => (
                <motion.div
                  key={pub.id}
                  className="publication-item"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="publication-content">
                    <h3 className="publication-title">{pub.title}</h3>
                    <div className="publication-meta">
                      <span className="publication-authors">{pub.authors}</span>
                      <span className="publication-year">
                        <FaCalendarAlt className="meta-icon" />
                        {pub.year}
                      </span>
                    </div>
                    <p className="publication-conference">{pub.conference}</p>
                    <div className="publication-links">
                      <a href={pub.doi} target="_blank" rel="noopener noreferrer" className="publication-link">
                        <FaExternalLinkAlt />
                        <span>View Paper</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default Projects; 