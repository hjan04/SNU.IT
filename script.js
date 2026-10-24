// Waitlist form, scroll animations and lightweight analytics for the landing page.

// Google Apps Script web app URL (see scripts/waitlist-apps-script.gs).
// While empty, submissions are not sent anywhere and a preview notice is shown.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxB6X2W9btPlu14euEHn0rigpd47rrDWB5bY5CCLDKfe_XNCkaxhXYO3UD9ue2uNtzV/exec";

// Fill these in when ready; empty values keep the feature off.
const GA_MEASUREMENT_ID = ""; // GA4, e.g. "G-XXXXXXXXXX"
const CONTACT_URL = ""; // KakaoTalk open chat or https://wa.me/<number>

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
if (GA_MEASUREMENT_ID) {
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.append(tag);
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}
function track(event, params = {}) {
  gtag("event", event, params);
}

if (CONTACT_URL) {
  document.querySelectorAll("[data-contact]").forEach((el) => {
    el.href = CONTACT_URL;
    el.hidden = false;
  });
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

// Example answer for "needs", matched to the chosen curriculum.
const NEEDS_EXAMPLES = {
  IB: "예: Math AA HL 최근 시험 5점 (Predicted 6). 미적분 서술형에서 점수가 자주 깎여요.",
  IGCSE: "예: Additional Maths 최근 모의고사 B. 시간이 부족해서 마지막 문제를 못 풀어요.",
  "A-Level": "예: Physics AS 결과 B, 목표 A*. 전기 단원 개념이 헷갈려요.",
  AP: "예: Calculus BC 학교 시험 B+. 급수(Series) 단원이 약해요.",
};

form.addEventListener("change", (e) => {
  if (e.target.name === "curriculum") {
    renderCourses(e.target.value);
    form.elements.needs.placeholder = NEEDS_EXAMPLES[e.target.value] || NEEDS_EXAMPLES.IB;
  }
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
  el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 3) * 90}ms`);
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

// Instructor carousel: native scroll-snap, plus buttons, progress and mouse drag.
const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const list = carousel.querySelector("[data-track-list]");
  const items = [...list.children];
  const prev = carousel.querySelector("[data-prev]");
  const next = carousel.querySelector("[data-next]");
  const current = carousel.querySelector("[data-current]");
  const bar = carousel.querySelector("[data-progress]");
  const pad = (n) => String(n).padStart(2, "0");
  carousel.querySelector("[data-total]").textContent = pad(items.length);
  const step = () => items[1].offsetLeft - items[0].offsetLeft;

  const update = () => {
    const max = list.scrollWidth - list.clientWidth;
    const index = Math.round(list.scrollLeft / step());
    current.textContent = pad(Math.min(index + 1, items.length));
    bar.style.width = `${max > 0 ? ((list.scrollLeft + list.clientWidth) / list.scrollWidth) * 100 : 100}%`;
    prev.disabled = list.scrollLeft <= 2;
    next.disabled = list.scrollLeft >= max - 2;
  };
  prev.addEventListener("click", () => list.scrollBy({ left: -step() }));
  next.addEventListener("click", () => list.scrollBy({ left: step() }));
  list.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();

  // Click-and-drag with a mouse; touch already swipes natively.
  let startX = 0, startLeft = 0, moved = false;
  list.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.target.closest("summary, a, button")) return;
    startX = e.clientX; startLeft = list.scrollLeft; moved = false;
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 4) { moved = true; list.classList.add("dragging"); }
      list.scrollLeft = startLeft - (ev.clientX - startX);
    };
    const up = () => {
      removeEventListener("pointermove", move);
      list.classList.remove("dragging");
      if (moved) list.scrollBy({ left: 0 }); // let snap settle
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up, { once: true });
  });
}

// Instructor profile popup: header copied from the card, details from its <template>.
const dialog = document.getElementById("profile-dialog");
if (dialog) {
  const cards = [...document.querySelectorAll(".instructor-track article.card")];
  const body = dialog.querySelector("[data-profile-body]");
  let index = 0;

  const show = (i) => {
    index = (i + cards.length) % cards.length;
    const card = cards[index];
    const head = document.createElement("div");
    head.className = "profile-head";
    head.append(card.querySelector(".card-photo").cloneNode(true));
    const info = document.createElement("div");
    for (const sel of [".card-dept", "h3", ".card-school", ".badges"]) info.append(card.querySelector(sel).cloneNode(true));
    info.querySelector("h3").id = "profile-name";
    head.append(info);
    const content = document.createElement("div");
    content.className = "profile-content";
    content.append(card.querySelector("template[data-profile]").content.cloneNode(true));
    body.replaceChildren(head, content);
    body.scrollTop = 0;
  };

  cards.forEach((card, i) => card.querySelector("[data-profile-open]").addEventListener("click", () => {
    show(i);
    dialog.showModal();
    track("profile_open", { instructor: card.querySelector("h3").textContent });
  }));
  dialog.querySelector("[data-profile-prev]").addEventListener("click", () => show(index - 1));
  dialog.querySelector("[data-profile-next]").addEventListener("click", () => show(index + 1));
  dialog.querySelector("[data-profile-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-profile-cta]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}
