import {
  RequestValidationError,
  appendRequest,
  createRequest,
  filterRequests,
  loadPriorityFilter,
  loadRequests,
  savePriorityFilter,
  saveRequests,
} from "./request-store.js";

const form = document.querySelector("#request-form");
const message = document.querySelector("#form-message");
const neededByInput = document.querySelector("#needed-by");
const count = document.querySelector("#request-count");
const emptyState = document.querySelector("#empty-state");
const tableWrapper = document.querySelector("#request-table-wrapper");
const tableBody = document.querySelector("#request-table-body");
const priorityFilter = document.querySelector("#priority-filter");
const noMatches = document.querySelector("#no-matches");
const showAllButton = document.querySelector("#show-all-requests");

let requests = loadRequests();
priorityFilter.value = loadPriorityFilter();

neededByInput.min = new Date().toISOString().slice(0, 10);
renderRequests();

priorityFilter.addEventListener("change", () => {
  savePriorityFilter(priorityFilter.value);
  renderRequests();
});

showAllButton.addEventListener("click", () => {
  priorityFilter.value = "All";
  savePriorityFilter("All");
  renderRequests();
  priorityFilter.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFieldErrors();
  setMessage("");

  const input = Object.fromEntries(new FormData(form).entries());

  try {
    const request = createRequest(input);
    requests = appendRequest(requests, request);
    saveRequests(requests);
    form.reset();
    neededByInput.min = new Date().toISOString().slice(0, 10);
    setMessage("Request added.");
    renderRequests();
    document.querySelector("#requester").focus();
  } catch (error) {
    if (error instanceof RequestValidationError) {
      showFieldErrors(error.errors);
      setMessage("Complete all required fields.", true);
      return;
    }

    setMessage("The request could not be saved. Try again.", true);
    console.error(error);
  }
});

function renderRequests() {
  const visibleRequests = filterRequests(requests, priorityFilter.value);
  count.textContent = `${visibleRequests.length} ${visibleRequests.length === 1 ? "request" : "requests"}`;
  emptyState.hidden = requests.length > 0;
  noMatches.hidden = requests.length === 0 || visibleRequests.length > 0;
  tableWrapper.hidden = visibleRequests.length === 0;
  tableBody.replaceChildren(...visibleRequests.map(createRequestRow));
}

function createRequestRow(request) {
  const row = document.createElement("tr");
  const values = [
    request.requester,
    request.department,
    request.equipment,
    formatDate(request.neededBy),
    request.priority ?? "Not specified",
    request.reason,
    formatDateTime(request.createdAt),
  ];

  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }

  return row;
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showFieldErrors(errors) {
  const firstInvalidField = Object.keys(errors)[0];

  for (const fieldName of Object.keys(errors)) {
    form.elements[fieldName]?.setAttribute("aria-invalid", "true");
  }

  form.elements[firstInvalidField]?.focus();
}

function clearFieldErrors() {
  for (const element of form.elements) {
    element.removeAttribute?.("aria-invalid");
  }
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
