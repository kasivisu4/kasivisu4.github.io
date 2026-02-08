import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
} from "react-icons/fa";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt />,
      title: "Address",
      content: "2115 Lennox Dale Ln, Brandon, FL 33510",
      link: "https://maps.google.com/?q=2115+Lennox+Dale+Ln+Brandon+FL+33510",
    },
    {
      icon: <FaPhone />,
      title: "Phone",
      content: "+1 (682) 247-7728",
      link: "tel:+16822477728",
    },
    {
      icon: <FaEnvelope />,
      title: "Email",
      content: "kasivisu3109@gmail.com",
      link: "mailto:kasivisu3109@gmail.com",
    },
  ];

  const socialLinks = [
    {
      icon: <FaGithub />,
      name: "GitHub",
      url: "https://github.com/kasivisu4",
      color: "#333",
    },
    {
      icon: <FaLinkedin />,
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/kasivisu4/",
      color: "#0077b5",
    },
    {
      icon: <FaTwitter />,
      name: "Twitter",
      url: "https://twitter.com/kasi_vandanapu",
      color: "#1da1f2",
    },
    {
      icon: <FaFacebook />,
      name: "Facebook",
      url: "https://www.facebook.com/vandanapu.kasi/",
      color: "#1877f2",
    },
  ];

  return (
    <div className="contact">
      <div className="contact-container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="page-title">Get In Touch</h1>

          <div className="contact-content">
            {/* Contact Information */}
            <section className="section contact-info-section">
              <h2 className="section-title">Contact Information</h2>
              <div className="contact-info-grid">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={index}
                    className="contact-info-item"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="contact-icon">{info.icon}</div>
                    <div className="contact-details">
                      <h3>{info.title}</h3>
                      <a
                        href={info.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {info.content}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Social Links */}
            <section className="section social-section">
              <h2 className="section-title">Connect With Me</h2>
              <div className="social-grid">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ "--social-color": social.color }}
                  >
                    <div className="social-icon">{social.icon}</div>
                    <span className="social-name">{social.name}</span>
                  </motion.a>
                ))}
              </div>
            </section>

            {/* Contact Form */}
            <section className="section form-section">
              <h2 className="section-title">Send Me a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Your email"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Subject of your message"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Your message..."
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaEnvelope />
                  <span>Send Message</span>
                </motion.button>
              </form>
            </section>

            {/* Availability */}
            <section className="section availability-section">
              <h2 className="section-title">Availability</h2>
              <div className="availability-content">
                <motion.div
                  className="availability-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h3>Open to Opportunities</h3>
                  <p>
                    I'm currently open to new opportunities in data engineering,
                    machine learning, and full-stack development. Whether you
                    have a project in mind, want to collaborate on research, or
                    just want to connect, I'd love to hear from you!
                  </p>
                  <div className="availability-status">
                    <span className="status-indicator available"></span>
                    <span>Available for new opportunities</span>
                  </div>
                </motion.div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
