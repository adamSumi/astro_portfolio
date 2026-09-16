import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

// Dynamically detect GitHub Actions repository and owner with clean fallbacks
const githubRepository = process.env.GITHUB_REPOSITORY?.trim();
const [ghOwner, ghRepo] = githubRepository ? githubRepository.split('/') : [];

const repoOwner = (process.env.GITHUB_REPOSITORY_OWNER || ghOwner || 'adamSumi').trim();
const repoName = (process.env.GITHUB_REPOSITORY_NAME || ghRepo || 'astro_portfolio').trim();
const isUserPages = repoName.toLowerCase() === `${repoOwner.toLowerCase()}.github.io`;

// Check if a custom domain CNAME is present in public/ or root
let cnameDomain = '';
if (fs.existsSync('./public/CNAME')) {
  cnameDomain = fs.readFileSync('./public/CNAME', 'utf8').trim().split('\n')[0].trim();
} else if (fs.existsSync('./CNAME')) {
  cnameDomain = fs.readFileSync('./CNAME', 'utf8').trim().split('\n')[0].trim();
}

const isCustomDomain = Boolean(cnameDomain || process.env.CUSTOM_DOMAIN);
const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);

// Determine site URL:
// 1. Explicit SITE_URL environment variable
// 2. Custom domain from CNAME or CUSTOM_DOMAIN env
// 3. Dynamic GitHub Pages user URL: https://<repoOwner>.github.io
const defaultPagesSite = `https://${repoOwner}.github.io`;
const customDomainSite = cnameDomain
  ? `https://${cnameDomain}`
  : (process.env.CUSTOM_DOMAIN
      ? (process.env.CUSTOM_DOMAIN.startsWith('http') ? process.env.CUSTOM_DOMAIN : `https://${process.env.CUSTOM_DOMAIN}`)
      : 'https://example.com');

const site = process.env.SITE_URL || (isCustomDomain ? customDomainSite : defaultPagesSite);

// Determine base path:
// 1. Explicit BASE_PATH environment variable
// 2. GitHub Pages repository subpath (/<repoName>) unless it's a custom domain, a user page (<owner>.github.io), or local dev
const base = process.env.BASE_PATH || (isGitHubActions && !isCustomDomain && !isUserPages ? `/${repoName}` : '/');

export default defineConfig({
  site,
  base,

  integrations: [svelte()],

  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'artifact-dev-server',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const { artifactDevMiddleware } = await import('./src/dev/artifactDevMiddleware.mjs');
            return artifactDevMiddleware(req, res, next);
          });
        }
      }
    ]
  }
});