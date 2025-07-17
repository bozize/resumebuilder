import { supabase } from "./supabaseClient.js";
import { requireAuth, setupLogout } from "./auth.js";
import { renderPreview } from "./preview.js";

const state = {
  resume: {
    title: "",
    full_name: "",
    professional_title: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  languages: [],
  interests: [],
  referees: [],
  resumeId: null,
};


const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const form = $("#form-area");

function debounce(fn, ms = 800) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, a), ms);
  };
}


function createInput(name, placeholder = "", value = "") {
  const input = document.createElement("input");
  input.name = name;
  input.placeholder = placeholder;
  input.value = value || "";
  input.addEventListener("input", handleInputChange);
  return input;
}

function createTextarea(name, placeholder = "", value = "") {
  const ta = document.createElement("textarea");
  ta.name = name;
  ta.placeholder = placeholder;
  ta.value = value || "";
  ta.rows = 3;
  ta.addEventListener("input", handleInputChange);
  return ta;
}

function renderHeaderSection() {
  const h = state.resume;
  $("input[name='full_name']").value = h.full_name || "";
  $("input[name='professional_title']").value = h.professional_title || "";
  $("input[name='email']").value = h.email || "";
  $("input[name='phone']").value = h.phone || "";
  $("input[name='linkedin']").value = h.linkedin || "";
  $("input[name='github']").value = h.github || "";
  $("input[name='website']").value = h.website || "";
  $("textarea[name='summary']").value = h.summary || "";
}

function renderList(section, containerId, fields) {
  const container = $(containerId);
  container.innerHTML = "";
  state[section].forEach((item, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "repeater-card";
    
    fields.forEach(({ key, placeholder, type = "input" }) => {
      const label = document.createElement("label");
      label.textContent = placeholder;
      label.className = "repeater-label";
      wrapper.appendChild(label);
      
      const el = type === "textarea" 
        ? createTextarea(`${section}.${idx}.${key}`, placeholder, item[key])
        : createInput(`${section}.${idx}.${key}`, placeholder, item[key]);
      wrapper.appendChild(el);
    });
    
    const del = document.createElement("button");
    del.innerHTML = '<i class="fas fa-trash"></i> Delete';
    del.onclick = () => {
      state[section].splice(idx, 1);
      renderList(section, containerId, fields);
      renderPreview(stateForPreview());
      debouncedSave();
    };
    wrapper.appendChild(del);
    container.appendChild(wrapper);
  });
}

function stateForPreview() {
  return {
    header: {
      fullName: state.resume.full_name,
      title: state.resume.professional_title,
      email: state.resume.email,
      phone: state.resume.phone,
      linkedin: state.resume.linkedin,
      github: state.resume.github,
      website: state.resume.website,
    },
    summary: state.resume.summary,
    experience: state.experience.map((e) => ({
      title: e.job_title,
      company: e.company,
      location: e.location,
      start: e.start_date,
      end: e.end_date,
      desc: Array.isArray(e.responsibilities) 
        ? e.responsibilities 
        : (e.responsibilities || "").split(",").map(s => s.trim()).filter(Boolean),
    })),
    education: state.education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      location: e.location,
      grad: e.graduation,
    })),
    projects: state.projects.map((p) => ({
      title: p.title,
      description: p.description,
      tech: p.tech,
      link: p.link,
    })),
    languages: state.languages.map(l => ({ 
      language: l.language, 
      proficiency: l.proficiency 
    })),
    interests: state.interests.map(i => (typeof i === "string" ? i : i.interest)),
    skills: state.skills.map((s) => s.name),
    referees: state.referees.map(r => ({
      name: r.name,
      contact: r.contact,
      relationship: r.relationship
    })),
  };
}


function handleInputChange(e) {
  const { name, value } = e.target;
  switch (name) {
    case "full_name":
    case "professional_title":
    case "email":
    case "phone":
    case "linkedin":
    case "github":
    case "website":
      state.resume[name] = value;
      break;
    case "summary":
      state.resume.summary = value;
      break;
    default:
      const [section, idx, field] = name.split(".");
      if (state[section] && state[section][idx]) {
        if (field === "responsibilities") {
          state[section][idx][field] = value.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          state[section][idx][field] = value;
        }
      }
  }
  renderPreview(stateForPreview());
  debouncedSave();
}

const debouncedSave = debounce(save, 1200);


async function save() {
  const user = await requireAuth();
  const mainPayload = { 
    ...state.resume, 
    user_id: user.id, 
    title: state.resume.title || state.resume.full_name || "Untitled" 
  };
  
  let resumeId = state.resumeId;
  if (resumeId) {
    await supabase.from("resumes").update(mainPayload).eq("id", resumeId);
  } else {
    const { data } = await supabase.from("resumes").insert(mainPayload).select().single();
    resumeId = data.id;
    state.resumeId = resumeId;
  }

  const replaceChild = async (table, rows) => {
    await supabase.from(table).delete().eq("resume_id", resumeId);
    if (rows.length) {
      await supabase.from(table).insert(rows.map((r) => ({ ...r, resume_id: resumeId })));
    }
  };

  await Promise.all([
    replaceChild("resume_experience", state.experience),
    replaceChild("resume_skill", state.skills),
    replaceChild("resume_education", state.education),
    replaceChild("resume_project", state.projects),
    replaceChild("resume_language", state.languages),
    replaceChild("resume_interest", state.interests),
    replaceChild("resume_referees", state.referees),
  ]);
}


$("#export").addEventListener("click", async () => {
  if (!state.resumeId) await save();
  const blob = await window.html2pdf()
    .from($("#preview-area"))
    .set({
      margin: 10,
      filename: `resume_${state.resume.full_name || 'my_resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .outputPdf("blob");
  
  const fileName = `resume-${state.resumeId}.pdf`;
  await supabase.storage.from("resumes").upload(fileName, blob, { upsert: true });
  const pdf_url = supabase.storage.from("resumes").getPublicUrl(fileName).data.publicUrl;
  await supabase.from("resumes").update({ pdf_url }).eq("id", state.resumeId);
  alert("PDF generated successfully!");
});


const expFields = [
  { key: "job_title", placeholder: "Job Title" },
  { key: "company", placeholder: "Company" },
  { key: "location", placeholder: "Location" },
  { key: "start_date", placeholder: "Start Date" },
  { key: "end_date", placeholder: "End Date" },
  { key: "responsibilities", placeholder: "Responsibilities (comma-separated)", type: "textarea" },
];

const skillFields = [
  { key: "category", placeholder: "Category" },
  { key: "name", placeholder: "Skill" },
];

const eduFields = [
  { key: "degree", placeholder: "Degree" },
  { key: "institution", placeholder: "Institution" },
  { key: "location", placeholder: "Location" },
  { key: "graduation", placeholder: "Graduation" },
  { key: "honors", placeholder: "Honors" },
];

const projFields = [
  { key: "title", placeholder: "Title" },
  { key: "description", placeholder: "Description", type: "textarea" },
  { key: "tech", placeholder: "Technologies" },
  { key: "link", placeholder: "Link" },
];

const langFields = [
  { key: "language", placeholder: "Language" },
  { key: "proficiency", placeholder: "Proficiency" },
];

const intFields = [
  { key: "interest", placeholder: "Interest" },
];

const refFields = [
  { key: "name", placeholder: "Full Name" },
  { key: "contact", placeholder: "Contact Information" },
  { key: "relationship", placeholder: "Relationship" }
];

// Initialization
async function init() {
  await requireAuth();
  
  // Setup logout functionality
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    setupLogout(logoutBtn);
  }

  // Set up event listeners
  $$("input, textarea", form).forEach(inp => inp.addEventListener("input", handleInputChange));
  
  // Add buttons
  $("#add-exp").onclick = () => {
    state.experience.push({ 
      job_title: "", 
      company: "", 
      location: "", 
      start_date: "", 
      end_date: "", 
      responsibilities: [] 
    });
    renderList("experience", "#exp-list", expFields);
  };
  
  $("#add-skill").onclick = () => {
    state.skills.push({ category: "", name: "" });
    renderList("skills", "#skill-list", skillFields);
  };
  $("#add-edu").onclick = () => {
  state.education.push({ 
    degree: "", 
    institution: "", 
    location: "", 
    graduation: "", 
    honors: "" 
  });
  renderList("education", "#edu-list", eduFields);
};

$("#add-proj").onclick = () => {
  state.projects.push({ 
    title: "", 
    description: "", 
    tech: "", 
    link: "" 
  });
  renderList("projects", "#proj-list", projFields);
};

$("#add-lang").onclick = () => {
  state.languages.push({ 
    language: "", 
    proficiency: "" 
  });
  renderList("languages", "#lang-list", langFields);
};

$("#add-int").onclick = () => {
  state.interests.push({ 
    interest: "" 
  });
  renderList("interests", "#int-list", intFields);
};

$("#add-ref").onclick = () => {
  state.referees.push({ 
    name: "",
    contact: "",
    relationship: ""
  });
  renderList("referees", "#ref-list", refFields);
  renderPreview(stateForPreview());
  debouncedSave();
};
  
  // Other add buttons...
  
  // Load resume if editing
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id) {
    state.resumeId = id;
    const { data } = await supabase
      .from("resumes")
      .select("*, resume_experience(*), resume_skill(*), resume_education(*), resume_project(*), resume_language(*), resume_interest(*), resume_referees(*)")
      .eq("id", id)
      .single();
      
    Object.assign(state.resume, data);
    state.experience = data.resume_experience || [];
    state.skills = data.resume_skill || [];
    state.education = data.resume_education || [];
    state.projects = data.resume_project || [];
    state.languages = data.resume_language || [];
    state.interests = data.resume_interest || [];
    state.referees = data.resume_referees || [];
  }

  // Initial render
  renderHeaderSection();
  renderList("experience", "#exp-list", expFields);
  renderList("skills", "#skill-list", skillFields);
  renderList("education", "#edu-list", eduFields);
  renderList("projects", "#proj-list", projFields);
  renderList("languages", "#lang-list", langFields);
  renderList("interests", "#int-list", intFields);
  renderList("referees", "#ref-list", refFields);
  
  renderPreview(stateForPreview());
}

init();
