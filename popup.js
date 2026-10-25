import { loadRules, saveRules } from "./rules.js";

const form = document.getElementById("add-form");
const whenInput = document.getElementById("when");
const findInput = document.getElementById("find");
const replaceInput = document.getElementById("replace");
const list = document.getElementById("rules");
const empty = document.getElementById("empty");
const errorEl = document.getElementById("error");

let rules = [];

// Chrome closes the popup on Escape or clicking outside; this is the visible way.
document.getElementById("close").addEventListener("click", () => window.close());

async function commit(next, { rerender = true } = {}) {
  try {
    await saveRules(next);
    rules = next;
    errorEl.hidden = true;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
    rerender = true; // put the UI back in line with the saved rules
  }
  if (rerender) render();
}

function render() {
  list.replaceChildren();
  empty.hidden = rules.length > 0;

  rules.forEach((rule, i) => {
    const li = document.createElement("li");
    li.className = "rule";
    li.classList.toggle("is-off", !rule.enabled);

    // The toggle is drawn as a signal-box lever: pulled down means the rule is on.
    const cell = document.createElement("span");
    cell.className = "lever-cell";
    const lever = document.createElement("input");
    lever.type = "checkbox";
    lever.className = "lever";
    lever.checked = rule.enabled;
    lever.setAttribute("aria-label", `Redirect ${rule.find} to ${rule.replace || "nothing"}`);
    lever.addEventListener("change", () => {
      li.classList.toggle("is-off", !lever.checked);
      // Update in place so the lever animates and keeps keyboard focus.
      commit(
        rules.map((r, j) => (j === i ? { ...r, enabled: lever.checked } : r)),
        { rerender: false }
      );
    });
    cell.append(lever);

    const route = document.createElement("div");
    route.className = "route";
    const from = document.createElement("code");
    from.className = "route-from";
    from.textContent = rule.find;
    const to = document.createElement("code");
    to.className = "route-to";
    to.textContent = rule.replace || "(removes the text)";
    route.append(from, to);
    if (rule.when) {
      const when = document.createElement("p");
      when.className = "route-when";
      const value = document.createElement("code");
      value.textContent = rule.when;
      when.append("Only if URL contains ", value);
      route.append(when);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete rule for ${rule.find}`);
    del.addEventListener("click", () => commit(rules.filter((_, j) => j !== i)));

    route.append(del);
    li.append(cell, route);
    list.append(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const when = whenInput.value.trim();
  const find = findInput.value.trim();
  const replace = replaceInput.value.trim();
  if (!find) return;

  if (replace.includes(find)) {
    errorEl.textContent = "“With” contains the text from “Replace”, so the request would redirect forever. Change one of them.";
    errorEl.hidden = false;
    return;
  }

  await commit([...rules, { when, find, replace, enabled: true }]);
  if (errorEl.hidden) form.reset();
});

rules = await loadRules();
render();
