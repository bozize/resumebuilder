const btn = document.getElementById("theme-toggle");
if (btn) {
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const cur = html.getAttribute("data-theme") || "light";
    html.setAttribute("data-theme", cur === "light" ? "dark" : "light");
  });
}