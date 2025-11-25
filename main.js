// assets/js/main.js
import { loadVerifiedData, analyzeURL } from "./urlChecker.js";
import { analyzeContent } from "./aiAnalyzer.js";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") {
    initHomePage();
  } else if (page === "result") {
    initResultPage();
  }
});

function initHomePage() {
  const form = document.getElementById("scan-form");
  const urlInput = document.getElementById("url-input");
  const contentInput = document.getElementById("content-input");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    const content = contentInput.value.trim();

    if (!url) return;

    // Store in sessionStorage so result page can read it
    const payload = { url, content };
    sessionStorage.setItem("aiShield_scanInput", JSON.stringify(payload));

    window.location.href = "result.html";
  });
}

async function initResultPage() {
  const dataRaw = sessionStorage.getItem("aiShield_scanInput");

  const urlDisplay = document.getElementById("url-display");
  const scoreCircle = document.getElementById("score-circle");
  const scoreValue = document.getElementById("score-value");
  const scoreVerdict = document.getElementById("score-verdict");
  const urlTagsEl = document.getElementById("url-tags");
  const contentIssuesEl = document.getElementById("content-issues");
  const recommendationEl = document.getElementById("recommendation");

  if (!dataRaw) {
    if (urlDisplay) urlDisplay.textContent = "No URL found. Please go back and scan again.";
    if (scoreValue) scoreValue.textContent = "--";
    if (scoreVerdict) scoreVerdict.textContent = "No data";
    return;
  }

  const { url, content } = JSON.parse(dataRaw);

  if (urlDisplay) urlDisplay.textContent = url;

  // Load dataset and run analyses
  const verifiedData = await loadVerifiedData();
  const urlInfo = analyzeURL(url, verifiedData);
  const contentInfo = analyzeContent(content);

  const totalScore = Math.max(
    0,
    Math.min(100, urlInfo.riskScore + contentInfo.riskScore)
  );

  // Update score UI
  if (scoreValue) scoreValue.textContent = totalScore.toString();

  const level = getRiskLevel(totalScore);

  scoreCircle.classList.remove("safe", "warning", "danger");
  scoreVerdict.classList.remove("safe", "warning", "danger");

  if (level === "safe") {
    scoreCircle.classList.add("safe");
    scoreVerdict.classList.add("safe");
    scoreVerdict.textContent = "Looks mostly genuine (low risk).";
  } else if (level === "warning") {
    scoreCircle.classList.add("warning");
    scoreVerdict.classList.add("warning");
    scoreVerdict.textContent = "Be cautious — mixed signals detected.";
  } else {
    scoreCircle.classList.add("danger");
    scoreVerdict.classList.add("danger");
    scoreVerdict.textContent = "High chance of scam — do NOT share data or pay fees.";
  }

  // URL tags
  if (urlTagsEl) {
    urlTagsEl.innerHTML = "";
    urlInfo.tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "pill " + (t.toLowerCase().includes("scam") || t.toLowerCase().includes("suspicious") ? "bad" : "good");
      span.textContent = t;
      urlTagsEl.appendChild(span);
    });
  }

  // Content issues
  if (contentIssuesEl) {
    contentIssuesEl.innerHTML = "";
    contentInfo.issues.forEach((issue) => {
      const li = document.createElement("li");
      li.textContent = issue;
      contentIssuesEl.appendChild(li);
    });
  }

  // Recommendation text
  if (recommendationEl) {
    let msg = "";

    if (level === "safe") {
      msg =
        "This link appears relatively safe based on URL and text checks. Still, make sure it matches " +
        "official college / government announcements and never share OTPs or passwords.";
    } else if (level === "warning") {
      msg =
        "This opportunity has both positive and suspicious signs. Cross-verify on official .gov/.edu websites, " +
        "talk to your college authorities, and avoid paying any upfront fees.";
    } else {
      msg =
        "Our system flags this as high risk. Avoid uploading documents, sharing personal information, or paying money. " +
        "Search the scheme on official portals or contact your institution before proceeding.";
    }

    recommendationEl.textContent = msg;
  }
}

function getRiskLevel(score) {
  if (score <= 30) return "safe";
  if (score <= 60) return "warning";
  return "danger";
}
