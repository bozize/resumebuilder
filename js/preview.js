export function renderPreview(state) {
  const root = document.getElementById("preview-area");
  if (!root) return;
  
  root.innerHTML = `
    <div class="resume-a4">
      <header class="resume-header">
        <h1 class="resume-name">${state.header.fullName || "Full Name"}</h1>
        <h2 class="resume-title">${state.header.title || "Professional Title"}</h2>
        <div class="contact-info">
          ${state.header.email ? `<span>${state.header.email}</span>` : ''}
          ${state.header.phone ? `<span>${state.header.phone}</span>` : ''}
          ${state.header.linkedin ? `<span><a href="${state.header.linkedin}" target="_blank">LinkedIn</a></span>` : ''}
          ${state.header.github ? `<span><a href="${state.header.github}" target="_blank">GitHub</a></span>` : ''}
          ${state.header.website ? `<span><a href="${state.header.website}" target="_blank">Website</a></span>` : ''}
        </div>
      </header>

      <main class="resume-content">
        ${state.summary ? `
        <section class="resume-section">
          <h3 class="section-title">PROFILE</h3>
          <div class="section-content">
            <p>${state.summary}</p>
          </div>
        </section>
        ` : ''}

        ${sectionList("WORK EXPERIENCE", state.experience, templateJob)}
        ${sectionList("EDUCATION", state.education, templateEdu)}
        ${sectionList("PROJECTS", state.projects, templateProj)}

        ${Array.isArray(state.skills) && state.skills.length ? `
        <section class="resume-section">
          <h3 class="section-title">SKILLS</h3>
          <div class="section-content">
            <ul class="skills-list">
              ${state.skills.map(s => `<li>${s.name || s}</li>`).join('')}
            </ul>
          </div>
        </section>
        ` : ''}

        ${Array.isArray(state.languages) && state.languages.length ? `
        <section class="resume-section">
          <h3 class="section-title">LANGUAGES</h3>
          <div class="section-content">
            <ul class="languages-list">
              ${state.languages.map(l => `<li>${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}</li>`).join('')}
            </ul>
          </div>
        </section>
        ` : ''}

        ${Array.isArray(state.interests) && state.interests.length ? `
        <section class="resume-section">
          <h3 class="section-title">INTERESTS</h3>
          <div class="section-content">
            <p>${state.interests.join(', ')}</p>
          </div>
        </section>
        ` : ''}

        ${Array.isArray(state.referees) && state.referees.length ? `
        <section class="resume-section">
          <h3 class="section-title">REFERENCES</h3>
          <div class="section-content">
            <div class="references-list">
              ${state.referees.map(r => `
                <div class="reference-item">
                  <div class="reference-name">${r.name || 'Reference Name'}</div>
                  <div class="reference-title">${r.relationship || 'Reference'}</div>
                  <div class="reference-contact">${r.contact || 'Contact Information'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
        ` : ''}
      </main>
    </div>
  `;
}

function sectionList(title, arr, tpl) {
  if (typeof arr === "string") {
    try { arr = JSON.parse(arr); } catch { arr = []; }
  }
  if (!arr?.length) return "";
  
  return `
    <section class="resume-section">
      <h3 class="section-title">${title}</h3>
      <div class="section-content">
        ${arr.map(tpl).join("")}
      </div>
    </section>
  `;
}

function templateJob(j) {
  return `
    <article class="experience-item">
      <div class="experience-header">
        <h4 class="job-title">${j.title || "Job Title"}</h4>
        <span class="job-company">${j.company || "Company"}</span>
        <div class="job-meta">
          <span class="job-period">${j.start || "Start"} - ${j.end || "Present"}</span>
          <span class="job-location">${j.location || "Location"}</span>
        </div>
      </div>
      ${(j.desc || []).length ? `
      <ul class="job-responsibilities">
        ${(j.desc || []).map(d => `<li>${d}</li>`).join('')}
      </ul>
      ` : ''}
    </article>
  `;
}

function templateEdu(e) {
  return `
    <article class="education-item">
      <div class="education-header">
        <h4 class="degree">${e.degree || "Degree"}</h4>
        <span class="institution">${e.institution || "Institution"}</span>
        <div class="education-meta">
          <span class="graduation-date">${e.grad || "Graduation"}</span>
          <span class="location">${e.location || "Location"}</span>
        </div>
      </div>
    </article>
  `;
}

function templateProj(p) {
  return `
    <article class="project-item">
      <div class="project-header">
        <h4 class="project-title">${p.title || "Project Title"}</h4>
        ${p.link ? `<a href="${p.link}" target="_blank" class="project-link">View Project</a>` : ''}
      </div>
      <p class="project-description">${p.description || "Project description."}</p>
      ${p.tech ? `<div class="project-tech"><strong>Technologies:</strong> ${p.tech}</div>` : ''}
    </article>
  `;
}