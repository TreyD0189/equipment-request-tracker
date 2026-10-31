import assert from "node:assert/strict";
import test from "node:test";
import { FILTER_STORAGE_KEY, STORAGE_KEY } from "../src/request-store.js";

// A small DOM boundary double exercises the real app module and event handlers.
// It does not replace browser checks for layout, native controls, or accessibility.
class Element {
  value = "";
  hidden = false;
  textContent = "";
  children = [];
  listeners = new Map();
  classList = { toggle() {} };
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  dispatch(type) { this.listeners.get(type)?.({ preventDefault() {} }); }
  replaceChildren(...children) { this.children = children; }
  append(child) { this.children.push(child); }
  focus() { this.focused = true; }
  removeAttribute() {}
  setAttribute() {}
}

let instance = 0;
async function openApp(t, records = [], blockedPreference = false) {
  const elements = new Map();
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  const values = new Map([[STORAGE_KEY, JSON.stringify(records)]]);
  const storage = {
    getItem(key) {
      if (blockedPreference && key === FILTER_STORAGE_KEY) throw Error("Blocked preference");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedPreference && key === FILTER_STORAGE_KEY) throw Error("Blocked preference");
      values.set(key, value);
    },
  };
  const form = element("#request-form");
  form.elements = [];
  form.reset = () => { form.input = {}; };
  t.mock.method(globalThis, "FormData", function (target) {
    return { entries: () => Object.entries(target.input) };
  });
  for (const [key, value] of Object.entries({
    document: { querySelector: element, createElement: () => new Element() },
    localStorage: storage,
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => original
      ? Object.defineProperty(globalThis, key, original)
      : delete globalThis[key]);
  }
  await import(`../src/app.js?test=${instance++}`);
  return { element, storage, form };
}

const record = {
  id: "low-1", requester: "Jordan", department: "Operations",
  equipment: "Laptop", neededBy: "2027-01-01", priority: "Low",
  reason: "Replacement", createdAt: "2026-10-01T12:00:00Z",
};

test("AC6: no-match recovery restores rows, count, focus, and saved All", async (t) => {
  const { element, storage } = await openApp(t, [record]);
  const before = storage.getItem(STORAGE_KEY);
  const filter = element("#priority-filter");
  filter.value = "High";
  filter.dispatch("change");
  assert.equal(element("#no-matches").hidden, false);
  assert.equal(element("#request-table-wrapper").hidden, true);
  assert.equal(element("#empty-state").hidden, true);
  assert.equal(element("#request-count").textContent, "0 requests");
  element("#show-all-requests").dispatch("click");
  assert.equal(filter.value, "All");
  assert.equal(filter.focused, true);
  assert.equal(storage.getItem(FILTER_STORAGE_KEY), "All");
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.equal(element("#no-matches").hidden, true);
  assert.equal(element("#request-table-wrapper").hidden, false);
  assert.equal(element("#request-table-body").children.length, 1);
  assert.equal(element("#request-count").textContent, "1 request");
});

for (const blockedPreference of [false, true]) {
  test(`AC8/AC10: adding preserves High and visible counts (preference blocked: ${blockedPreference})`, async (t) => {
    const { element, storage, form } = await openApp(t, [], blockedPreference);
    const filter = element("#priority-filter");
    assert.equal(filter.value, "All");
    filter.value = "High";
    filter.dispatch("change");
    for (const priority of ["High", "Low"]) {
      form.input = { ...record, priority };
      form.dispatch("submit");
      assert.equal(element("#form-message").textContent, "Request added.");
      assert.equal(filter.value, "High");
      assert.equal(element("#request-count").textContent, "1 request");
      assert.equal(element("#request-table-body").children.length, 1);
      assert.equal(element("#request-table-body").children[0].children[4].textContent, "High");
    }
    assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).length, 2);
    filter.value = "Low";
    filter.dispatch("change");
    assert.equal(element("#request-table-body").children[0].children[4].textContent, "Low");
    assert.equal(element("#request-count").textContent, "1 request");
  });
}
