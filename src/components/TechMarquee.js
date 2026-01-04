import React from 'react';
import './TechMarquee.css';
import { 
  FaPython, FaJs, FaJava, FaAws, FaDocker, FaDatabase, 
  FaReact, FaHtml5, FaCss3Alt, FaGitAlt 
} from 'react-icons/fa';
import { SiApachespark, SiPandas, SiTensorflow, SiMongodb, SiPostgresql, SiGooglecloud } from 'react-icons/si';

const TechMarquee = () => {
  const techs = [
    { name: "Python", icon: <FaPython /> },
    { name: "Spark", icon: <SiApachespark /> },
    { name: "AWS", icon: <FaAws /> },
    { name: "GCP", icon: <SiGooglecloud /> },
    { name: "React", icon: <FaReact /> },
    { name: "FastAPI", icon: <FaPython /> },
    { name: "MongoDB", icon: <SiMongodb /> },
    { name: "PostgreSQL", icon: <SiPostgresql /> },
    { name: "Pandas", icon: <SiPandas /> },
    { name: "Docker", icon: <FaDocker /> },
    { name: "JavaScript", icon: <FaJs /> },
    { name: "Java", icon: <FaJava /> },
  ];

  return (
    <div className="marquee-container">
      <div className="marquee-track">
        {/* Render twice for seamless loop */}
        {[...techs, ...techs].map((tech, index) => (
          <div className="marquee-item" key={index}>
            <span className="marquee-icon">{tech.icon}</span>
            <span className="marquee-name">{tech.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechMarquee;
