// ─── Portfolio Data ────────────────────────────────────────────────────────────
// Single source of truth for all resume / portfolio content.

export const personalInfo = {
  name: 'Kasi Vandanapu',
  title: 'Senior / Staff AI Engineer',
  subtitle: 'Python · LLM Systems · Data & AI Infrastructure',
  tagline: 'Making production AI systems faster, cheaper, and easier to evaluate.',
  email: 'kasivisu3109@gmail.com',
  phone: '+1 (682) 247-7728',
  location: 'Brandon, FL 33510',
  linkedin: 'https://www.linkedin.com/in/kasivisu4/',
  github: 'https://github.com/kasivisu4',
  portfolio: 'https://kasivisu4.github.io',
  resumePdf: '/kasi_resume_2026_v2.pdf',
  summary:
    'Senior AI & Backend Engineer with 5+ years building production data and AI systems in Python. I work across LLM applications, agentic workflows, data engineering, and high-performance backend services — with a focus on making systems faster, cheaper, and easier to evaluate. Recent work includes reducing pipeline runtime by 60%, cutting LLM inference costs by 50%, and building evaluation infrastructure for Text2SQL and agentic systems.',
};

// Selected impact. Every figure here must be defensible in an interview —
// keep it tied to a specific workload, never a general system-wide claim.
export const stats = [
  { label: 'Pipeline runtime reduction', value: '60%' },
  { label: 'LLM inference cost cut', value: '50%' },
  { label: 'Spark job runtime cut', value: '30%' },
  { label: 'Years building Python systems', value: '5+' },
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
    github: 'https://github.com/kasivisu4/txt2sql-benchmark',
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
    github: 'https://github.com/yianan261/GeminiFrontend',
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
    github: 'https://github.com/Akhilasulgante/SharkTankInViz',
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
    live: 'https://observablehq.com/@kasivisu4/hsd-visualization',
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
    skills: ['Apache PySpark', 'Delta Lake', 'Apache Airflow', 'Databricks', 'ETL Pipelines', 'Streaming', 'Pandas', 'Apache Parquet', 'Snapshot Pipelines'],
  },
  {
    label: 'Interactive Data Platforms',
    color: 'rose',
    skills: ['DuckDB-WASM', 'Apache Arrow', 'Mosaic', 'Observable Plot', 'Columnar Storage', 'Pre-aggregation / OLAP Cubes', 'Crossfiltering', 'Predicate Pushdown', 'Query Profiling', 'WebAssembly'],
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
    skills: ['Tableau', 'D3.js', 'Vega-Lite', 'Interactive Dashboards'],
  },
];

// What I Build — the hero panel. Replaces self-rated proficiency percentages,
// which invite the question "97% according to what?" and carry no evidence.
// Four pillars, each naming the work rather than scoring it.
export const buildPillars = [
  {
    label: 'AI & Agentic Systems',
    color: 'violet',
    items: 'LLMs · LangGraph · Text2SQL · AI agents · evaluation',
  },
  {
    label: 'Backend & Data Platforms',
    color: 'cyan',
    items: 'Python · FastAPI · PySpark · MongoDB · Oracle · AWS · GCP',
  },
  {
    label: 'Performance Engineering',
    color: 'emerald',
    items: 'ETL optimization · query execution · vectorization · distributed processing',
  },
  {
    label: 'Analytics Systems',
    color: 'rose',
    items: 'Interactive analytics · DuckDB · Parquet · visualization · workload optimization',
  },
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
// Scored by lib/chatEngine.js — every intent is scored and the best wins, so
// listing order does not decide the answer.
//
//   phrases — multi-word, matched against the raw string (weight 4)
//   strong  — unambiguous whole-word terms for this intent only (weight 3)
//   terms   — supporting whole-word terms, may be shared across intents (1.5)
//
// Terms are matched on WORD BOUNDARIES, not substrings. Keep them whole words:
// a bare 'ai' here once hijacked "email", "available", "explain" and "training".
export const chatResponses = [
  {
    id: 'experience',
    phrases: ['work history', 'job history', 'career history', 'work for', 'works for', 'work at', 'works at', 'current employer'],
    strong: ['experience', 'career', 'virtusa', 'citi', 'citibank', 'infosys', 'employer', 'employment', 'job', 'role', 'position'],
    terms: ['work', 'worked', 'company', 'background', 'professional', 'year', 'senior', 'lead'],
    response:
      "Kasi has 5+ years of professional experience. Most recently as **Lead Python Developer at Virtusa** (consulting for Citi Bank), where he builds LLM-powered agentic systems with LangGraph and LangChain. Prior to that, he was a **Specialist Programmer at Infosys** building large-scale ETL pipelines on GCP and AWS for clients like Levi's, Kraft Heinz, and HCSC.",
  },
  {
    id: 'ai-llm',
    phrases: ['agentic workflow', 'agentic system', 'llm work'],
    strong: ['llm', 'langchain', 'langgraph', 'agentic', 'gpt', 'gemini', 'text2sql', 'autogluon', 'rag', 'agent'],
    terms: ['prompt', 'inference', 'reasoning', 'conversational', 'benchmark'],
    response:
      "Kasi is deeply specialized in LLM-powered agentic systems. At Citi Bank he built production agentic workflows using **LangGraph + LangChain** that dynamically generate data models and enable conversational data interaction. He also built a **Text2SQL benchmark framework** that reduced inference costs by 50%, and developed Wander Finds — an AI travel app using **Google Gemini** — at a hackathon in 2024.",
  },
  {
    id: 'python-backend',
    phrases: ['rest api'],
    strong: ['python', 'fastapi', 'microservice', 'backend', 'endpoint'],
    terms: ['api', 'rest', 'service', 'validation', 'vectorized'],
    response:
      "Python is Kasi's primary language (97% proficiency). He builds **production-grade FastAPI microservices** at Citi Bank for data extraction, validation, transformation, and loading. He also optimized data validation pipelines using vectorized operations, cutting execution time by **60%**.",
  },
  {
    id: 'data-engineering',
    phrases: ['data pipeline', 'data engineering', 'streaming pipeline'],
    strong: ['etl', 'pyspark', 'spark', 'airflow', 'databricks', 'pipeline', 'ingestion'],
    terms: ['data', 'engineering', 'streaming', 'batch', 'delta', 'pandas', 'gcp', 'warehouse'],
    response:
      "Kasi is a strong Data Engineer — he built 4 independent complex ETL pipelines using **Apache PySpark, Delta Lake, Databricks, and Apache Airflow** at Infosys, serving Levi's, Kraft Heinz, and HCSC. He also engineered a real-time GCP streaming pipeline (Pub/Sub + Cloud Run) that contributed to a **15% sales increase**.",
  },
  {
    id: 'projects',
    phrases: ['shark tank', 'wander finds', 'hate speech', 'side project'],
    strong: ['project', 'hackathon', 'wander', 'pyodide', 'xgboost'],
    terms: ['built', 'build', 'portfolio', 'demo', 'showcase', 'observable'],
    response:
      "Kasi's standout projects: **Wander Finds** (Gemini AI Hackathon '24) — AI travel recommendations with Gemini + Google Maps; **Text2SQL Benchmark** — open-source LLM evaluation framework; **Shark Tank Analysis** — interactive D3.js + Tableau dashboard; and **Hate Speech Detection** — real-time in-browser ML classifier using Pyodide + XGBoost.",
  },
  {
    id: 'skills',
    phrases: ['tech stack', 'core stack'],
    strong: ['skill', 'stack', 'expertise', 'proficiency', 'technology', 'certification', 'certified'],
    terms: ['tech', 'tool', 'framework', 'know', 'language'],
    response:
      "Core stack: **Python, FastAPI, LangChain/LangGraph, LLMs, PySpark, Airflow**. Cloud: **AWS + GCP**. DBs: **MongoDB, Oracle, PostgreSQL, DuckDB**. Data platforms: **DuckDB-WASM, Apache Parquet, Apache Arrow, Mosaic** — interactive analytics over a million rows with no backend. Visualization: **Tableau, D3.js, Observable Plot**. Also certified: PCAP™ Python Programmer and Google Cloud ML & AI. Full skill breakdown available in the Skills section!",
  },
  {
    id: 'education',
    phrases: ['teaching assistant', 'research assistant'],
    strong: ['education', 'university', 'degree', 'northeastern', 'amrita', 'master', 'bachelor', 'college', 'gpa', 'studied', 'study'],
    terms: ['school', 'academic', 'graduate', 'msc', 'btech'],
    response:
      "Kasi holds an **MS in Computer Science from Northeastern University** (2022–2023, San Francisco), where he was both a Teaching Assistant (DBMS + HCI) and Research Assistant. Before that, he completed his **Bachelor's in CS from Amrita School of Engineering** (2015–2019) in India.",
  },
  {
    id: 'contact',
    phrases: ['get in touch', 'reach out', 'open to work', 'looking for'],
    strong: ['contact', 'email', 'hire', 'hiring', 'linkedin', 'resume', 'cv', 'availability', 'available', 'phone'],
    terms: ['reach', 'connect', 'opportunity', 'relocate', 'remote'],
    response:
      "Kasi is open to senior/staff Python/AI engineering roles! Best way to reach him: **kasivisu3109@gmail.com** or connect on **LinkedIn**. You can also use the Contact section on this page to send a message directly.",
  },
  {
    id: 'research',
    phrases: ['research paper', 'call center', 'kisan call'],
    strong: ['publication', 'published', 'paper', 'hadoop', 'kisan', 'conference'],
    terms: ['research', 'nlp', 'academic'],
    response:
      "Kasi published a research paper titled **'Hadoop and NLP Based Analysis on Kisan Call Center (KCC) Data'** at the 2018 International Conference on Advances in Computing, Communication, and Informatics. The paper applies big data analytics and NLP to agricultural helpline data.",
  },

  // ── Writing: the DuckDB + Mosaic piece ──────────────────────────────────────
  // Split into three intents rather than one, so "what's a cube?" and "where can
  // I read it?" get genuinely different answers instead of the same blurb.
  {
    id: 'data-platforms',
    phrases: ['data platform', 'interactive analytics', 'in browser analytics', 'embedded analytics', 'million rows'],
    strong: ['duckdb', 'mosaic', 'parquet', 'arrow', 'columnar', 'crossfilter', 'crossfiltering', 'olap', 'wasm', 'webassembly'],
    terms: ['interactive', 'browser', 'analytics', 'dashboard', 'aggregation'],
    response:
      "This is Kasi's current focus. He built an **interactive analytics stack with no backend**: Apache Parquet for storage, **DuckDB** compiled to WebAssembly as the engine, and **Mosaic** as the coordinator between charts and the database. The live demo crossfilters **a million NYC taxi trips at 28–77 ms per frame** — drag a box on a map and three charts re-aggregate before your hand stops moving. **[Read the architecture write-up](/blog/how-mosaic-scales-interactive-aggregation/)**, or ask me how it stays fast.",
  },
  {
    id: 'mosaic-architecture',
    phrases: ['how does it work', 'how it works', 'under the hood', 'pre aggregation', 'stay fast', 'so fast', 'this fast', 'how fast', 'per frame'],
    strong: ['cube', 'preaggregation', 'preagg', 'coordinator', 'hover', 'frame', 'latency', 'pushdown'],
    terms: ['fast', 'architecture', 'query', 'queries', 'index', 'scan', 'performance'],
    response:
      "The trick is **when** the work happens. On `pointerenter` — before you click — Mosaic materialises index tables (**cubes**) crossing each chart's own buckets with every position the brush could take: three `CREATE TABLE` statements, 62/92/146 ms, paid while your hand is still moving. After that, **dragging is arithmetic, not aggregation** — a range-sum over the cube instead of a scan of a million rows. Each frame runs **three queries** (KPI tiles, dropoffs map, hour histogram); the map you're dragging is excluded, since a view is filtered by every selection except its own. Only the aggregate crosses the wire — **32 B, 891 KB, 576 B** — never the source rows.",
  },
  {
    id: 'writing',
    phrases: ['blog post', 'blog', 'article', 'write up', 'writeup', 'read more'],
    strong: ['writing', 'wrote', 'post', 'publish'],
    terms: ['read', 'piece'],
    response:
      "Kasi writes about data platform architecture. His latest — **\"A Million Rows, 30 Milliseconds a Frame\"** — covers using DuckDB over Parquet with Mosaic as a coordinator to build interactive analytics without a backend, including the enterprise pattern of snapshotting a transactional DB to Parquet on a nightly/weekly/quarterly cadence. **[Read the article](/blog/how-mosaic-scales-interactive-aggregation/)** — the demo in it is live and instrumented, so you can watch every query it runs.",
  },
];

export const chatFallback =
  "Great question! I'm a demo assistant for Kasi's portfolio. I can answer questions about his **experience**, **projects**, **skills**, **AI/LLM work**, **education**, or how to **contact** him. What would you like to know?";
