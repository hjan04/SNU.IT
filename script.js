// Waitlist form + lightweight analytics for the v0.2 landing page.

// Set to a form backend URL (e.g. Google Apps Script web app, Formspree) before launch.
// While empty, submissions are not sent anywhere and a preview notice is shown.
const WAITLIST_ENDPOINT = "";

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
  IB: ["Math AA HL", "Math AA SL", "Math AI HL", "Math AI SL", "Physics HL", "Physics SL"],
  IGCSE: ["Mathematics", "Additional Mathematics", "Physics"],
  "A-Level": ["Mathematics", "Further Mathematics", "Physics"],
  AP: ["Calculus AB", "Calculus BC", "Physics"],
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
  ["curriculum", "subjects", "interests"].forEach((group) => {
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
  return payload;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  const missing = validate();
  if (missing.length) {
    errorBox.textContent = "필수 항목을 확인해주세요. (이메일 형식, Curriculum, 관심 과목, 관심 프로그램, 개인정보 동의)";
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
      if (!res.ok && res.type !== "opaque") throw new Error(res.status);
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
