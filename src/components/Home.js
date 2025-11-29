import React from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaGraduationCap,
  FaLaptopCode,
  FaBrain,
  FaChartLine,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaTag,
} from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const experiences = [
    {
      id: 1,
      title: "Python Developer",
      company: "Virtusa (Consulting for Citi Bank)",
      period: "Jun'24 – Present",
      location: "Remote",
      achievements: [
        "Designed and implemented microservices with REST APIs using FastAPI to extract, validate, transform, and load metadata into MongoDB and Oracle database, supporting input from XLSX file, and database sources.",
        "Migrated data validation scripts to Python, utilizing vectorized operations to reduce execution time by 60%, and deployed as a scalable microservice to support future data growth, optimizing request throughput.",
        "Led a team of two interns for the Maphub project, serving as the primary developer responsible for architecture, implementation, and mentorship.",
        "Integrated real-time ML training and inference using AWS AutoGluon, enabling a fully UI-driven workflow where users can train, version, and deploy models for live predictions via the Maphub Data Studio.",
      ],
    },
    {
      id: 2,
      title: "Data Engineer",
      company: "Infosys",
      period: "May'19 – Dec'21",
      location: "Hyderabad, India",
      achievements: [
        "Engineered a scalable streaming data pipeline on GCP, utilizing Pub/Sub and Cloud Run for automated data ingestion and processing. This enabled real-time insights into store trends, driving a 15% increase in sales and accelerating data-driven decision-making.",
        "Built and managed independently four complex ETL batch data pipelines using Apache PySpark, Delta Lake, Databricks, Apache Airflow, and AWS services, serving three clients: Levi's, Kraft Heinz, and HCSC.",
        "Optimized data processing performance and resource utilization by strategically implementing window functions, leading to 30% reduction in Spark job runtime and 15% decrease in cluster memory usage.",
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
    },
    {
      id: 2,
      title: "Shark Tank Analysis",
      subtitle: "Fall'23",
      description:
        "Developed an interactive dashboard to analyze entrepreneur participation across industries and states, highlighting trends in valuations.",
      technologies: ["Data Analysis", "D3.js", "JavaScript", "Tableau"],
      featured: true,
    },
    {
      id: 3,
      title: "Hate Speech Detection",
      subtitle: "Summer'22",
      description:
        "Developed a hate speech detection tool deployed on Observable, enabling real-time text classification as hate, offensive, or neutral.",
      technologies: ["ML", "XGBoost + TF-IDF", "Pyodide"],
      featured: false,
    },
  ];

  const skills = {
    Languages: ["Python", "JavaScript", "Java", "Bash", "C"],
    "Data Engineering": ["Apache PySpark", "Apache Airflow", "Pandas"],
    "Cloud Technologies": [
      "GCP - BigQuery",
      "Cloud Function",
      "Cloud Run",
      "Cloud Build",
      "Kubernetes",
    ],
    Databases: ["MongoDB", "MySQL", "Postgres", "DuckDB", "SQLite"],
    "Data Visualization": ["Vega-lite", "D3.js", "Tableau"],
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="profile-section">
              <motion.div
                className="profile-image-container"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="/profile.jpg"
                  alt="Kasi Vandanapu"
                  className="profile-image"
                />
              </motion.div>

              <div className="profile-info">
                <h1 className="name">Kasi Vandanapu</h1>
                <h2 className="title">Python Developer</h2>
                <p className="summary">
                  Python Developer with experience in microservices, data
                  engineering, and research. Led projects in scalable backend
                  development, real-time ML workflows, and cloud-native
                  solutions. Passionate about building robust, data-driven
                  applications and contributing to impactful research.
                </p>
              </div>
            </div>

            <div className="contact-info">
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>2115 Lennox Dale Ln, Brandon, FL 33510</span>
              </div>
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <span>+1 (682) 247-7728</span>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <a href="mailto:kasivisu3109@gmail.com">
                  kasivisu3109@gmail.com
                </a>
              </div>
            </div>

            <div className="social-links">
              <motion.a
                href="https://github.com/kasivisu4"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGithub />
                <span>GitHub</span>
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/kasivisu4/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaLinkedin />
                <span>LinkedIn</span>
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            className="quick-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="stat-item">
              <h3>5</h3>
              <p>Years Experience</p>
            </div>
            <div className="stat-item">
              <h3>10+</h3>
              <p>Projects Completed</p>
            </div>
            <div className="stat-item">
              <h3>1</h3>
              <p>Research Papers</p>
            </div>
            <div className="stat-item">
              <h3>5+</h3>
              <p>Technologies</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="section-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            About Me
          </motion.h2>

          <div className="about-content">
            <motion.div
              className="about-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <p>
                I am a passionate Data Engineer and AI researcher with over 4
                years of experience in building scalable data solutions and
                machine learning applications. My journey in technology began at
                Amrita School of Engineering, where I earned my Bachelor's in
                Computer Science, followed by a Master's degree from
                Northeastern University.
              </p>
              <p>
                Currently working as a Python Developer at Virtusa (consulting
                for Citi Bank), I specialize in designing microservices with
                REST APIs using FastAPI, implementing real-time ML workflows,
                and optimizing data processing pipelines. My work has led to
                significant performance improvements, including 60% reduction in
                execution time and 30% improvement in Spark job runtime.
              </p>
            </motion.div>

            <motion.div
              className="expertise-areas"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3>Areas of Expertise</h3>
              <div className="expertise-grid">
                <div className="expertise-item">
                  <FaLaptopCode className="expertise-icon" />
                  <span>Data Engineering</span>
                </div>
                <div className="expertise-item">
                  <FaBrain className="expertise-icon" />
                  <span>Machine Learning</span>
                </div>
                <div className="expertise-item">
                  <FaChartLine className="expertise-icon" />
                  <span>Data Visualization</span>
                </div>
                <div className="expertise-item">
                  <FaGraduationCap className="expertise-icon" />
                  <span>Research</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="section">
        <div className="section-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Experience
          </motion.h2>

          <div className="experience-timeline">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                className="experience-item"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="experience-header">
                  <h3>{exp.title}</h3>
                  <div className="experience-meta">
                    <span className="company">{exp.company}</span>
                    <span className="period">
                      <FaCalendarAlt className="meta-icon" />
                      {exp.period}
                    </span>
                    <span className="location">{exp.location}</span>
                  </div>
                </div>
                <ul className="achievements">
                  {exp.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="section">
        <div className="section-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Projects
          </motion.h2>

          <div className="projects-grid">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="project-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className="project-header">
                  <h3>{project.title}</h3>
                  <span className="project-subtitle">{project.subtitle}</span>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-technologies">
                  {project.technologies.map((tech, idx) => (
                    <span key={idx} className="tech-tag">
                      <FaTag className="tag-icon" />
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="section">
        <div className="section-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Skills & Technologies
          </motion.h2>

          <div className="skills-grid">
            {Object.entries(skills).map(([category, skillList], index) => (
              <motion.div
                key={category}
                className="skill-category"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h3>{category}</h3>
                <div className="skill-tags">
                  {skillList.map((skill, idx) => (
                    <span key={idx} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
