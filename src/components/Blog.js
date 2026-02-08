import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaTag, FaExternalLinkAlt } from 'react-icons/fa';
import './Blog.css';

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Building Scalable Data Pipelines with Apache Airflow",
      excerpt: "A comprehensive guide to designing and implementing robust data pipelines using Apache Airflow, including best practices for monitoring and error handling.",
      content: "In this post, I'll share my experience building scalable data pipelines using Apache Airflow. We'll cover everything from basic DAG creation to advanced concepts like dynamic task generation and custom operators...",
      date: "2024-01-15",
      readTime: "8 min read",
      tags: ["Data Engineering", "Apache Airflow", "Python"],
      featured: true,
      image: "/observable.png"
    },
    {
      id: 2,
      title: "Real-time ML Model Deployment with AWS AutoGluon",
      excerpt: "Exploring the integration of AWS AutoGluon for automated machine learning workflows and real-time model deployment in production environments.",
      content: "AWS AutoGluon has revolutionized how we approach machine learning model development. In this article, I'll walk through the process of setting up automated ML pipelines...",
      date: "2023-12-20",
      readTime: "12 min read",
      tags: ["Machine Learning", "AWS", "AutoGluon"],
      featured: false,
      image: "/observable.png"
    },
    {
      id: 3,
      title: "Optimizing Spark Jobs for Better Performance",
      excerpt: "Practical techniques for improving Apache Spark job performance, including memory optimization, partition strategies, and monitoring best practices.",
      content: "Performance optimization in Spark is crucial for handling large-scale data processing efficiently. This post covers various optimization techniques I've learned from working with production Spark clusters...",
      date: "2023-11-10",
      readTime: "10 min read",
      tags: ["Apache Spark", "Performance", "Big Data"],
      featured: false,
      image: "/observable.png"
    },
    {
      id: 4,
      title: "Interactive Data Visualization with D3.js",
      excerpt: "Creating engaging and interactive data visualizations using D3.js, with examples from real-world projects and best practices for responsive design.",
      content: "Data visualization is a powerful tool for communicating insights. In this post, I'll share my experience building interactive dashboards using D3.js...",
      date: "2023-10-05",
      readTime: "15 min read",
      tags: ["Data Visualization", "D3.js", "JavaScript"],
      featured: false,
      image: "/observable.png"
    }
  ];

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="blog">
      <div className="blog-container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="page-title">Blog & Insights</h1>
          
          {/* Featured Post */}
          <section className="section">
            <h2 className="section-title">Featured Post</h2>
            {blogPosts.filter(post => post.featured).map((post, index) => (
              <motion.div
                key={post.id}
                className="featured-post"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="featured-post-image">
                  <img src={post.image} alt={post.title} />
                </div>
                <div className="featured-post-content">
                  <div className="post-meta">
                    <span className="post-date">
                      <FaCalendarAlt className="meta-icon" />
                      {formatDate(post.date)}
                    </span>
                    <span className="post-read-time">
                      <FaClock className="meta-icon" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="featured-post-title">{post.title}</h3>
                  <p className="featured-post-excerpt">{post.excerpt}</p>
                  <div className="post-tags">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="post-tag">
                        <FaTag className="tag-icon" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="read-more-btn">
                    <FaExternalLinkAlt />
                    <span>Read Full Article</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </section>

          {/* All Posts */}
          <section className="section">
            <h2 className="section-title">All Articles</h2>
            <div className="blog-grid">
              {blogPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="blog-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="blog-card-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                  <div className="blog-card-content">
                    <div className="post-meta">
                      <span className="post-date">
                        <FaCalendarAlt className="meta-icon" />
                        {formatDate(post.date)}
                      </span>
                      <span className="post-read-time">
                        <FaClock className="meta-icon" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <div className="post-tags">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="post-tag small">
                          <FaTag className="tag-icon" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="read-more-btn small">
                      <FaExternalLinkAlt />
                      <span>Read More</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Coming Soon */}
          <section className="section">
            <h2 className="section-title">Coming Soon</h2>
            <div className="coming-soon">
              <motion.div
                className="coming-soon-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3>More Articles in the Pipeline</h3>
                <p>I'm working on several new articles covering:</p>
                <ul>
                  <li>Advanced FastAPI patterns for microservices</li>
                  <li>Building real-time dashboards with WebSockets</li>
                  <li>Data pipeline monitoring and alerting strategies</li>
                  <li>Machine learning model versioning and deployment</li>
                </ul>
                <p>Stay tuned for more technical insights and tutorials!</p>
              </motion.div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog; 