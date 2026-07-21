/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🟢 MASTER CONFIG — Everything in one place                ║
 * ║                                                             ║
 * ║  Edit this file to customize your entire GitHub profile    ║
 * ║  README. The script reads this and generates everything.   ║
 * ║  No manual editing of README.md needed.                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const CONFIG = {
  // ─── Identity ──────────────────────────────────────────
  identity: {
    name: "Oluwadare Daniel Anuoluwapo",
    title: "Full-Stack Engineer",
    tagline: "Building intelligent digital experiences — systems, AI, and product design.",
    handle: "Emerald-dev0",
    username: "Emerald-dev0",
    email: "danieloluwadare26@gmail.com",
    location: "Nigeria",
    available: true,
  },

  // ─── Social Links ─────────────────────────────────────
  social: {
    github: "https://github.com/Emerald-dev0",
    twitter: "https://x.com/dev_boy09",
    instagram: "https://instagram.com/emerald_dev1",
    tiktok: "https://tiktok.com/@emerald_dev1",
    portfolio: "https://dev-emerald-one.vercel.app/",
    linkedin: "https://linkedin.com/in/Emerald-dev0",
    email: "danieloluwadare26@gmail.com",
  },

  // ─── Brand / Visual Theme ──────────────────────────────
  theme: {
    primary: "10B981",
    background: "0f172a",
    text: "94a3b8",
    border: "30363d",
  },

  // ─── About Section ─────────────────────────────────────
  about: {
    paragraphs: [
      "I architect full-stack platforms, mobile experiences, and AI-powered tools that solve real problems. My approach is rooted in first principles — decompose until atomic truth emerges, then rebuild with clarity.",
      "Currently engineering distributed systems, crafting developer tooling, and contributing to open-source. I believe the best software feels inevitable — every edge case considered, every abstraction earned, every interaction intentional.",
    ],
    mantra: "Ship fast. Break nothing. Learn everything.",
    focusAreas: [
      "Full-Stack Engineering",
      "AI & Machine Learning",
      "Systems Architecture",
      "Mobile Development",
      "Open Source",
      "UI Engineering",
    ],
  },

  // ─── Tech Stack Categories ─────────────────────────────
  techStack: [
    {
      label: "Frontend",
      icons: "react,nextjs,ts,tailwind,css,html,js,redux",
    },
    {
      label: "Backend",
      icons: "nodejs,express,rust,python,go,graphql,apollo",
    },
    {
      label: "Mobile",
      icons: "flutter,dart,react,kotlin,swift",
    },
    {
      label: "Database & Infrastructure",
      icons: "postgres,mongodb,redis,docker,aws,gcp,cloudflare,supabase",
    },
    {
      label: "AI & Tools",
      icons: "py,tensorflow,vercel,git,githubactions,figma,postman,linux",
    },
  ],

  // ─── Featured Projects ────────────────────────────────
  projects: {
    mode: "pinned", // "pinned" | "featured" | "top" | "all"
    maxRepos: 6,
    featuredRepos: [],
    excludeRepos: ["Emerald-dev0", "Emerald-dev0.github.io"],
  },

  // ─── Goals / Roadmap ──────────────────────────────────
  goals: [
    { emoji: "🔭", label: "Open Source", description: "Ship tools that help other engineers build faster", progress: 40 },
    { emoji: "🧠", label: "AI Engineering", description: "Build intelligent agents & production ML pipelines", progress: 25 },
    { emoji: "⚡", label: "Systems Design", description: "Architect distributed systems that scale gracefully", progress: 35 },
    { emoji: "🌍", label: "Community", description: "Speak at 3 tech conferences this year", progress: 15 },
    { emoji: "📝", label: "Technical Writing", description: "Publish 12 engineering deep-dives", progress: 30 },
  ],

  // ─── Fun Facts ────────────────────────────────────────
  funFacts: [
    { icon: "🎯", fact: "I architect systems before writing a single line of code." },
    { icon: "📖", fact: "I read more documentation than social media." },
    { icon: "🔄", fact: "I rewrite projects that work — to make them elegant." },
    { icon: "☕", fact: "I debug best after the third coffee." },
    { icon: "🌱", fact: "I believe the best code is the code you don't have to write." },
  ],

  // ─── Footer ───────────────────────────────────────────
  footer: {
    signature: "Designed, engineered, and shipped with intent.",
  },

  // ─── File Paths ───────────────────────────────────────
  paths: {
    readme: "./README.md",
  },
};

export { CONFIG };
