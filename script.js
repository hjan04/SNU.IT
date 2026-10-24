// Waitlist form, scroll animations and lightweight analytics for the landing page.

// Google Apps Script web app URL (see scripts/waitlist-apps-script.gs).
// While empty, submissions are not sent anywhere and a preview notice is shown.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxB6X2W9btPlu14euEHn0rigpd47rrDWB5bY5CCLDKfe_XNCkaxhXYO3UD9ue2uNtzV/exec";

// Analytics: events are pushed to window.dataLayer, so GA4 / GTM can be added later
// without touching this file.
window.dataLayer = window.dataLayer || [];
function track(event, params = {}) {
  window.dataLayer.push({ event, ...params });
}

document.querySelectorAll("[data-track]").forEach((el) => {
  el.addEventListener("click", () => track("cta_click", { cta: el.dataset.track }));
});

const COURSES = {
  IB: ["Math AA HL", "Math AA SL", "Physics HL", "Physics SL", "Chemistry HL", "Chemistry SL", "Biology HL", "Biology SL"],
  IGCSE: ["Mathematics", "Additional Mathematics", "Physics", "Chemistry", "Biology"],
  "A-Level": ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology"],
  AP: ["Calculus AB", "Calculus BC", "Physics 1", "Physics C", "Chemistry"],
};

const form = document.getElementById("waitlist-form");
const success = document.getElementById("form-success");
const errorBox = form.querySelector(".form-error");
const courseFieldset = document.getElementById("course-fieldset");
const courseOptions = document.getElementById("course-options");
const courseOther = form.querySelector(".course-other");

function renderCourses(curriculum) {
  const list = COURSES[curriculum] || [];
  courseOptions.innerHTML = "";
  list.forEach((name) => {
    const label = document.createElement("label");
    label.className = "chip";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "courses";
    input.value = `${curriculum} ${name}`;
    label.append(input, name);
    courseOptions.append(label);
  });
  courseFieldset.hidden = false;
  courseOther.hidden = curriculum !== "Other";
}

form.addEventListener("change", (e) => {
  if (e.target.name === "curriculum") renderCourses(e.target.value);
  const row = e.target.closest(".choice-row");
  if (row) row.classList.remove("invalid");
  if (e.target.getAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid");
});

let started = false;
form.addEventListener("focusin", () => {
  if (!started) {
    started = true;
    track("waitlist_start");
  }
});

function validate() {
  const missing = [];
  form.querySelectorAll("input[required]:not([type=radio]):not([type=checkbox])").forEach((input) => {
    const ok = input.value.trim() !== "" && input.checkValidity();
    if (ok) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
    if (!ok) missing.push(input);
  });
  // WhatsApp or Email: at least one, and Email must be well-formed if given.
  const { whatsapp, email } = form.elements;
  const contactOk = (whatsapp.value.trim() || email.value.trim()) && email.checkValidity();
  [whatsapp, email].forEach((input) => {
    if (contactOk) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
  });
  if (!contactOk) missing.push(whatsapp);
  ["curriculum", "subjects"].forEach((group) => {
    const row = form.querySelector(`[data-group="${group}"]`);
    const ok = form.querySelector(`input[name="${group}"]:checked`);
    row.classList.toggle("invalid", !ok);
    if (!ok) missing.push(row.querySelector("input"));
  });
  const consent = form.elements.consent;
  if (!consent.checked) missing.push(consent);
  return missing;
}

function collect() {
  const data = new FormData(form);
  const payload = {};
  for (const key of new Set(data.keys())) {
    const values = data.getAll(key);
    payload[key] = values.length > 1 ? values.join(", ") : values[0];
  }
  payload.submitted_at = new Date().toISOString();
  payload.page = location.href;
  payload.ref = new URLSearchParams(location.search).get("ref") || "";
  return payload;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  const missing = validate();
  if (missing.length) {
    errorBox.textContent = "필수 항목을 확인해주세요. (학생 이름, WhatsApp 또는 Email, Curriculum, 관심 과목, 개인정보 동의)";
    errorBox.hidden = false;
    missing[0].focus();
    track("waitlist_invalid", { missing: missing.length });
    return;
  }

  const payload = collect();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;

  try {
    if (WAITLIST_ENDPOINT) {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (body.ok === false || (!res.ok && res.type !== "opaque")) throw new Error(body.error || res.status);
    } else {
      success.querySelector(".preview-note").hidden = false;
      console.info("[preview] waitlist payload", payload);
    }
    track("waitlist_submit", {
      curriculum: payload.curriculum,
      subjects: payload.subjects,
      interests: payload.interests,
    });
    form.hidden = true;
    success.hidden = false;
    success.focus();
  } catch (err) {
    errorBox.textContent = "전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    errorBox.hidden = false;
    track("waitlist_error");
  } finally {
    button.disabled = false;
  }
});

const shareButton = document.querySelector("[data-share]");
shareButton.addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) await navigator.share({ title: document.title, url });
    else {
      await navigator.clipboard.writeText(url);
      shareButton.textContent = "링크가 복사되었습니다 ✓";
    }
  } catch {
    // User cancelled the share sheet or clipboard is blocked; nothing to do.
  }
});

// Header gets a hairline once the page scrolls.
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Scroll reveal: siblings fade in one after another. Counters tick up once.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll("[data-reveal]").forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
  el.style.setProperty("--d", `${siblings.indexOf(el) * 90}ms`);
});

function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) return;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1200, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    entry.target.querySelectorAll("[data-count]").forEach(countUp);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

// Hero: cycle through example courses.
const rotator = document.querySelector(".rotator");
if (rotator && !reduceMotion) {
  const words = rotator.dataset.words.split("|");
  let i = 0;
  setInterval(() => {
    rotator.classList.add("out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      rotator.textContent = words[i];
      rotator.classList.remove("out");
    }, 350);
  }, 2400);
}
