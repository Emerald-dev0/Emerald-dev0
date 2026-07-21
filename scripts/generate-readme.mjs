#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🟢 GENERATE-README.MJS                                    ║
 * ║  ─────────────────────────────────────────────────────────── ║
 * ║  Generates the COMPLETE README.md from scratch using:       ║
 * ║    - scripts/config.mjs (your identity, socials, brand)    ║
 * ║    - GitHub API (repos, pinned items)                       ║
 * ║                                                             ║
 * ║  Run:   node scripts/generate-readme.mjs                   ║
 * ║  Runs automatically via GitHub Actions daily.              ║
 * ║  Zero manual README editing required.                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const configPath = path.resolve(__dirname, "config.mjs");
const { CONFIG } = await import(configPath);
const { identity, social, theme, about, techStack, projects, goals, funFacts, footer } = CONFIG;

// ─── GitHub API ─────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "readme-generator/1.0",
  ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

async function fetchWithFallback(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchJSON(url);
    } catch (err) {
      if (i < retries - 1) {
        const wait = (i + 1) * 5000;
        console.warn(`⏳ Retrying in ${wait / 1000}s... (${err.message})`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

// ─── Data Fetching ─────────────────────────────────────────

async function fetchPinnedRepos(username) {
  if (!GITHUB_TOKEN) {
    console.warn("⚠️  No GITHUB_TOKEN — falling back to REST (sorted by stars)");
    return fetchTopRepos(username);
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name, description, url, stargazerCount, forkCount
              primaryLanguage { name color }
              updatedAt, homepageUrl, isArchived
              repositoryTopics(first: 5) { nodes { topic { name } } }
            }
          }
        }
      }
    }`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { username } }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status}`);
    const data = await res.json();
    const pinned = data?.data?.user?.pinnedItems?.nodes || [];
    return pinned.map(r => ({
      name: r.name,
      description: r.description || "No description provided",
      url: r.url,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage?.name || "N/A",
      langColor: r.primaryLanguage?.color || "#444",
      updatedAt: r.updatedAt,
      homepage: r.homepageUrl || "",
      topics: (r.repositoryTopics?.nodes || []).map(t => t.topic.name),
      archived: r.isArchived,
    }));
  } catch (err) {
    console.warn(`⚠️  GraphQL failed (${err.message}) — falling back to REST`);
    return fetchTopRepos(username);
  }
}

async function fetchTopRepos(username) {
  const repos = await fetchWithFallback(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&direction=desc`
  );
  return repos
    .filter(r => !r.fork && !projects.excludeRepos.includes(r.name) && !r.archived)
    .slice(0, projects.maxRepos)
    .map(r => ({
      name: r.name,
      description: r.description || "No description provided",
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language || "N/A",
      langColor: "#444",
      updatedAt: r.updated_at,
      homepage: r.homepage || "",
      topics: r.topics || [],
      archived: r.archived,
    }));
}

async function fetchUserStats(username) {
  try {
    const user = await fetchWithFallback(`https://api.github.com/users/${username}`);
    return {
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      avatar: user.avatar_url,
      bio: user.bio || "",
      company: user.company || "",
      blog: user.blog || "",
      location: user.location || "",
    };
  } catch {
    return null;
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  const mos = Math.floor(days / 30);
  if (mos < 12) return `${mos}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Section Generators ────────────────────────────────────

function generateHero() {
  const { primary } = theme;
  const title = encodeURIComponent(identity.title);
  const name = esc(identity.name);
  const tagline = identity.tagline;

  return `<!-- ================================================================ -->
<!--                    🟢 HERO                                       -->
<!-- ================================================================ -->

<p align="center">
  <a href="https://git.io/typing-svg">
    <img
      src="https://readme-typing-svg.demolab.com?font=Bricolage+Grotesque&weight=700&size=42&duration=3500&pause=800&color=${primary}&center=true&vCenter=true&width=900&height=100&lines=%F0%9F%9A%80+Hey%2C+I'm+${name.replace(/ /g, '+')};${title.replace(/ /g, '+')};Systems+%E2%80%A2+AI+%E2%80%A2+Product;Full-Stack+%2B+Mobile+Engineer;Open+source%2C+always."
      alt="Typing Animation"
      title="Typing Animation"
    />
  </a>
</p>

<p align="center" style="font-size: 1.15rem; line-height: 1.7; color: #${theme.text}; max-width: 640px; margin: 0 auto;">
  <em>
    "${tagline}"
  </em>
</p>

<br/>

<p align="center">
  <a href="${social.github}">
    <img src="https://img.shields.io/github/followers/${identity.username}?label=Follow&style=for-the-badge&logo=github&color=${primary}" />
  </a>
  <a href="${social.linkedin}">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="${social.twitter}">
    <img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" />
  </a>
  <a href="${social.portfolio}">
    <img src="https://img.shields.io/badge/Portfolio-0B0B0B?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="mailto:${social.email}">
    <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=${identity.username}&style=flat-square&color=${primary}" alt="Profile Views" />
  ${identity.available ? `<img src="https://img.shields.io/badge/Open_to_Collaborate-${primary}?style=flat-square&logo=handshake&logoColor=white" />` : ""}
  <img src="https://img.shields.io/badge/Building_in_public-0B0B0B?style=flat-square&logo=githubsponsors&logoColor=white" />
</p>

<br/>`;
}

function generateDivider() {
  return `<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png" width="100%" alt="divider"/>

<br/>`;
}

function generateAbout() {
  const paras = about.paragraphs.map(p => `    ${p}`).join("<br/><br/>\n");
  const pills = about.focusAreas.map(a =>
    `<img src="https://img.shields.io/badge/${encodeURIComponent(a)}-${theme.primary}?style=flat-square&logo=codeium&logoColor=white" alt="${esc(a)}"/>`
  ).join("\n  ");

  return `<!-- ================================================================ -->
<!--                    🟢 ABOUT                                      -->
<!-- ================================================================ -->

<h2 align="center">✦ About</h2>

<br/>

<p align="center" style="font-size: 1.05rem; line-height: 1.8; color: #${theme.text}; max-width: 720px; margin: 0 auto;">
  ${paras}
</p>

<br/>

<p align="center">
  <samp><i>⚡ ${about.mantra}</i></samp>
</p>

<br/>

<p align="center">
  ${pills}
</p>

<br/>`;
}

function generateTechStack() {
  let html = `<!-- ================================================================ -->
<!--                    🟢 TECH STACK                                -->
<!-- ================================================================ -->

<h2 align="center">✦ Stack</h2>

<br/>\n`;

  for (const cat of techStack) {
    html += `<h3 align="center">${cat.label}</h3>
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${cat.icons}&perline=8" />
  </a>
</p>

<br/>\n`;
  }

  return html;
}

function generateProjects(repos) {
  let html = `<!-- ================================================================ -->
<!--                    🟢 PROJECTS (DYNAMIC)                           -->
<!-- ================================================================ -->

<h2 align="center">✦ Projects</h2>

<br/>

<p align="center">
  <samp>↓ Auto-fetched from GitHub API ↓</samp>
</p>

<br/>\n`;

  if (repos.length === 0) {
    html += `<p align="center"><sub>No repositories found. Check your config.</sub></p>\n`;
  } else {
    html += `<table align="center" width="100%">\n`;
    for (let i = 0; i < repos.length; i += 2) {
      html += `  <tr>\n`;
      for (let j = i; j < i + 2 && j < repos.length; j++) {
        const r = repos[j];
        const desc = r.description.length > 80 ? esc(r.description.substring(0, 77) + "...") : esc(r.description);
        const updated = timeAgo(r.updatedAt);
        const tops = r.topics.slice(0, 3).map(t => esc(t)).join(" · ");

        html += `    <td align="center" width="50%" valign="top" style="padding: 6px;">
      <a href="${r.url}" style="text-decoration: none;">
        <table width="100%" cellpadding="14" cellspacing="0" style="border: 1px solid #${theme.border}; border-radius: 12px; background: #${theme.background}; margin: 4px 0;">
          <tr>
            <td valign="top">
              <strong style="color: #${theme.primary}; font-size: 1.05rem;">✦ ${esc(r.name)}</strong>
              <br/>
              <span style="color: #${theme.text}; font-size: 0.85rem; line-height: 1.6;">${desc}</span>
              <br/><br/>
              <span style="display: inline-block; background: #1e293b; color: #${theme.primary}; font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; margin: 2px;">● ${esc(r.language)}</span>
              <span style="color: #64748b; font-size: 0.8rem; margin-left: 8px;">⭐ ${r.stars}</span>
              <span style="color: #64748b; font-size: 0.8rem; margin-left: 8px;">🍴 ${r.forks}</span>
              <span style="color: #64748b; font-size: 0.8rem; margin-left: 8px;">📅 ${updated}</span>
              ${tops ? `<br/><span style="color: #475569; font-size: 0.7rem;">🏷️ ${tops}</span>` : ""}
              ${r.homepage ? `<br/><a href="${r.homepage}" style="color: #${theme.primary}; font-size: 0.75rem;">🔗 ${esc(r.homepage)}</a>` : ""}
            </td>
          </tr>
        </table>
      </a>
    </td>\n`;
      }
      if (i + 1 >= repos.length) html += `    <td width="50%"></td>\n`;
      html += `  </tr>\n`;
    }
    html += `</table>\n`;
  }

  return html;
}

function generateAnalytics() {
  const u = identity.username;
  const p = theme.primary;
  const bg = theme.background;

  return `<!-- ================================================================ -->
<!--                    🟢 GITHUB ANALYTICS                            -->
<!-- ================================================================ -->

<h2 align="center">✦ Analytics</h2>

<br/>

<p align="center">
  <table align="center">
    <tr>
      <td>
        <a href="${social.github}">
          <img
            src="https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&count_private=true&include_all_commits=true&theme=vue-dark&bg_color=${bg}&hide_border=true&border_radius=12&icon_color=${p}&title_color=${p}&text_color=${theme.text}"
            alt="GitHub Stats"
            width="400"
          />
        </a>
      </td>
      <td>
        <a href="https://git.io/streak-stats">
          <img
            src="https://github-readme-streak-stats.herokuapp.com?user=${u}&theme=vue-dark&hide_border=true&background=${bg}&stroke=${p}&ring=${p}&fire=${p}&currStreakNum=ffffff&sideNums=${p}&currStreakLabel=${p}&sideLabels=${theme.text}&border_radius=12"
            alt="Streak Stats"
            width="400"
          />
        </a>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <a href="${social.github}">
          <img
            src="https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&theme=vue-dark&bg_color=${bg}&hide_border=true&border_radius=12&title_color=${p}&text_color=${theme.text}"
            alt="Top Languages"
            width="830"
          />
        </a>
      </td>
    </tr>
  </table>
</p>

<br/>`;
}

function generateContributionGraph() {
  const p = theme.primary;

  return `<!-- ================================================================ -->
<!--                    🟢 CONTRIBUTION GRAPH                          -->
<!-- ================================================================ -->

<h2 align="center">✦ Contribution Graph</h2>

<br/>

<p align="center">
  <a href="https://github.com/ashutosh00710/github-readme-activity-graph">
    <img
      src="https://github-readme-activity-graph.vercel.app/graph?username=${identity.username}&theme=vue&bg_color=${theme.background}&color=${p}&line=${p}&point=ffffff&area=true&area_color=${p}&hide_border=true&custom_title=Contribution%20Graph&radius=12"
      alt="Activity Graph"
      width="900"
    />
  </a>
</p>

<br/>`;
}

function generateSnake() {
  const u = identity.username;

  return `<!-- ================================================================ -->
<!--                    🟢 CONTRIBUTION SNAKE                          -->
<!-- ================================================================ -->

<h2 align="center">✦ Activity Snake</h2>

<br/>

<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://raw.githubusercontent.com/${u}/${u}/output/snake-dark.svg"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://raw.githubusercontent.com/${u}/${u}/output/snake.svg"
    />
    <img
      alt="Contribution Snake Animation"
      src="https://raw.githubusercontent.com/${u}/${u}/output/snake.svg"
      width="900"
    />
  </picture>
</p>

<br/>`;
}

function generateGoals() {
  let items = goals.map(g =>
    `<tr>
      <td align="center" width="33%" style="padding: 16px;">
        <table width="100%" style="border: 1px solid #${theme.border}; border-radius: 12px; background: #${theme.background}; padding: 14px;">
          <tr><td align="center">
            <span style="font-size: 2rem;">${g.emoji}</span>
            <br/>
            <b style="color: #${theme.primary};">${esc(g.label)}</b>
            <br/>
            <sub style="color: #${theme.text};">${esc(g.description)}</sub>
            <br/><br/>
            <img src="https://progress-bar.dev/${g.progress}/?title=progress&width=200&color=${theme.primary}" alt="${g.progress}%" />
          </td></tr>
        </table>
      </td>
    </tr>`
  ).join("\n");

  return `<!-- ================================================================ -->
<!--                    🟢 CURRENTLY BUILDING                          -->
<!-- ================================================================ -->

<h2 align="center">✦ Now Building</h2>

<br/>

<p align="center">
  <table align="center" width="720">
${items}
  </table>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/2026%20Focus-Open%20Source%20×%20AI%20×%20Systems-${theme.primary}?style=for-the-badge&labelColor=${theme.background}" />
</p>

<br/>`;
}

function generateFunFacts() {
  const items = funFacts.map(f =>
    `${f.icon} &nbsp;${esc(f.fact)}`
  ).join("<br />\n    ");

  return `<!-- ================================================================ -->
<!--                    🟢 FUN FACTS                                   -->
<!-- ================================================================ -->

<h2 align="center">✦ Beyond Code</h2>

<br/>

<p align="center">
  <samp>
    ${items}
  </samp>
</p>

<br/>`;
}

function generateConnect() {
  return `<!-- ================================================================ -->
<!--                    🟢 CONNECT                                     -->
<!-- ================================================================ -->

<h2 align="center">✦ Connect</h2>

<br/>

<p align="center">
  <a href="${social.github}">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="${social.linkedin}">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="${social.twitter}">
    <img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" />
  </a>
  <a href="${social.instagram}">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" />
  </a>
  <a href="${social.tiktok}">
    <img src="https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white" />
  </a>
</p>

<p align="center">
  <a href="${social.portfolio}">
    <img src="https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="mailto:${social.email}">
    <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
  <a href="${social.github.replace('https://github.com/', 'https://discord.com/users/')}">
    <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  </a>
  <a href="https://dev.to/${identity.username}">
    <img src="https://img.shields.io/badge/dev.to-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white" />
  </a>
</p>

<br/>`;
}

function generateFooter() {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

  return `<!-- ================================================================ -->
<!--                    🟢 FOOTER                                      -->
<!-- ================================================================ -->

<p align="center">
  <samp>
    <b>${esc(footer.signature)}</b><br />
    <sub>This profile is alive — updated daily via GitHub Actions.</sub>
    <br/><br/>
    <sub style="color: #555;">
      <strong>Last refreshed:</strong> ${now} UTC
    </sub>
  </samp>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2&height=100&section=footer" width="100%" />
</p>`;
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║   🟢 README Generator                        ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log(`   Profile:  ${identity.name} (@${identity.username})`);
  console.log(`   Token:    ${GITHUB_TOKEN ? "✓ Set" : "✗ Not set (anonymous mode, no GraphQL)"}`);
  console.log("");

  console.time("⏱  Total");
  console.time("📦 Fetch");

  // Fetch repos based on mode
  let repos;
  switch (projects.mode) {
    case "pinned":
      repos = await fetchPinnedRepos(identity.username);
      break;
    case "featured":
      repos = await fetchTopRepos(identity.username);
      repos = repos.filter(r => projects.featuredRepos.includes(r.name));
      break;
    case "top":
      repos = await fetchTopRepos(identity.username);
      break;
    default:
      repos = await fetchPinnedRepos(identity.username);
  }

  console.timeEnd("📦 Fetch");
  console.log(`   Repos:    ${repos.length} fetched`);

  console.time("🏗️  Generate");

  // Build the complete README
  const readme = `<!--
╔══════════════════════════════════════════════════════════════════╗
║  🟢 DYNAMIC GITHUB PROFILE README                               ║
║  ─────────────────────────────────────────────────────────────── ║
║  This README is AUTO-GENERATED by scripts/generate-readme.mjs   ║
║  Do NOT edit manually — changes will be overwritten.            ║
║  Edit scripts/config.mjs instead.                              ║
╚══════════════════════════════════════════════════════════════════╝
-->

${generateHero()}
${generateDivider()}
${generateAbout()}
${generateDivider()}
${generateTechStack()}
${generateDivider()}
${generateProjects(repos)}
${generateDivider()}
${generateAnalytics()}
${generateContributionGraph()}
${generateDivider()}
${generateSnake()}
${generateDivider()}
${generateGoals()}
${generateDivider()}
${generateFunFacts()}
${generateDivider()}
${generateConnect()}
${generateFooter()}
`;

  console.timeEnd("🏗️  Generate");

  // Write
  const readmePath = path.resolve(ROOT, "./README.md");
  fs.writeFileSync(readmePath, readme, "utf-8");
  console.log(`✅ README.md generated (${(readme.length / 1024).toFixed(1)} KB)`);
  console.timeEnd("⏱  Total");

  console.log("");
  console.log("📊 Summary:");
  console.log(`   Projects:   ${repos.length}`);
  console.log(`   Total ⭐:   ${repos.reduce((s, r) => s + r.stars, 0)}`);
  console.log(`   Total 🍴:   ${repos.reduce((s, r) => s + r.forks, 0)}`);
  console.log(`   Languages:  ${[...new Set(repos.map(r => r.language))].join(", ")}`);
  console.log("");
  console.log("✨ Profile README is live and dynamic.");
}

main().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
