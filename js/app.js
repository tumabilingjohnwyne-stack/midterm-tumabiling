// ==========================================
// 1. Document Configuration Object
// ==========================================
const DOC_CONFIG = {
  "Certificate of Enrollment": { fee: 50, workingDays: 2 },
  "Transcript of Records": { fee: 150, workingDays: 5 },
  "Good Moral Certificate": { fee: 100, workingDays: 3 }
};

const STORAGE_KEY = "registrar_requests_data";
let requests = [];
let selectedRequestId = null;

// ==========================================
// DOM Element References
// ==========================================
const requestForm = document.getElementById("requestForm");
const docTypeSelect = document.getElementById("docType");
const previewCard = document.getElementById("previewCard");
const previewFee = document.getElementById("previewFee");
const previewReleaseDate = document.getElementById("previewReleaseDate");

const requestsTableBody = document.getElementById("requestsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const docTypeFilter = document.getElementById("docTypeFilter");

const navBtns = document.querySelectorAll(".nav-btn");
const tabContents = document.querySelectorAll(".tab-content");

const statusSummaryContainer = document.getElementById("statusSummaryContainer");
const docTypeSummaryContainer = document.getElementById("docTypeSummaryContainer");

// Modal Elements
const detailsModal = document.getElementById("detailsModal");
const closeModalBtn = document.getElementById("closeModal");
const modalRefNum = document.getElementById("modalRefNum");
const modalStudentName = document.getElementById("modalStudentName");
const modalStudentId = document.getElementById("modalStudentId");
const modalCourse = document.getElementById("modalCourse");
const modalDocType = document.getElementById("modalDocType");
const modalFee = document.getElementById("modalFee");
const modalPurpose = document.getElementById("modalPurpose");
const modalDateRequested = document.getElementById("modalDateRequested");
const modalExpectedRelease = document.getElementById("modalExpectedRelease");
const modalStatusBadge = document.getElementById("modalStatusBadge");
const modalClaimDateRow = document.getElementById("modalClaimDateRow");
const modalClaimDate = document.getElementById("modalClaimDate");
const modalRejectionRow = document.getElementById("modalRejectionRow");
const modalRejectionReason = document.getElementById("modalRejectionReason");

const updateStatusForm = document.getElementById("updateStatusForm");
const updateStatusSelect = document.getElementById("updateStatusSelect");
const rejectionInputGroup = document.getElementById("rejectionInputGroup");
const rejectionReasonInput = document.getElementById("rejectionReasonInput");
const deleteBtn = document.getElementById("deleteBtn");

// Navigation Tab Switching
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    navBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(tab => tab.classList.remove("active"));

    btn.classList.add("active");
    const targetTab = document.getElementById(btn.getAttribute("data-target"));
    targetTab.classList.add("active");

    if (btn.getAttribute("data-target") === "summarySection") {
      renderSummary();
    }
  });
});

// ==========================================
// 2. Calculation Helpers
// ==========================================

// Calculates expected release date (Monday–Friday only, excluding weekends)
function calculateReleaseDate(startDateStr, workingDays) {
  let currentDate = new Date(startDateStr);
  let addedDays = 0;

  while (addedDays < workingDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return currentDate.toISOString().split("T")[0];
}

// Live Fee and Release Date preview
docTypeSelect.addEventListener("change", (e) => {
  const selectedType = e.target.value;

  if (selectedType && DOC_CONFIG[selectedType]) {
    const config = DOC_CONFIG[selectedType];
    const today = new Date().toISOString().split("T")[0];
    const expectedDate = calculateReleaseDate(today, config.workingDays);

    previewFee.textContent = `₱${config.fee}`;
    previewReleaseDate.textContent = expectedDate;
    previewCard.style.display = "block";
  } else {
    previewCard.style.display = "none";
  }
});

// Generates reference number format: REQ-<year>-<4-digit counter>
function generateReferenceNumber() {
  const currentYear = new Date().getFullYear();
  let maxCounter = 0;

  requests.forEach(req => {
    if (req.referenceNumber && req.referenceNumber.startsWith(`REQ-${currentYear}-`)) {
      const parts = req.referenceNumber.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxCounter) {
        maxCounter = num;
      }
    }
  });

  const nextCounter = String(maxCounter + 1).padStart(4, "0");
  return `REQ-${currentYear}-${nextCounter}`;
}

// ==========================================
// 3. LocalStorage Persistence
// ==========================================
function loadRequests() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  requests = storedData ? JSON.parse(storedData) : [];
}

function saveRequests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// ==========================================
// 4. Status Workflow & Actions Logic
// ==========================================

// Returns status badge CSS class
function getBadgeClass(status) {
  switch (status) {
    case "Submitted": return "badge-submitted";
    case "Processing": return "badge-processing";
    case "Ready for Pickup": return "badge-ready";
    case "Claimed": return "badge-claimed";
    case "Rejected": return "badge-rejected";
    default: return "";
  }
}

// Render Action column buttons according to allowed status workflow rules
function renderActionButtons(req) {
  const ref = req.referenceNumber;

  switch (req.status) {
    case "Submitted":
      return `
        <button class="btn btn-action-process" onclick="updateStatusDirectly('${ref}', 'Processing')">Process</button>
        <button class="btn btn-danger btn-action-reject" onclick="updateStatusDirectly('${ref}', 'Rejected')">Reject</button>
      `;

    case "Processing":
      return `
        <button class="btn btn-action-ready" onclick="updateStatusDirectly('${ref}', 'Ready for Pickup')">Ready</button>
        <button class="btn btn-danger btn-action-reject" onclick="updateStatusDirectly('${ref}', 'Rejected')">Reject</button>
      `;

    case "Ready for Pickup":
      return `
        <button class="btn btn-action-claimed" onclick="updateStatusDirectly('${ref}', 'Claimed')">Mark Claimed</button>
      `;

    case "Claimed":
    case "Rejected":
    default:
      // Final statuses: No state transition action buttons allowed
      return `<span style="font-size: 0.8rem; color: #94a3b8;">None</span>`;
  }
}

// Handler for direct status transition clicks from table action buttons
function updateStatusDirectly(refNum, newStatus) {
  const reqIndex = requests.findIndex(r => r.referenceNumber === refNum);
  if (reqIndex === -1) return;

  const today = new Date().toISOString().split("T")[0];

  // If status change is Rejected, prompt for a non-empty reason
  if (newStatus === "Rejected") {
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) return; // User cancelled prompt
    if (reason.trim() === "") {
      alert("Rejection reason is required!");
      return;
    }
    requests[reqIndex].rejectionReason = reason.trim();
  }

  // Set claim date automatically when marked as Claimed
  if (newStatus === "Claimed") {
    requests[reqIndex].claimDate = today;
  }

  // Update status, persist, and re-render
  requests[reqIndex].status = newStatus;
  saveRequests();
  renderRequests();

  if (typeof renderSummary === "function") {
    renderSummary();
  }
}

// Render Requests Table with Filters and Action Workflow
function renderRequests() {
  const query = searchInput.value.toLowerCase().trim();
  const statusVal = statusFilter.value;
  const docTypeVal = docTypeFilter.value;

  requestsTableBody.innerHTML = "";

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.referenceNumber.toLowerCase().includes(query) ||
      req.studentName.toLowerCase().includes(query) ||
      req.studentId.toLowerCase().includes(query);

    const matchesStatus = (statusVal === "All") || (req.status === statusVal);
    const matchesDocType = (docTypeVal === "All") || (req.documentType === docTypeVal);

    return matchesSearch && matchesStatus && matchesDocType;
  });

  if (filteredRequests.length === 0) {
    requestsTableBody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; color: #64748b;">No document requests found.</td>
      </tr>`;
    return;
  }

  filteredRequests.forEach(req => {
    const fee = req.fee || (DOC_CONFIG[req.documentType] ? DOC_CONFIG[req.documentType].fee : 0);
    const tr = document.createElement("tr");

    const actionButtons = renderActionButtons(req);

    tr.innerHTML = `
      <td><strong>${req.referenceNumber}</strong></td>
      <td>${req.studentName}</td>
      <td>${req.studentId}</td>
      <td>${req.course}</td>
      <td>${req.documentType}</td>
      <td>₱${fee}</td>
      <td>${req.dateRequested}</td>
      <td>${req.expectedReleaseDate}</td>
      <td>${req.claimDate ? req.claimDate : '<span style="color: #94a3b8;">-</span>'}</td>
      <td><span class="badge ${getBadgeClass(req.status)}">${req.status}</span></td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
          ${actionButtons}
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openDetailsModal('${req.referenceNumber}')">Details</button>
        </div>
      </td>
    `;

    requestsTableBody.appendChild(tr);
  });
}

// Render Summary Dashboard Metrics
function renderSummary() {
  const statusCounts = {
    "Submitted": 0,
    "Processing": 0,
    "Ready for Pickup": 0,
    "Claimed": 0,
    "Rejected": 0
  };

  const docTypeCounts = {
    "Certificate of Enrollment": 0,
    "Transcript of Records": 0,
    "Good Moral Certificate": 0
  };

  requests.forEach(req => {
    if (statusCounts[req.status] !== undefined) statusCounts[req.status]++;
    if (docTypeCounts[req.documentType] !== undefined) docTypeCounts[req.documentType]++;
  });

  statusSummaryContainer.innerHTML = Object.keys(statusCounts).map(status => `
    <div class="summary-card">
      <span class="label">${status}</span>
      <span class="count">${statusCounts[status]}</span>
    </div>
  `).join("");

  docTypeSummaryContainer.innerHTML = Object.keys(docTypeCounts).map(doc => `
    <div class="summary-card">
      <span class="label">${doc}</span>
      <span class="count">${docTypeCounts[doc]}</span>
    </div>
  `).join("");
}

// ==========================================
// 5. Form & Modal Handlers
// ==========================================

// Create Request Form Submit
requestForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedType = docTypeSelect.value;
  const today = new Date().toISOString().split("T")[0];
  const config = DOC_CONFIG[selectedType];
  const releaseDate = calculateReleaseDate(today, config.workingDays);

  const newRequest = {
    referenceNumber: generateReferenceNumber(),
    studentName: document.getElementById("studentName").value.trim(),
    studentId: document.getElementById("studentId").value.trim(),
    course: document.getElementById("course").value.trim(),
    documentType: selectedType,
    fee: config.fee,
    purpose: document.getElementById("purpose").value.trim(),
    dateRequested: today,
    status: "Submitted",
    expectedReleaseDate: releaseDate,
    claimDate: null,
    rejectionReason: null
  };

  requests.unshift(newRequest);
  saveRequests();
  renderRequests();

  requestForm.reset();
  previewCard.style.display = "none";

  alert(`Request Submitted! Reference Number: ${newRequest.referenceNumber}`);
});

// Open Details Modal
function openDetailsModal(refNum) {
  const req = requests.find(r => r.referenceNumber === refNum);
  if (!req) return;

  selectedRequestId = refNum;

  modalRefNum.textContent = req.referenceNumber;
  modalStudentName.textContent = req.studentName;
  modalStudentId.textContent = req.studentId;
  modalCourse.textContent = req.course;
  modalDocType.textContent = req.documentType;
  modalFee.textContent = `₱${req.fee || DOC_CONFIG[req.documentType].fee}`;
  modalPurpose.textContent = req.purpose;
  modalDateRequested.textContent = req.dateRequested;
  modalExpectedRelease.textContent = req.expectedReleaseDate;

  modalStatusBadge.textContent = req.status;
  modalStatusBadge.className = `badge ${getBadgeClass(req.status)}`;

  if (req.status === "Claimed" && req.claimDate) {
    modalClaimDateRow.style.display = "block";
    modalClaimDate.textContent = req.claimDate;
  } else {
    modalClaimDateRow.style.display = "none";
  }

  if (req.status === "Rejected" && req.rejectionReason) {
    modalRejectionRow.style.display = "block";
    modalRejectionReason.textContent = req.rejectionReason;
  } else {
    modalRejectionRow.style.display = "none";
  }

  updateStatusSelect.value = req.status;
  rejectionReasonInput.value = req.rejectionReason || "";
  toggleRejectionField(req.status);

  detailsModal.style.display = "block";
}

// Toggle Rejection Field Visibility
function toggleRejectionField(status) {
  if (status === "Rejected") {
    rejectionInputGroup.style.display = "block";
    rejectionReasonInput.required = true;
  } else {
    rejectionInputGroup.style.display = "none";
    rejectionReasonInput.required = false;
  }
}

updateStatusSelect.addEventListener("change", (e) => {
  toggleRejectionField(e.target.value);
});

// Save Status Update from Modal
updateStatusForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const reqIndex = requests.findIndex(r => r.referenceNumber === selectedRequestId);
  if (reqIndex === -1) return;

  const newStatus = updateStatusSelect.value;
  const today = new Date().toISOString().split("T")[0];

  requests[reqIndex].status = newStatus;

  if (newStatus === "Claimed") {
    requests[reqIndex].claimDate = today;
  } else {
    requests[reqIndex].claimDate = null;
  }

  if (newStatus === "Rejected") {
    requests[reqIndex].rejectionReason = rejectionReasonInput.value.trim();
  } else {
    requests[reqIndex].rejectionReason = null;
  }

  saveRequests();
  renderRequests();
  detailsModal.style.display = "none";
});

// Delete Record Action
deleteBtn.addEventListener("click", () => {
  if (confirm(`Are you sure you want to delete request ${selectedRequestId}?`)) {
    requests = requests.filter(r => r.referenceNumber !== selectedRequestId);
    saveRequests();
    renderRequests();
    detailsModal.style.display = "none";
  }
});

// Modal Close Handlers
closeModalBtn.addEventListener("click", () => {
  detailsModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === detailsModal) {
    detailsModal.style.display = "none";
  }
});

// Live Filters
searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);
docTypeFilter.addEventListener("change", renderRequests);

// ==========================================
// App Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  loadRequests();
  renderRequests();
});