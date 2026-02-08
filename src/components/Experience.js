import React from "react";
import { motion } from "framer-motion";
import { FaBriefcase, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import "./Experience.css";

const Experience = () => {
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

  const education = [
    {
      id: 1,
      degree: "Master's in Computer Science",
      school: "Northeastern University",
      period: "Jan'22 – Dec'23",
      location: "San Francisco, CA",
      details: [
        "Teaching Assistant - Human-Computer Interaction (Summer'23)",
        "Teaching Assistant - Database Management Systems (Fall'23)",
        "Research Assistant - List Curator (Summer'22 - Fall'23)",
      ],
    },
    {
      id: 2,
      degree: "Bachelor of Technology in Computer Science",
      school: "Amrita School of Engineering",
      period: "Aug'15 – May'19",
      location: "Coimbatore, India",
      details: [],
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

  const certifications = [
    "PCAP™ – Certified Associate Python Programmer",
    "Smart Analytics, ML, and AI on GCP",
  ];

  return (
    <div className="experience">
      <div className="experience-container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="page-title">Experience & Education</h1>

          {/* Employment Section */}
          <section className="section">
            <h2 className="section-title">
              <FaBriefcase className="section-icon" />
              Employment
            </h2>
            <div className="timeline">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  className="timeline-item"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="timeline-content">
                    <div className="job-header">
                      <h3 className="job-title">{exp.title}</h3>
                      <div className="job-meta">
                        <span className="company">{exp.company}</span>
                        <div className="job-details">
                          <span className="period">
                            <FaCalendarAlt className="meta-icon" />
                            {exp.period}
                          </span>
                          <span className="location">
                            <FaMapMarkerAlt className="meta-icon" />
                            {exp.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ul className="achievements">
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section className="section">
            <h2 className="section-title">
              <FaBriefcase className="section-icon" />
              Education
            </h2>
            <div className="timeline">
              {education.map((edu, index) => (
                <motion.div
                  key={edu.id}
                  className="timeline-item"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: (index + experiences.length) * 0.2,
                  }}
                >
                  <div className="timeline-content">
                    <div className="job-header">
                      <h3 className="job-title">{edu.degree}</h3>
                      <div className="job-meta">
                        <span className="company">{edu.school}</span>
                        <div className="job-details">
                          <span className="period">
                            <FaCalendarAlt className="meta-icon" />
                            {edu.period}
                          </span>
                          <span className="location">
                            <FaMapMarkerAlt className="meta-icon" />
                            {edu.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    {edu.details.length > 0 && (
                      <ul className="achievements">
                        {edu.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Skills Section */}
          <section className="section">
            <h2 className="section-title">Skills & Certifications</h2>
            <div className="skills-grid">
              {Object.entries(skills).map(([category, skillList], index) => (
                <motion.div
                  key={category}
                  className="skill-category"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <h3 className="skill-category-title">{category}</h3>
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

            <motion.div
              className="certifications"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="certifications-title">Certifications</h3>
              <div className="certification-list">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="certification-item">
                    <span className="certification-badge">✓</span>
                    {cert}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default Experience;
