// Rules are stored as [{ when, find, replace, enabled }] and mirrored into
// declarativeNetRequest dynamic rules, which persist across browser restarts.
// `when` is optional: if set, the rule only applies to URLs containing it.

const STORAGE_KEY = "rules";

const RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "media",
  "websocket",
  "other",
];

// Escape a literal string for use inside an RE2 regex.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Backslashes are special in regexSubstitution (\1, \2...), so escape them.
function escapeSubstitution(str) {
  return str.replace(/\\/g, "\\\\");
}

// Each pattern captures the text before and after `find` as \1 and \2.
// RE2 has no lookahead, so "URL also contains `when`" needs one pattern for
// `when` appearing after `find` and one for it appearing before.
function toRegexFilters({ when, find }) {
  const f = escapeRegex(find);
  if (!when || find.includes(when)) {
    return [`^(.*?)${f}(.*)$`];
  }
  if (when.includes(find)) {
    // `find` sits inside `when`: replace that occurrence, keep the rest of `when`.
    const at = when.indexOf(find);
    const pre = escapeRegex(when.slice(0, at));
    const post = escapeRegex(when.slice(at + find.length));
    return [`^(.*?${pre})${f}(${post}.*)$`];
  }
  const w = escapeRegex(when);
  return [`^(.*?)${f}(.*${w}.*)$`, `^(.*${w}.*?)${f}(.*)$`];
}

function toDnrRules(rule, nextId) {
  return toRegexFilters(rule).map((regexFilter) => ({
    id: nextId(),
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        regexSubstitution: `\\1${escapeSubstitution(rule.replace)}\\2`,
      },
    },
    condition: { regexFilter, resourceTypes: RESOURCE_TYPES },
  }));
}

export async function loadRules() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] ?? [];
}

export async function saveRules(rules) {
  // Sync first so a rule Chrome rejects never gets persisted.
  await syncDnrRules(rules);
  await chrome.storage.local.set({ [STORAGE_KEY]: rules });
}

async function syncDnrRules(rules) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  let id = 0;
  const nextId = () => ++id;
  const addRules = rules
    .filter((rule) => rule.enabled && rule.find)
    .flatMap((rule) => toDnrRules(rule, nextId));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules,
  });
}
