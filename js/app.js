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
  const alertBanner = document.getElementById("alertBanner");
  
  const requestsTableBody = document.getElementById("requestsTableBody");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const docTypeFilter = document.getElementById("docTypeFilter");
  
  const navBtns = document.querySelectorAll(".nav-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  const statusSummaryContainer = document.getElementById("statusSummaryContainer");
  const docTypeSummaryContainer = document.getElementById("docTypeSummaryContainer");
  
  // Student Status Lookup References
  const statusLookupForm = document.getElementById("statusLookupForm");
  const lookupRefInput = document.getElementById("lookupRefInput");
  const lookupMessage = document.getElementById("lookupMessage");
  const statusResultCard = document.getElementById("statusResultCard");
  const resultStatusBadge = document.getElementById("resultStatusBadge");
  const resultFee = document.getElementById("resultFee");
  const resultReleaseDate = document.getElementById("resultReleaseDate");
  const resultClaimDateRow = document.getElementById("resultClaimDateRow");
  const resultClaimDate = document.getElementById("resultClaimDate");
  const resultRejectionRow = document.getElementById("resultRejectionRow");
  const resultRejectionReason = document.getElementById("resultRejectionReason");
  
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
  
  // Navigation Tabs Handling
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
  // 2. Inline Banner Alerts (Red/Green)
  // ==========================================
  function showAlert(message, type = "error") {
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner ${type === "success" ? "alert-success" : "alert-error"}`;
    alertBanner.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  
  function clearAlert() {
    alertBanner.style.display = "none";
    alertBanner.textContent = "";
  }
  
  // ==========================================
  // 3. Date & Reference Number Helpers
  // ==========================================
  function calculateReleaseDate(startDateStr, workingDays) {
    let currentDate = new Date(startDateStr);
    let addedDays = 0;
  
    while (addedDays < workingDays) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }
  
    return currentDate.toISOString().split("T")[0];
  }
  
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
  // 4. Persistence
  // ==========================================
  function loadRequests() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    requests = storedData ? JSON.parse(storedData) : [];
  }
  
  function saveRequests() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }
  
  // ==========================================
  // 5. Validation Logic
  // ==========================================
  function validateRequestForm(name, studentId, course, docType, purpose) {
    if (!name || !studentId || !course || !docType || !purpose) {
      return "All form fields are required.";
    }
  
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    if (!nameRegex.test(name)) {
      return "Student name must contain letters, spaces, dots, or hyphens only.";
    }
  
    const studentIdRegex = /^\d{4}-\d{1,6}$\vert{}^\d{4,10}$/;
    if (!studentIdRegex.test(studentId)) {
      return "Student ID must follow a format like 2026-00123 or digits only.";
    }
  
    if (purpose.length < 5) {
      return "Purpose must be at least 5 characters long.";
    }
  
    const activeDuplicate = requests.find(req => 
      req.studentId.toLowerCase() === studentId.toLowerCase() &&
      req.documentType === docType &&
      (req.status === "Submitted" || req.status === "Processing")
    );
  
    if (activeDuplicate) {
      return `Student ${studentId} already has an active request for '${docType}' (${activeDuplicate.referenceNumber}) currently in '${activeDuplicate.status}' status.`;
    }
  
    return null;
  }
  
  // ==========================================
  // 6. UI Rendering & Filter Logic
  // ==========================================
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
        return `<span style="font-size: 0.8rem; color: #94a3b8;">None</span>`;
    }
  }
  
  function updateStatusDirectly(refNum, newStatus) {
    clearAlert();
    const reqIndex = requests.findIndex(r => r.referenceNumber === refNum);
    if (reqIndex === -1) return;
  
    const currentReq = requests[reqIndex];
    const today = new Date().toISOString().split("T")[0];
  
    if (newStatus === "Claimed" && currentReq.status !== "Ready for Pickup") {
      showAlert(`Request ${refNum} can only be marked as Claimed if it is Ready for Pickup.`, "error");
      return;
    }
  
    if (newStatus === "Rejected") {
      const reason = prompt("Please enter the reason for rejection:");
      if (reason === null) return;
      if (!reason || reason.trim() === "") {
        showAlert("Rejection failed: A valid rejection reason is required.", "error");
        return;
      }
      requests[reqIndex].rejectionReason = reason.trim();
    }
  
    if (newStatus === "Claimed") {
      requests[reqIndex].claimDate = today;
    }
  
    requests[reqIndex].status = newStatus;
    saveRequests();
    renderRequests();
    renderSummary();
  
    showAlert(`Request ${refNum} status updated to '${newStatus}'.`, "success");
  }
  
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
          <td colspan="11" style="text-align: center; color: #64748b; padding: 20px;">
            No requests found matching the filter criteria.
          </td>
        </tr>`;
      return;
    }
  
    filteredRequests.forEach(req => {
      const fee = req.fee || (DOC_CONFIG[req.documentType] ? DOC_CONFIG[req.documentType].fee : 0);
      const tr = document.createElement("tr");
  
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
            ${renderActionButtons(req)}
            <button class="btn btn-secondary btn-details" onclick="openDetailsModal('${req.referenceNumber}')">Details</button>
          </div>
        </td>
      `;
  
      requestsTableBody.appendChild(tr);
    });
  }
  
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
  // 7. Student Status Lookup
  // ==========================================
  function resetLookupView() {
    lookupMessage.style.display = "none";
    statusResultCard.style.display = "none";
    resultClaimDateRow.style.display = "none";
    resultRejectionRow.style.display = "none";
  }
  
  statusLookupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    resetLookupView();
  
    const refInput = lookupRefInput.value.trim();
  
    if (!refInput) {
      lookupMessage.textContent = "Please enter a reference number.";
      lookupMessage.style.backgroundColor = "#fee2e2";
      lookupMessage.style.color = "#b91c1c";
      lookupMessage.style.display = "block";
      return;
    }
  
    const match = requests.find(req => req.referenceNumber.toLowerCase() === refInput.toLowerCase());
  
    if (!match) {
      lookupMessage.textContent = "Reference number not found.";
      lookupMessage.style.backgroundColor = "#fee2e2";
      lookupMessage.style.color = "#b91c1c";
      lookupMessage.style.display = "block";
      return;
    }
  
    const fee = match.fee || (DOC_CONFIG[match.documentType] ? DOC_CONFIG[match.documentType].fee : 0);
  
    resultStatusBadge.textContent = match.status;
    resultStatusBadge.className = `badge ${getBadgeClass(match.status)}`;
    resultFee.textContent = `₱${fee}`;
    resultReleaseDate.textContent = match.expectedReleaseDate;
  
    if (match.status === "Claimed" && match.claimDate) {
      resultClaimDate.textContent = match.claimDate;
      resultClaimDateRow.style.display = "block";
    }
  
    if (match.status === "Rejected" && match.rejectionReason) {
      resultRejectionReason.textContent = match.rejectionReason;
      resultRejectionRow.style.display = "block";
    }
  
    statusResultCard.style.display = "block";
  });
  
  // ==========================================
  // 8. Form & Modal Handlers
  // ==========================================
  
  // Create Request Form
  requestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();
  
    const name = document.getElementById("studentName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const course = document.getElementById("course").value.trim();
    const selectedType = docTypeSelect.value;
    const purpose = document.getElementById("purpose").value.trim();
  
    const validationError = validateRequestForm(name, studentId, course, selectedType, purpose);
    if (validationError) {
      showAlert(validationError, "error");
      return;
    }
  
    const today = new Date().toISOString().split("T")[0];
    const config = DOC_CONFIG[selectedType];
    const releaseDate = calculateReleaseDate(today, config.workingDays);
  
    const newRequest = {
      referenceNumber: generateReferenceNumber(),
      studentName: name,
      studentId: studentId,
      course: course,
      documentType: selectedType,
      fee: config.fee,
      purpose: purpose,
      dateRequested: today,
      status: "Submitted",
      expectedReleaseDate: releaseDate,
      claimDate: null,
      rejectionReason: null
    };
  
    requests.unshift(newRequest);
    saveRequests();
    renderRequests();
    renderSummary();
  
    requestForm.reset();
    previewCard.style.display = "none";
  
    showAlert(`Request submitted successfully! Reference Number: ${newRequest.referenceNumber}`, "success");
  });
  
  // Modal Actions
  function openDetailsModal(refNum) {
    clearAlert();
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
  
  function toggleRejectionField(status) {
    if (status === "Rejected") {
      rejectionInputGroup.style.display = "block";
    } else {
      rejectionInputGroup.style.display = "none";
    }
  }
  
  updateStatusSelect.addEventListener("change", (e) => {
    toggleRejectionField(e.target.value);
  });
  
  // Update Status from Modal
  updateStatusForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();
  
    const reqIndex = requests.findIndex(r => r.referenceNumber === selectedRequestId);
    if (reqIndex === -1) return;
  
    const currentReq = requests[reqIndex];
    const newStatus = updateStatusSelect.value;
    const today = new Date().toISOString().split("T")[0];
  
    if (newStatus === "Claimed" && currentReq.status !== "Ready for Pickup") {
      showAlert(`Cannot mark ${selectedRequestId} as Claimed unless it is currently 'Ready for Pickup'.`, "error");
      return;
    }
  
    if (newStatus === "Rejected") {
      const reason = rejectionReasonInput.value.trim();
      if (!reason) {
        showAlert("Reason for rejection is required when setting status to Rejected.", "error");
        return;
      }
      requests[reqIndex].rejectionReason = reason;
    } else {
      requests[reqIndex].rejectionReason = null;
    }
  
    if (newStatus === "Claimed") {
      requests[reqIndex].claimDate = today;
    } else {
      requests[reqIndex].claimDate = null;
    }
  
    requests[reqIndex].status = newStatus;
    saveRequests();
    renderRequests();
    renderSummary();
    detailsModal.style.display = "none";
  
    showAlert(`Request ${selectedRequestId} status successfully updated to '${newStatus}'.`, "success");
  });
  
  // Delete Record Action
  deleteBtn.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete request ${selectedRequestId}?`)) {
      requests = requests.filter(r => r.referenceNumber !== selectedRequestId);
      saveRequests();
      renderRequests();
      renderSummary();
      detailsModal.style.display = "none";
      showAlert(`Record ${selectedRequestId} deleted successfully.`, "success");
    }
  });
  
  closeModalBtn.addEventListener("click", () => { detailsModal.style.display = "none"; });
  window.addEventListener("click", (event) => {
    if (event.target === detailsModal) detailsModal.style.display = "none";
  });
  
  // Real-time Search & Filter Event Listeners
  searchInput.addEventListener("input", renderRequests);
  statusFilter.addEventListener("change", renderRequests);
  docTypeFilter.addEventListener("change", renderRequests);
  
  // App Initialization
  document.addEventListener("DOMContentLoaded", () => {
    loadRequests();
    renderRequests();
    renderSummary();
  });