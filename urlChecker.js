// assets/js/urlChecker.js

export async function loadVerifiedData() {
  try {
    const res = await fetch("data/verified-list.json");
    if (!res.ok) throw new Error("Failed to load verification data");
    return await res.json();
  } catch (err) {
    console.warn("Could not load verified list:", err);
    return { verifiedDomains: [], knownScamDomains: [] };
  }
}

function normalizeUrl(input) {
  if (!input) return "";
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function getDomain(url) {
  try {
    const normalized = normalizeUrl(url);
    const u = new URL(normalized);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function analyzeURL(rawUrl, data) {
  const url = normalizeUrl(rawUrl);
  const domain = getDomain(url);

  const info = {
    originalUrl: rawUrl,
    url,
    domain,
    isHttps: false,
    tags: [],
    riskScore: 0
  };

  if (!domain) {
    info.tags.push("Invalid URL");
    info.riskScore = 40;
    return info;
  }

  // HTTPS check
  info.isHttps = url.startsWith("https://");
  if (!info.isHttps) {
    info.tags.push("Not using HTTPS");
    info.riskScore += 10;
  } else {
    info.tags.push("Secured with HTTPS");
  }

  // TLD & domain heuristics
  const riskyTlds = ["xyz", "online", "shop", "top", "loan", "club", "click", "info"];
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];

  if (["gov", "edu", "ac"].some((safe) => domain.includes("." + safe + "."))) {
    info.tags.push("Educational / Government-style domain");
    info.riskScore -= 10;
  }

  if (riskyTlds.includes(tld)) {
    info.tags.push("Suspicious TLD (." + tld + ")");
    info.riskScore += 15;
  }

  const hasDigits = /[0-9]/.test(domain);
  if (hasDigits) {
    info.tags.push("Domain contains numbers (often used in scam sites)");
    info.riskScore += 10;
  }

  if (parts.length > 3) {
    info.tags.push("Long / multi-subdomain URL");
    info.riskScore += 5;
  }

  // IP-style domain
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    info.tags.push("IP-based URL instead of normal domain");
    info.riskScore += 20;
  }

  // Check against JSON dataset
  const verified = (data.verifiedDomains || []).map((d) => d.toLowerCase());
  const scams = (data.knownScamDomains || []).map((d) => d.toLowerCase());

  if (verified.some((d) => domain.endsWith(d))) {
    info.tags.push("Matches known verified domain");
    info.riskScore -= 25;
  }

  if (scams.some((d) => domain === d || domain.endsWith("." + d))) {
    info.tags.push("Matches known scam domain");
    info.riskScore += 40;
  }

  // Clamp score between 0 and 60 (URL component)
  info.riskScore = Math.max(0, Math.min(60, info.riskScore));

  return info;
}
