// assets/js/aiAnalyzer.js

export function analyzeContent(textRaw) {
  const text = (textRaw || "").trim();
  const result = {
    riskScore: 0, // up to 40
    issues: []
  };

  if (!text) {
    result.issues.push("No page content provided — analysis is based only on URL and rules.");
    return result;
  }

  const patterns = [
    {
      regex: /registration fee|processing fee|pay (rs\.?|rupees?)\s*\d+/i,
      risk: 12,
      msg: "Mentions of registration / processing fee — scammers often charge small fees."
    },
    {
      regex: /100%\s*(guarantee|confirmed|assured)/i,
      risk: 10,
      msg: "Unrealistic “100% guarantee” claims."
    },
    {
      regex: /no eligibility|everyone can apply|open for all without criteria/i,
      risk: 8,
      msg: "“No eligibility / open for all” with big money is suspicious."
    },
    {
      regex: /urgent|apply now|last 24 hours|limited slots/i,
      risk: 6,
      msg: "Strong urgency pressure is a common scam tactic."
    },
    {
      regex: /whatsapp/i,
      risk: 6,
      msg: "Asking to contact via WhatsApp for official work can be risky."
    },
    {
      regex: /send (documents|marksheet|aadhar|pan) (on|via)\s*(whatsapp|email)/i,
      risk: 8,
      msg: "Asking to send sensitive documents informally."
    },
    {
      regex: /(work from home|earn up to|monthly income)\s*\d{2,}0+/i,
      risk: 6,
      msg: "High income promises combined with weak details."
    },
    {
      regex: /lottery|winner selected|congratulations you have been selected/i,
      risk: 8,
      msg: "Lottery-style “you are already selected” language."
    }
  ];

  patterns.forEach((p) => {
    if (p.regex.test(text)) {
      result.riskScore += p.risk;
      result.issues.push(p.msg);
    }
  });

  // Exclamation & caps heuristic
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 6) {
    result.riskScore += 4;
    result.issues.push("Excessive use of exclamation marks — looks like clickbait.");
  }

  const words = text.split(/\s+/);
  const capsWords = words.filter((w) => w.length > 3 && /^[A-Z]+$/.test(w));
  if (capsWords.length > 5) {
    result.riskScore += 4;
    result.issues.push("Many ALL-CAPS words — often used to shout / oversell.");
  }

  if (text.length < 200) {
    result.riskScore += 4;
    result.issues.push("Very short / vague description — lacks proper official details.");
  }

  // Clamp to 0–40
  result.riskScore = Math.max(0, Math.min(40, result.riskScore));

  if (result.issues.length === 0) {
    result.issues.push("No strong scam signals detected in the given text.");
  }

  return result;
}
