export const STORAGE_KEY = "mis4173-equipment-requests";
export const FILTER_STORAGE_KEY = "mis4173-equipment-priority-filter";

const PRIORITIES = ["Low", "Normal", "High"];

export class RequestValidationError extends Error {
  constructor(errors) {
    super("The equipment request is incomplete.");
    this.name = "RequestValidationError";
    this.errors = errors;
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRequest(input = {}) {
  const errors = {};

  if (!clean(input.requester)) errors.requester = "Enter the requester name.";
  if (!clean(input.department)) errors.department = "Select a department.";
  if (!clean(input.equipment)) errors.equipment = "Enter the equipment needed.";
  if (!clean(input.neededBy)) errors.neededBy = "Select the date needed.";
  if (!PRIORITIES.includes(clean(input.priority))) errors.priority = "Select a priority.";
  if (!clean(input.reason)) errors.reason = "Enter a business reason.";

  return errors;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRequest(input, options = {}) {
  const errors = validateRequest(input);
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }

  const now = options.now ?? new Date();

  return {
    id: options.id ?? createId(),
    requester: clean(input.requester),
    department: clean(input.department),
    equipment: clean(input.equipment),
    neededBy: clean(input.neededBy),
    priority: clean(input.priority),
    reason: clean(input.reason),
    createdAt: now.toISOString(),
  };
}

export function appendRequest(requests, request) {
  return [request, ...requests];
}

export function loadRequests(storage = globalThis.localStorage) {
  if (!storage) return [];

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isRequestRecord)
      : [];
  } catch {
    return [];
  }
}

export function saveRequests(requests, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function validFilter(priority) {
  return priority === "All" || PRIORITIES.includes(priority);
}

export function loadPriorityFilter(storage) {
  try {
    const priority = (storage ?? globalThis.localStorage)?.getItem(FILTER_STORAGE_KEY);
    return validFilter(priority) ? priority : "All";
  } catch {
    return "All";
  }
}

export function savePriorityFilter(priority, storage) {
  try {
    (storage ?? globalThis.localStorage)?.setItem(
      FILTER_STORAGE_KEY,
      validFilter(priority) ? priority : "All",
    );
  } catch {
    // Keep filtering usable in this session when preference storage is unavailable.
  }
}

export function filterRequests(requests, priority = "All") {
  return requests
    .filter((request) => !validFilter(priority) || priority === "All" || request.priority === priority)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function isRequestRecord(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.requester === "string" &&
    typeof value.department === "string" &&
    typeof value.equipment === "string" &&
    typeof value.neededBy === "string" &&
    typeof value.reason === "string" &&
    typeof value.createdAt === "string"
  );
}
