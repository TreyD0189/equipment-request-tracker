import assert from "node:assert/strict";
import test from "node:test";

import {
  RequestValidationError,
  STORAGE_KEY,
  FILTER_STORAGE_KEY,
  appendRequest,
  createRequest,
  filterRequests,
  loadPriorityFilter,
  loadRequests,
  saveRequests,
  savePriorityFilter,
} from "../src/request-store.js";

const validInput = {
  requester: "  Jordan Lee  ",
  department: "Operations",
  equipment: "  Laptop  ",
  neededBy: "2026-09-15",
  priority: "Normal",
  reason: "  Replace a failed field computer.  ",
};

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("createRequest trims input and adds system fields", () => {
  const request = createRequest(validInput, {
    id: "request-1",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  assert.deepEqual(request, {
    id: "request-1",
    requester: "Jordan Lee",
    department: "Operations",
    equipment: "Laptop",
    neededBy: "2026-09-15",
    priority: "Normal",
    reason: "Replace a failed field computer.",
    createdAt: "2026-08-17T12:00:00.000Z",
  });
});

test("createRequest reports missing required fields", () => {
  assert.throws(
    () => createRequest({ ...validInput, requester: "", equipment: " " }),
    (error) => {
      assert.ok(error instanceof RequestValidationError);
      assert.deepEqual(Object.keys(error.errors), ["requester", "equipment"]);
      return true;
    },
  );
});

test("createRequest rejects an unsupported priority", () => {
  assert.throws(
    () => createRequest({ ...validInput, priority: "Urgent" }),
    (error) => {
      assert.ok(error instanceof RequestValidationError);
      assert.deepEqual(Object.keys(error.errors), ["priority"]);
      return true;
    },
  );
});

test("appendRequest returns a new list with the newest request first", () => {
  const original = [{ id: "old" }];
  const result = appendRequest(original, { id: "new" });

  assert.deepEqual(result.map((request) => request.id), ["new", "old"]);
  assert.deepEqual(original.map((request) => request.id), ["old"]);
});

test("saveRequests and loadRequests round-trip valid records", () => {
  const storage = new MemoryStorage();
  const request = createRequest(validInput, {
    id: "request-2",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  saveRequests([request], storage);

  assert.deepEqual(loadRequests(storage), [request]);
});

test("loadRequests preserves older records without assigning a priority", () => {
  const storage = new MemoryStorage();
  const legacyRequest = {
    id: "request-old",
    requester: "Jordan Lee",
    department: "Operations",
    equipment: "Laptop",
    neededBy: "2026-09-15",
    reason: "Replace a failed field computer.",
    createdAt: "2026-08-17T12:00:00.000Z",
  };
  storage.setItem(STORAGE_KEY, JSON.stringify([legacyRequest]));

  const loaded = loadRequests(storage);
  assert.deepEqual(loaded, [legacyRequest]);
  assert.deepEqual(filterRequests(loaded, "All"), [legacyRequest]);
  for (const priority of ["Low", "Normal", "High"]) {
    assert.deepEqual(filterRequests(loaded, priority), []);
  }
  saveRequests(appendRequest(loaded, createRequest(validInput)), storage);
  assert.deepEqual(loadRequests(storage)[1], legacyRequest);
});

test("loadRequests safely handles damaged stored data", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "not-json");

  assert.deepEqual(loadRequests(storage), []);
});

test("filters exact priorities and sorts newest first without changing records or storage", () => {
  const storage = new MemoryStorage();
  const records = [
    { ...createRequest(validInput), id: "older", priority: "High", createdAt: "2026-01-01T00:00:00Z" },
    { ...createRequest(validInput), id: "low", priority: "Low", createdAt: "2026-03-01T00:00:00Z" },
    { ...createRequest(validInput), id: "normal", priority: "Normal", createdAt: "2026-02-01T00:00:00Z" },
    { ...createRequest(validInput), id: "newer", priority: "High", createdAt: "2026-04-01T00:00:00Z" },
    { ...createRequest(validInput), id: "same-time", priority: "High", createdAt: "2026-04-01T00:00:00Z" },
  ];
  saveRequests(records, storage);
  const before = storage.getItem(STORAGE_KEY);
  const loaded = loadRequests(storage);
  loaded.forEach(Object.freeze);
  Object.freeze(loaded);
  for (const priority of ["All", "Low", "Normal", "High"]) {
    const expected = ["newer", "same-time", "low", "normal", "older"]
      .filter((id) => priority === "All" || records.find((r) => r.id === id).priority === priority);
    assert.deepEqual(filterRequests(loaded, priority).map((r) => r.id), expected);
  }
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.deepEqual(loaded, records);
  assert.deepEqual(filterRequests([], "High"), []);
});

test("filter preference defaults to All and round-trips all valid selections", () => {
  const storage = new MemoryStorage();
  assert.equal(loadPriorityFilter(storage), "All");
  storage.setItem(FILTER_STORAGE_KEY, "Urgent");
  assert.equal(loadPriorityFilter(storage), "All");
  for (const priority of ["All", "Low", "Normal", "High"]) {
    savePriorityFilter(priority, storage);
    assert.equal(loadPriorityFilter(storage), priority);
  }
});

test("preference failures do not block filtering or request storage", () => {
  const storage = new MemoryStorage();
  const get = storage.getItem.bind(storage);
  const set = storage.setItem.bind(storage);
  storage.getItem = (key) => {
    if (key === FILTER_STORAGE_KEY) throw new Error("Preference read blocked");
    return get(key);
  };
  storage.setItem = (key, value) => {
    if (key === FILTER_STORAGE_KEY) throw new Error("Preference write blocked");
    set(key, value);
  };
  assert.equal(loadPriorityFilter(storage), "All");
  assert.doesNotThrow(() => savePriorityFilter("High", storage));
  const request = createRequest({ ...validInput, priority: "High" });
  saveRequests([request], storage);
  assert.deepEqual(filterRequests(loadRequests(storage), "High"), [request]);
});
