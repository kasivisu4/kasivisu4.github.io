// ─── Portfolio Data ────────────────────────────────────────────────────────────
// Single source of truth for all resume / portfolio content.

export const personalInfo = {
  name: 'Kasi Vandanapu',
  title: 'Senior Python Developer & AI Engineer',
  subtitle: 'LLM-Powered Agentic Systems · FastAPI · Scalable Data Platforms',
  tagline: 'Building production-grade AI systems that think, reason, and deliver.',
  email: 'kasivisu3109@gmail.com',
  phone: '+1 (682) 247-7728',
  location: 'Brandon, FL 33510',
  linkedin: 'https://www.linkedin.com/in/kasivisu4/',
  github: 'https://github.com/kasivisu4',
  portfolio: 'https://kasivisu4.github.io',
  resumePdf: '/kasi_resume_2026_v2.pdf',
  summary:
    'Senior Python Developer & Data Engineer with 5+ years of experience building scalable, cloud-native data platforms. Expert in Python, FastAPI, and Large Language Models (LLMs). Proven track record designing microservices, leading small teams, optimizing ETL pipelines by up to 60%, and delivering actionable insights through data-driven and agentic AI solutions.',
};

export const stats = [
  { label: 'Years Experience', value: '5+' },
  { label: 'ETL Runtime Reduced', value: '60%' },
  { label: 'Inference Cost Cut', value: '50%' },
  { label: 'Clients Served', value: '4+' },
];

export const experiences = [
  {
    id: 1,
    title: 'Lead Python Developer',
    company: 'Virtusa · Consulting for Citi Bank',
    period: 'Jun 2024 – Present',
    location: 'Tampa, FL (Remote)',
    type: 'current',
    color: 'cyan',
    tags: ['LangGraph', 'LangChain', 'FastAPI', 'LLMs', 'MongoDB', 'AutoGluon'],
    achievements: [
      'Developed LLM-powered agentic workflows within Maphub using LangGraph, LangChain, and LLMs to dynamically generate data models, configure UI elements, and enable conversational data interactions.',
      'Designed and implemented microservices with REST APIs using FastAPI to extract, validate, transform, and load data into MongoDB and Oracle databases, supporting inputs from XLSX file and database sources.',
      'Built Text2SQL benchmark framework to evaluate and optimize LLM performance on complex enterprise schemas using EX (Execution Accuracy) and QAS (Query Affinity Score) metrics.',
      'Optimized schema dump token consumption via intelligent pruning, compression, and selective retrieval — reducing context length and inference costs by 50% while maintaining query accuracy.',
      'Integrated real-time ML training and inference using AWS AutoGluon, enabling a fully UI-driven workflow for training, versioning, and deploying live prediction models in Maphub Data Studio.',
      'Migrated data validation scripts to Python with vectorized operations, reducing execution time by 60%, deployed as a scalable microservice.',
    ],
  },
  {
    id: 2,
    title: 'Specialist Programmer',
    company: 'Infosys',
    period: 'May 2019 – Dec 2021',
    location: 'Hyderabad, India',
    type: 'past',
    color: 'violet',
    tags: ['PySpark', 'GCP', 'Pub/Sub', 'Delta Lake', 'Airflow', 'Databricks'],
    achievements: [
      'Engineered a scalable streaming data pipeline on GCP using Pub/Sub and Cloud Run for automated data ingestion and processing, enabling real-time store analytics and contributing to a 15% increase in sales.',
      'Built and managed independently four complex ETL batch data pipelines using Apache PySpark, Delta Lake, Databricks, Apache Airflow, and AWS services, serving three clients: Levi\'s, Kraft Heinz, and HCSC.',
      'Optimized data processing performance and resource utilization by strategically implementing window functions, leading to a 30% reduction in Spark job runtime and 15% decrease in cluster memory usage.',
    ],
  },
];

export const projects = [
  {
    id: 1,
    title: 'Text2SQL Benchmark',
    subtitle: 'Open-Source Framework',
    year: '2024–2025',
    description:
      'Open-source evaluation framework for testing LLM performance on complex enterprise SQL schemas. Features composite scoring with EX + QAS metrics and intent-aware column selection.',
    longDescription:
      'Built to address a real pain point at Citi Bank — existing Text2SQL benchmarks failed on enterprise schemas with hundreds of tables. The framework includes a composite scoring system (Execution Accuracy + Query Affinity Score), intelligent schema pruning that reduces token usage by 50%, and intent-aware column selection that significantly improves query precision on multi-schema databases.',
    technologies: ['Python', 'LLMs', 'SQLite', 'FastAPI', 'LangChain'],
    tags: ['AI/LLM', 'Open Source'],
    github: 'https://github.com/kasivisu4',
    live: null,
    featured: true,
    highlight: 'cyan',
    metrics: ['50% token reduction', 'EX + QAS scoring', 'Enterprise schemas'],
  },
  {
    id: 2,
    title: 'Wander Finds',
    subtitle: 'Gemini AI Hackathon 2024',
    year: '2024',
    description:
      'AI-driven travel app that generates hyper-personalized travel recommendations using Gemini, Google Maps, and location-aware context.',
    longDescription:
      'Built during Google\'s Gemini AI Hackathon. The app combines Gemini\'s multimodal reasoning with Google Maps Places API and Firebase to deliver context-aware, location-sensitive travel itineraries. LangChain orchestrates multi-step reasoning chains that factor in user preferences, real-time location, and crowd-sourced activity data.',
    technologies: ['Flutter', 'Firebase', 'LangChain', 'Gemini', 'Google Maps API'],
    tags: ['AI/LLM', 'Hackathon'],
    github: 'https://github.com/kasivisu4/wander-finds',
    live: null,
    featured: true,
    highlight: 'violet',
    metrics: ['Gemini multimodal', 'Location-aware AI', 'Hackathon winner'],
  },
  {
    id: 3,
    title: 'Shark Tank Analysis',
    subtitle: 'Interactive Data Dashboard',
    year: '2023',
    description:
      'Interactive D3.js + Tableau dashboard analyzing entrepreneur participation, valuation trends, and deal patterns across all Shark Tank seasons.',
    longDescription:
      'Built as a capstone for Northeastern\'s Data Visualization course. Uses D3.js force-directed graphs, choropleth maps, and Tableau for advanced trend analysis across industries, states, and deal structures. The dashboard reveals non-obvious patterns in what industries attract which sharks and how valuations vary geographically.',
    technologies: ['D3.js', 'JavaScript', 'Tableau', 'Python', 'Pandas'],
    tags: ['Data Viz', 'Analytics'],
    github: 'https://github.com/kasivisu4/shark-tank-analysis',
    live: null,
    featured: false,
    highlight: 'blue',
    metrics: ['All 15 seasons', 'Geographic heatmaps', 'D3.js force graphs'],
  },
  {
    id: 4,
    title: 'Hate Speech Detection',
    subtitle: 'In-Browser ML Classifier',
    year: '2022',
    description:
      'Real-time hate speech and offensive language detector running entirely in the browser using Pyodide — no server required.',
    longDescription:
      'Deployed on Observable as a fully client-side ML pipeline. XGBoost + TF-IDF runs in WebAssembly via Pyodide, enabling real-time text classification into hate, offensive, or neutral categories without any backend calls. The project demonstrates that production-grade ML inference can be democratized for zero-infrastructure deployment.',
    technologies: ['Python', 'XGBoost', 'TF-IDF', 'Pyodide', 'JavaScript', 'Observable'],
    tags: ['ML', 'NLP'],
    github: 'https://github.com/kasivisu4/hate-speech-detection',
    live: 'https://observablehq.com/@kasivisu4/hate-speech-detection',
    featured: false,
    highlight: 'pink',
    metrics: ['Zero backend', 'WASM inference', 'Real-time classification'],
  },
];

export const skillGroups = [
  {
    label: 'Core Languages',
    color: 'cyan',
    skills: ['Python', 'JavaScript', 'Java', 'Bash', 'SQL', 'C'],
  },
  {
    label: 'AI / LLM Stack',
    color: 'violet',
    skills: ['LangChain', 'LangGraph', 'LLMs', 'Prompt Engineering', 'Text2SQL', 'AWS AutoGluon', 'XGBoost', 'TF-IDF', 'Pyodide'],
  },
  {
    label: 'APIs & Microservices',
    color: 'blue',
    skills: ['FastAPI', 'REST APIs', 'Microservices', 'XLSX Processing', 'Data Validation'],
  },
  {
    label: 'Data Engineering',
    color: 'emerald',
    skills: ['Apache PySpark', 'Delta Lake', 'Apache Airflow', 'Databricks', 'ETL Pipelines', 'Streaming', 'Pandas'],
  },
  {
    label: 'Cloud Platforms',
    color: 'orange',
    skills: ['AWS', 'GCP', 'Pub/Sub', 'Cloud Run', 'BigQuery', 'Cloud Build', 'Kubernetes'],
  },
  {
    label: 'Databases',
    color: 'pink',
    skills: ['MongoDB', 'Oracle', 'MySQL', 'PostgreSQL', 'DuckDB', 'SQLite'],
  },
  {
    label: 'Visualization',
    color: 'yellow',
    skills: ['Tableau', 'D3.js', 'Vega-Lite'],
  },
];

// Key proficiencies displayed as animated rings in the hero skills panel
export const coreProfiles = [
  { name: 'Python', pct: 97 },
  { name: 'FastAPI', pct: 93 },
  { name: 'LLMs / LangChain', pct: 90 },
  { name: 'Data Engineering', pct: 88 },
  { name: 'Cloud (AWS/GCP)', pct: 85 },
];

export const education = [
  {
    id: 1,
    degree: "Master's in Computer Science",
    school: 'Northeastern University',
    period: 'Jan 2022 – Dec 2023',
    location: 'San Francisco, CA',
    gpa: null,
    roles: [
      'Teaching Assistant — Database Management Systems (Fall \'23)',
      'Teaching Assistant — Human-Computer Interaction (Summer \'23)',
      'Research Assistant — List Curator (Summer \'22 – Fall \'23)',
    ],
  },
  {
    id: 2,
    degree: 'Bachelor of Technology in Computer Science',
    school: 'Amrita School of Engineering',
    period: 'Aug 2015 – May 2019',
    location: 'Coimbatore, India',
    gpa: null,
    roles: [],
  },
];

export const certifications = [
  { name: 'PCAP™ — Certified Associate Python Programmer', issuer: 'Python Institute', icon: '🐍' },
  { name: 'Smart Analytics, ML, and AI on GCP', issuer: 'Google Cloud', icon: '☁️' },
];

export const publications = [
  {
    id: 1,
    title: 'Hadoop and Natural Language Processing Based Analysis on Kisan Call Center (KCC) Data',
    authors: 'Vandanapu, K.',
    conference: '2018 International Conference on Advances in Computing, Communication, and Informatics',
    year: '2018',
    doi: '#',
  },
];

// ─── AI Chat Knowledge Base ───────────────────────────────────────────────────
// The chat widget uses these for mock responses. Replace with real API when ready.
export const chatResponses = [
  {
    patterns: ['experience', 'work', 'job', 'career', 'company', 'virtusa', 'citi', 'infosys'],
    response:
      "Kasi has 5+ years of professional experience. Most recently as **Lead Python Developer at Virtusa** (consulting for Citi Bank), where he builds LLM-powered agentic systems with LangGraph and LangChain. Prior to that, he was a **Specialist Programmer at Infosys** building large-scale ETL pipelines on GCP and AWS for clients like Levi's, Kraft Heinz, and HCSC.",
  },
  {
    patterns: ['llm', 'langchain', 'langgraph', 'agent', 'agentic', 'gpt', 'gemini', 'ai'],
    response:
      "Kasi is deeply specialized in LLM-powered agentic systems. At Citi Bank he built production agentic workflows using **LangGraph + LangChain** that dynamically generate data models and enable conversational data interaction. He also built a **Text2SQL benchmark framework** that reduced inference costs by 50%, and developed Wander Finds — an AI travel app using **Google Gemini** — at a hackathon in 2024.",
  },
  {
    patterns: ['python', 'fastapi', 'api', 'microservice', 'rest', 'backend'],
    response:
      "Python is Kasi's primary language (97% proficiency). He builds **production-grade FastAPI microservices** at Citi Bank for data extraction, validation, transformation, and loading. He also optimized data validation pipelines using vectorized operations, cutting execution time by **60%**.",
  },
  {
    patterns: ['data', 'pipeline', 'etl', 'spark', 'pyspark', 'airflow', 'databricks', 'engineering'],
    response:
      "Kasi is a strong Data Engineer — he built 4 independent complex ETL pipelines using **Apache PySpark, Delta Lake, Databricks, and Apache Airflow** at Infosys, serving Levi's, Kraft Heinz, and HCSC. He also engineered a real-time GCP streaming pipeline (Pub/Sub + Cloud Run) that contributed to a **15% sales increase**.",
  },
  {
    patterns: ['project', 'wander', 'finds', 'hackathon', 'portfolio', 'shark', 'tank', 'hate', 'speech'],
    response:
      "Kasi's standout projects: **Wander Finds** (Gemini AI Hackathon '24) — AI travel recommendations with Gemini + Google Maps; **Text2SQL Benchmark** — open-source LLM evaluation framework; **Shark Tank Analysis** — interactive D3.js + Tableau dashboard; and **Hate Speech Detection** — real-time in-browser ML classifier using Pyodide + XGBoost.",
  },
  {
    patterns: ['skill', 'tech', 'stack', 'know', 'tool', 'framework'],
    response:
      "Core stack: **Python, FastAPI, LangChain/LangGraph, LLMs, PySpark, Airflow**. Cloud: **AWS + GCP**. DBs: **MongoDB, Oracle, PostgreSQL, DuckDB**. Visualization: **Tableau, D3.js**. Also certified: PCAP™ Python Programmer and Google Cloud ML & AI. Full skill breakdown available in the Skills section!",
  },
  {
    patterns: ['education', 'university', 'degree', 'northeastern', 'masters', 'school', 'college'],
    response:
      "Kasi holds an **MS in Computer Science from Northeastern University** (2022–2023, San Francisco), where he was both a Teaching Assistant (DBMS + HCI) and Research Assistant. Before that, he completed his **Bachelor's in CS from Amrita School of Engineering** (2015–2019) in India.",
  },
  {
    patterns: ['contact', 'reach', 'hire', 'email', 'available', 'open'],
    response:
      "Kasi is open to senior/staff Python/AI engineering roles! Best way to reach him: **kasivisu3109@gmail.com** or connect on **LinkedIn**. You can also use the Contact section on this page to send a message directly.",
  },
  {
    patterns: ['publication', 'research', 'paper', 'hadoop', 'nlp', 'kisan'],
    response:
      "Kasi published a research paper titled **'Hadoop and NLP Based Analysis on Kisan Call Center (KCC) Data'** at the 2018 International Conference on Advances in Computing, Communication, and Informatics. The paper applies big data analytics and NLP to agricultural helpline data.",
  },
];

export const chatFallback =
  "Great question! I'm a demo assistant for Kasi's portfolio. I can answer questions about his **experience**, **projects**, **skills**, **AI/LLM work**, **education**, or how to **contact** him. What would you like to know?";
