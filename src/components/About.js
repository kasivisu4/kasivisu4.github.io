import React from "react";
import { motion } from "framer-motion";
import {
  FaGraduationCap,
  FaLaptopCode,
  FaBrain,
  FaChartLine,
} from "react-icons/fa";
import "./About.css";

const About = () => {
  const researchAreas = [
    {
      icon: <FaLaptopCode />,
      title: "Data Engineering",
      description:
        "Building scalable data pipelines and microservices using modern cloud technologies and distributed systems.",
    },
    {
      icon: <FaBrain />,
      title: "Machine Learning",
      description:
        "Developing AI-driven applications with real-time training and inference capabilities using AWS AutoGluon.",
    },
    {
      icon: <FaChartLine />,
      title: "Data Visualization",
      description:
        "Creating interactive dashboards and visualizations using D3.js, Vega-lite, and Tableau for data insights.",
    },
    {
      icon: <FaGraduationCap />,
      title: "Research",
      description:
        "Contributing to academic research in data processing libraries and human-computer interaction.",
    },
  ];

  const interests = [
    "Scalable Microservices Architecture",
    "Real-time Data Processing",
    "Cloud-Native Applications",
    "AI/ML Model Deployment",
    "Data Pipeline Optimization",
    "Interactive Data Visualization",
    "Natural Language Processing",
    "Human-Computer Interaction",
  ];

  return (
    <div className="about">
      <div className="about-container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="page-title">About Me</h1>

          {/* Introduction Section */}
          <section className="section">
            <h2 className="section-title">Introduction</h2>
            <div className="intro-content">
              <p className="intro-text">
                I am a passionate Data Engineer and AI researcher with over 5
                years of experience in building scalable data solutions and
                machine learning applications. My journey in technology began at
                Amrita School of Engineering, where I earned my Bachelor's in
                Computer Science, followed by a Master's degree from
                Northeastern University.
              </p>
              <p className="intro-text">
                Currently working as a Python Developer at Virtusa (consulting
                for Citi Bank), I specialize in designing microservices with
                REST APIs using FastAPI, implementing real-time ML workflows,
                and optimizing data processing pipelines. My work has led to
                significant performance improvements, including 60% reduction in
                execution time and 30% improvement in Spark job runtime.
              </p>
              <p className="intro-text">
                I am deeply interested in the intersection of data engineering,
                machine learning, and user experience design. My research
                background includes work on data processing libraries evaluation
                and contributions to academic conferences. I believe in creating
                technology that not only solves complex problems but also
                provides intuitive user experiences.
              </p>
            </div>
          </section>

          {/* Research Areas */}
          <section className="section">
            <h2 className="section-title">Research & Expertise Areas</h2>
            <div className="research-grid">
              {researchAreas.map((area, index) => (
                <motion.div
                  key={index}
                  className="research-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="research-icon">{area.icon}</div>
                  <h3 className="research-title">{area.title}</h3>
                  <p className="research-description">{area.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Technical Interests */}
          <section className="section">
            <h2 className="section-title">Technical Interests</h2>
            <div className="interests-grid">
              {interests.map((interest, index) => (
                <motion.div
                  key={index}
                  className="interest-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <span className="interest-bullet">▸</span>
                  <span className="interest-text">{interest}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Education Highlights */}
          <section className="section">
            <h2 className="section-title">Academic Background</h2>
            <div className="education-highlights">
              <motion.div
                className="education-item"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="education-degree">
                  <h3>Master's in Computer Science</h3>
                  <span className="institution">Northeastern University</span>
                  <span className="period">2022 - 2023</span>
                </div>
                <div className="education-details">
                  <p>
                    Specialized in Data Engineering, Machine Learning, and
                    Human-Computer Interaction
                  </p>
                  <ul>
                    <li>
                      Teaching Assistant for Human-Computer Interaction
                      (Summer'23)
                    </li>
                    <li>
                      Teaching Assistant for Database Management Systems
                      (Fall'23)
                    </li>
                    <li>
                      Research Assistant for List Curator project (Summer'22 -
                      Fall'23)
                    </li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                className="education-item"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="education-degree">
                  <h3>Bachelor of Technology in Computer Science</h3>
                  <span className="institution">
                    Amrita School of Engineering
                  </span>
                  <span className="period">2015 - 2019</span>
                </div>
                <div className="education-details">
                  <p>
                    Focused on software engineering fundamentals and data
                    structures
                  </p>
                  <ul>
                    <li>Published research paper on Hadoop and NLP analysis</li>
                    <li>
                      Active participation in technical clubs and hackathons
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
