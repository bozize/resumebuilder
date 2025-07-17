import { supabase } from "./supabaseClient.js";
import { requireAuth, setupLogout } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  setupLogout(document.getElementById("logout"));

  document.getElementById("new").addEventListener("click", () => {
    window.location.href = "builder.html";
  });

  const list = document.getElementById("list");
  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return alert(error.message);

  list.innerHTML = ''; // Clear the loading state if any

  if (resumes.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <h3>No resumes yet</h3>
        <p>Get started by creating your first resume</p>
        <button id="create-first-resume" class="btn primary">
          <i class="fas fa-plus"></i> Create Resume
        </button>
      </div>`;
    
    document.getElementById('create-first-resume').addEventListener('click', () => {
      window.location.href = 'builder.html';
    });
    return;
  }

  resumes.forEach((resume) => {
    const card = document.createElement('div');
    card.className = 'resume-card';
    
    // Format the date
    const updatedDate = new Date(resume.updated_at);
    const formattedDate = updatedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = updatedDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    card.innerHTML = `
      <div class="resume-preview">
        <i class="fas fa-file-alt resume-preview-icon"></i>
      </div>
      <div class="resume-info">
        <h3>${resume.title || 'Untitled Resume'}</h3>
        <div class="resume-meta">
          <span>${formattedDate}</span>
          <span>${formattedTime}</span>
        </div>
        <div class="resume-actions">
          <button class="btn primary" data-edit="${resume.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn" data-delete="${resume.id}">
            <i class="fas fa-trash"></i>
          </button>
          ${resume.pdf_url ? `
            <a href="${resume.pdf_url}" class="btn" download>
              <i class="fas fa-download"></i>
            </a>
          ` : ''}
        </div>
      </div>`;
    
    list.appendChild(card);
  });

  list.addEventListener("click", async (e) => {
    if (e.target.matches("[data-edit]")) {
      const id = e.target.getAttribute("data-edit");
      window.location.href = `builder.html?id=${id}`;
    }
    if (e.target.matches("[data-delete]")) {
      const id = e.target.getAttribute("data-delete");
      if (!confirm("Delete this resume?")) return;
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) alert(error.message);
      else location.reload();
    }
  });
});