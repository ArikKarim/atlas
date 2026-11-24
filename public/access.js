// A browser-based entry gate for the static site, not server authentication.
const digest =
  "835113638d2a6695226ff63eea43f4d226424ff37fe8814fa48c02d0afd30508";
const key = "atlas-access-v1";
const form = document.getElementById("access-form");
const field = document.getElementById("access-password");
const error = document.getElementById("access-error");
const button = form.querySelector("button");
async function openAtlas() {
  await import("./app.js");
  document.getElementById("atlas-app").hidden = false;
  document.getElementById("password-gate").remove();
  const content = document.getElementById("main");
  content.setAttribute("tabindex", "-1");
  content.focus({ preventScroll: true });
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  error.textContent = "";
  try {
    const bytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(field.value),
    );
    const entered = Array.from(new Uint8Array(bytes), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    if (entered !== digest) {
      error.textContent = "Incorrect password. Try again.";
      field.setAttribute("aria-invalid", "true");
      field.select();
      return;
    }
    field.removeAttribute("aria-invalid");
    field.value = "";
    await openAtlas();
    try {
      sessionStorage.setItem(key, digest);
    } catch {}
  } catch {
    error.textContent = "Atlas could not open. Please refresh and try again.";
  } finally {
    button.disabled = false;
  }
});
field.addEventListener("input", () => {
  field.removeAttribute("aria-invalid");
  error.textContent = "";
});
let remembered = false;
try {
  remembered = sessionStorage.getItem(key) === digest;
} catch {}
if (remembered)
  openAtlas().catch(() => {
    error.textContent = "Atlas could not open. Please refresh and try again.";
  });
