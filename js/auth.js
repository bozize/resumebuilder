import { supabase } from "./supabaseClient.js";


const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(loginForm));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    window.location.href = "dashboard.html";
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(signupForm));
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Account created! Please log in.");
    window.location.href = "login.html";
  });
}


export async function requireAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) window.location.href = "login.html";
  return user;
}


export function setupLogout(el) {
  if (!el) return;
  el.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}