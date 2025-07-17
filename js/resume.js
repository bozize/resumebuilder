import { supabase } from "./supabaseClient.js";
import { requireAuth, setupLogout } from "./auth.js";
import { renderPreview } from "./preview.js";
import html2pdf from "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";

const state = {
  header: {},
  summary: "",
  experience: [],
  education: [],
  projects: [],
  skills: [],
};
let resumeId = null;
let user = null;

(async function init() {
  user = await requireAuth();
  setupLogout(document.getElementById("logout"));
  // If editing existing resume
  const params = new URLSearchParams(location.search);
  resumeId = params.get("id");
  if (resumeId) {
    const { data, error } = await supabase.from("resumes").select("*").eq("id", resumeId).single();
    if (!error && data) Object.assign(state, data.data);
  }
  renderPreview(state);
})();

// Form handling (simplified for brevity)
const form = document.getElementById("form-area");
form.addEventListener("input", (e) => {
  const el = e.target;
  let value = el.value;

  // Handle special fields that need parsing
  if (el.name === "skills") {
    value = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (["experience", "education", "projects"].includes(el.name)) {
    try {
      value = JSON.parse(value);
    } catch (err) {
      // If JSON invalid keep raw string so user can correct it later
    }
  }

  const path = el.name.split("."); // e.g., header.fullName or experience
  setDeep(state, path, value);
  renderPreview(state);
  debounceSave();
});

// Helpers
function setDeep(obj, pathArr, val) {
  let cur = obj;
  pathArr.forEach((k, i) => {
    if (i === pathArr.length - 1) cur[k] = val;
    else cur[k] = cur[k] || {};
    cur = cur[k];
  });
}

const debounceSave = (() => {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(save, 1200);
  };
})();

async function save() {
  const payload = { user_id: user.id, title: state.header.fullName || "Untitled", data: state };
  let query = supabase.from("resumes");
  let res;
  if (resumeId) {
    res = await query.update(payload).eq("id", resumeId).select().single();
  } else {
    res = await query.insert(payload).select().single();
    resumeId = res.data.id;
  }
  if (res.error) console.error(res.error);
}

document.getElementById("export").addEventListener("click", async () => {
  if (!resumeId) await save();
  const blob = await html2pdf().from(document.getElementById("preview-area")).outputPdf("blob");
  const fileName = `resume-${resumeId}.pdf`;
  const { error } = await supabase.storage.from("resumes").upload(fileName, blob, { upsert: true });
  if (error) return alert(error.message);
  const pdf_url = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;
  await supabase.from("resumes").update({ pdf_url }).eq("id", resumeId);
  alert("PDF ready!");
});