/**
 * Academia Flow - Student Dashboard Logic (app.js)
 * Fully responsive client-side CRUD with stats metrics & local storage persistence.
 */

// Initial Seed Data
const DEFAULT_STUDENTS = [
  { id: "STU-202601", name: "Punju Sravani", email: "sravani@college.edu", course: "Computer Science", gpa: 3.92, status: "Active" },
  { id: "STU-202602", name: "Rahul Kumar", email: "rahul.k@college.edu", course: "Data Science", gpa: 3.68, status: "Active" },
  { id: "STU-202603", name: "Priya Sharma", email: "priya.s@college.edu", course: "Electrical Engineering", gpa: 2.85, status: "Probation" },
  { id: "STU-202604", name: "David Miller", email: "david.m@college.edu", course: "Business Administration", gpa: 3.42, status: "Active" },
  { id: "STU-202605", name: "Kiran Rao", email: "kiran.r@college.edu", course: "Mechanical Engineering", gpa: 1.95, status: "Suspended" }
];

// Application State
let students = [];

// DOM Elements
const elements = {
  dateDisplay: document.getElementById("date-display"),
  tableBody: document.getElementById("student-table-body"),
  emptyState: document.getElementById("table-empty-state"),
  
  // KPI Elements
  statTotalStudents: document.getElementById("stat-total-students"),
  statAverageGpa: document.getElementById("stat-average-gpa"),
  statActiveRate: document.getElementById("stat-active-rate"),
  statPopularCourse: document.getElementById("stat-popular-course"),

  // Controls
  searchInput: document.getElementById("search-input"),
  filterCourse: document.getElementById("filter-course"),
  filterStatus: document.getElementById("filter-status"),
  btnAddStudent: document.getElementById("btn-add-student"),

  // Modal
  modal: document.getElementById("student-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalBtnClose: document.getElementById("modal-btn-close"),
  modalBtnCancel: document.getElementById("modal-btn-cancel"),
  studentForm: document.getElementById("student-form"),
  formIndex: document.getElementById("student-form-index"),
  
  // Modal Fields
  formName: document.getElementById("student-name"),
  formEmail: document.getElementById("student-email"),
  formIdCode: document.getElementById("student-id-code"),
  formGpa: document.getElementById("student-gpa"),
  formCourse: document.getElementById("student-course"),
  formStatus: document.getElementById("student-status"),

  // Toast
  toastContainer: document.getElementById("toast-container")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initDate();
  loadData();
  setupEventListeners();
});

// Display Current Date
function initDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const today = new Date();
  elements.dateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

// Load data from LocalStorage or seed defaults
function loadData() {
  const localData = localStorage.getItem("academia_students");
  if (localData) {
    try {
      students = JSON.parse(localData);
    } catch (e) {
      console.error("Error parsing local student database, seeding default data...", e);
      students = [...DEFAULT_STUDENTS];
      saveToStorage();
    }
  } else {
    students = [...DEFAULT_STUDENTS];
    saveToStorage();
  }
  updateDashboard();
}

// Save database state to localStorage
function saveToStorage() {
  localStorage.setItem("academia_students", JSON.stringify(students));
}

// Setup App Events
function setupEventListeners() {
  // Modal Open
  elements.btnAddStudent.addEventListener("click", () => openModal());

  // Modal Close
  elements.modalBtnClose.addEventListener("click", closeModal);
  elements.modalBtnCancel.addEventListener("click", closeModal);
  elements.modal.addEventListener("click", (e) => {
    if (e.target === elements.modal) closeModal();
  });

  // Form Submit Action
  elements.studentForm.addEventListener("submit", handleFormSubmit);

  // Live Search & Filter updates
  elements.searchInput.addEventListener("input", filterAndRender);
  elements.filterCourse.addEventListener("change", filterAndRender);
  elements.filterStatus.addEventListener("change", filterAndRender);
}

// Update Table and KPI metrics
function updateDashboard() {
  filterAndRender();
  calculateMetrics();
}

// Dynamic KPI Calculator
function calculateMetrics() {
  const total = students.length;
  elements.statTotalStudents.textContent = total;

  if (total === 0) {
    elements.statAverageGpa.textContent = "0.00";
    elements.statActiveRate.textContent = "0%";
    elements.statPopularCourse.textContent = "N/A";
    return;
  }

  // 1. Average GPA
  const sumGpa = students.reduce((sum, s) => sum + parseFloat(s.gpa || 0), 0);
  const avgGpa = (sumGpa / total).toFixed(2);
  elements.statAverageGpa.textContent = avgGpa;

  // 2. Active Rate (%)
  const activeCount = students.filter(s => s.status === "Active").length;
  const activeRate = Math.round((activeCount / total) * 100);
  elements.statActiveRate.textContent = `${activeRate}%`;

  // 3. Top / Most Popular Course
  const courseCounts = {};
  students.forEach(s => {
    if (s.course) {
      courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
    }
  });

  let topCourse = "N/A";
  let maxCount = 0;
  for (const course in courseCounts) {
    if (courseCounts[course] > maxCount) {
      maxCount = courseCounts[course];
      topCourse = course;
    }
  }
  
  // Truncate course name for dashboard display if it's too long
  if (topCourse.length > 18) {
    topCourse = topCourse.slice(0, 15) + "...";
  }
  elements.statPopularCourse.textContent = topCourse;
}

// Filters data and renders rows dynamically
function filterAndRender() {
  const searchTerm = elements.searchInput.value.toLowerCase().trim();
  const courseFilter = elements.filterCourse.value;
  const statusFilter = elements.filterStatus.value;

  const filtered = students.filter(student => {
    // Search Term match (Name, ID, or Email)
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm) ||
      student.id.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm);

    // Course Filter match
    const matchesCourse = (courseFilter === "all" || student.course === courseFilter);

    // Status Filter match
    const matchesStatus = (statusFilter === "all" || student.status === statusFilter);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  renderTable(filtered);
}

// Render dynamic rows or empty state
function renderTable(data) {
  elements.tableBody.innerHTML = "";

  if (data.length === 0) {
    elements.emptyState.style.display = "flex";
    return;
  }

  elements.emptyState.style.display = "none";

  data.forEach(student => {
    // Find absolute index in main students array
    const absoluteIndex = students.findIndex(s => s.id === student.id);
    
    const tr = document.createElement("tr");
    
    // GPA badge matching logic
    let gpaClass = "gpa-poor";
    const gpaVal = parseFloat(student.gpa);
    if (gpaVal >= 3.5) gpaClass = "gpa-excellent";
    else if (gpaVal >= 3.0) gpaClass = "gpa-good";
    else if (gpaVal >= 2.0) gpaClass = "gpa-average";

    // Name initials for avatar
    const initials = student.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 2);

    tr.innerHTML = `
      <td>
        <div class="student-profile-cell">
          <div class="avatar">${initials}</div>
          <div class="student-meta">
            <span class="student-name">${escapeHTML(student.name)}</span>
            <span class="student-email">${escapeHTML(student.email)}</span>
          </div>
        </div>
      </td>
      <td><span class="student-id">${escapeHTML(student.id)}</span></td>
      <td>${escapeHTML(student.course)}</td>
      <td><span class="gpa-badge ${gpaClass}">${gpaVal.toFixed(2)}</span></td>
      <td>
        <span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit-action" title="Edit Student Details" onclick="editStudent(${absoluteIndex})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-action btn-delete-action" title="Delete Student Record" onclick="deleteStudent(${absoluteIndex})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    elements.tableBody.appendChild(tr);
  });
}

// Modal open with conditional layout settings (Create vs Update)
function openModal(editIndex = null) {
  elements.studentForm.reset();
  
  if (editIndex !== null) {
    // Edit mode
    const student = students[editIndex];
    elements.modalTitle.textContent = "Edit Student Record";
    elements.formIndex.value = editIndex;
    
    elements.formName.value = student.name;
    elements.formEmail.value = student.email;
    elements.formIdCode.value = student.id;
    // Keep ID field read-only during updates to preserve keys
    elements.formIdCode.setAttribute("readonly", "true");
    elements.formIdCode.style.opacity = "0.6";
    
    elements.formGpa.value = student.gpa;
    elements.formCourse.value = student.course;
    elements.formStatus.value = student.status;
  } else {
    // Add mode
    elements.modalTitle.textContent = "Add Student Record";
    elements.formIndex.value = "";
    elements.formIdCode.removeAttribute("readonly");
    elements.formIdCode.style.opacity = "1";
    
    // Auto-generate a dummy ID code
    const randomIdSuffix = Math.floor(1000 + Math.random() * 9000);
    elements.formIdCode.value = `STU-2026${randomIdSuffix}`;
  }

  elements.modal.classList.add("active");
}

// Modal close
function closeModal() {
  elements.modal.classList.remove("active");
}

// Submit validation & actions
function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = elements.formName.value.trim();
  const email = elements.formEmail.value.trim();
  const idCode = elements.formIdCode.value.trim();
  const gpa = parseFloat(elements.formGpa.value);
  const course = elements.formCourse.value;
  const status = elements.formStatus.value;
  const editIndexVal = elements.formIndex.value;

  // Visual/Logical Form Validation
  if (!name || !email || !idCode || isNaN(gpa) || !course || !status) {
    showToast("Please verify all form fields are filled out correctly.", "error");
    return;
  }

  if (gpa < 0 || gpa > 4.0) {
    showToast("GPA must be a score value between 0.0 and 4.0.", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  const newStudent = { id: idCode, name, email, course, gpa, status };

  if (editIndexVal !== "") {
    // Edit Action
    const index = parseInt(editIndexVal);
    students[index] = newStudent;
    showToast("Student details updated successfully!");
  } else {
    // Add Action
    // Check ID unique constraint
    const duplicate = students.some(s => s.id.toUpperCase() === idCode.toUpperCase());
    if (duplicate) {
      showToast(`Student with ID code ${idCode} already exists in the system.`, "error");
      return;
    }
    students.unshift(newStudent);
    showToast("New student registered successfully!");
  }

  saveToStorage();
  updateDashboard();
  closeModal();
}

// Trigger Edit form from table action
window.editStudent = function(index) {
  openModal(index);
};

// Trigger Delete operation from table action
window.deleteStudent = function(index) {
  const student = students[index];
  const confirmed = confirm(`Are you sure you want to delete the student record for ${student.name} (${student.id})?`);
  
  if (confirmed) {
    students.splice(index, 1);
    saveToStorage();
    updateDashboard();
    showToast("Student record deleted successfully.", "info");
  }
};

// Floating Interactive Notifications Helper
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-xmark";
  if (type === "info") icon = "fa-circle-info";

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);

  // Transition out and destroy elements
  setTimeout(() => {
    toast.classList.add("fadeOut");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3000);
}

// XSS Sanitizer Helper
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
