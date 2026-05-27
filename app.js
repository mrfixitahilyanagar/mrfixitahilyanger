const STORAGE_KEY = "mr-fixit-shop-data-v1";

const schemas = {
  phones: {
    label: "phone",
    title: "Phones",
    fields: [
      { key: "model", label: "Model", required: true, placeholder: "iPhone 13 / Redmi Note 12" },
      { key: "type", label: "Type", type: "select", options: ["New", "Second hand"] },
      { key: "storage", label: "Storage", placeholder: "128 GB" },
      { key: "condition", label: "Condition", placeholder: "Fresh / Good / Display changed" },
      { key: "buyPrice", label: "Buying price", type: "number" },
      { key: "sellPrice", label: "Selling price", type: "number" },
      { key: "stock", label: "Stock", type: "number", value: 1 },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  covers: {
    label: "cover",
    title: "Covers",
    fields: [
      { key: "model", label: "Phone model", required: true, placeholder: "iPhone 14 / Vivo Y21" },
      { key: "style", label: "Cover style", placeholder: "Silicone / Transparent / Armor" },
      { key: "color", label: "Color" },
      { key: "price", label: "Selling price", type: "number" },
      { key: "stock", label: "Stock", type: "number", value: 1 },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  repairs: {
    label: "repair",
    title: "Repairs",
    fields: [
      { key: "customer", label: "Customer name", required: true },
      { key: "phone", label: "Phone model", required: true, placeholder: "iPhone 11" },
      { key: "issue", label: "Problem", required: true, placeholder: "Battery / Display / Charging" },
      { key: "status", label: "Status", type: "select", options: ["Open", "Waiting parts", "Done", "Delivered"] },
      { key: "cost", label: "Repair charge", type: "number" },
      { key: "advance", label: "Advance paid", type: "number" },
      { key: "phoneNumber", label: "Customer mobile number", type: "tel" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  customers: {
    label: "customer",
    title: "Customers",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "phoneNumber", label: "Mobile number", type: "tel", required: true },
      { key: "device", label: "Device" },
      { key: "lastVisit", label: "Last visit", type: "date" },
      { key: "balance", label: "Balance", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  }
};

let activeTab = "phones";
let editingId = null;
let state = loadState();

const list = document.querySelector("#list");
const searchInput = document.querySelector("#searchInput");
const addBtn = document.querySelector("#addBtn");
const dialog = document.querySelector("#entryDialog");
const form = document.querySelector("#entryForm");
const formFields = document.querySelector("#formFields");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogKicker = document.querySelector("#dialogKicker");
const deleteBtn = document.querySelector("#deleteBtn");
const backupBtn = document.querySelector("#backupBtn");
const emailBtn = document.querySelector("#emailBtn");
const importBtn = document.querySelector("#importBtn");
const importInput = document.querySelector("#importInput");
const closeDialogBtn = document.querySelector("#closeDialogBtn");
const cancelBtn = document.querySelector("#cancelBtn");

function loadState() {
  const fallback = {
    phones: [
      { id: crypto.randomUUID(), model: "iPhone 12", type: "Second hand", storage: "128 GB", condition: "Good", buyPrice: 22000, sellPrice: 26500, stock: 1, notes: "Blue color" },
      { id: crypto.randomUUID(), model: "Samsung A15", type: "New", storage: "128 GB", condition: "Sealed", buyPrice: 0, sellPrice: 15499, stock: 2, notes: "" }
    ],
    covers: [
      { id: crypto.randomUUID(), model: "iPhone 13", style: "Transparent", color: "Clear", price: 199, stock: 8, notes: "" },
      { id: crypto.randomUUID(), model: "OnePlus Nord", style: "Armor", color: "Black", price: 299, stock: 5, notes: "" }
    ],
    repairs: [
      { id: crypto.randomUUID(), customer: "Sample Customer", phone: "iPhone XR", issue: "Battery replacement", status: "Open", cost: 2200, advance: 500, phoneNumber: "9876543210", notes: "Call when ready" }
    ],
    customers: [
      { id: crypto.randomUUID(), name: "Sample Customer", phoneNumber: "9876543210", device: "iPhone XR", lastVisit: new Date().toISOString().slice(0, 10), balance: 1700, notes: "Repair customer" }
    ]
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function money(value) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

function filteredRecords() {
  const term = searchInput.value.trim().toLowerCase();
  return state[activeTab].filter((record) => JSON.stringify(record).toLowerCase().includes(term));
}

function renderStats() {
  const openRepairs = state.repairs.filter((repair) => !["Done", "Delivered"].includes(repair.status)).length;
  const phoneValue = state.phones.reduce((sum, phone) => sum + Number(phone.sellPrice || 0) * Number(phone.stock || 0), 0);
  const coverValue = state.covers.reduce((sum, cover) => sum + Number(cover.price || 0) * Number(cover.stock || 0), 0);

  document.querySelector("#todayCount").textContent = `${openRepairs} open repair job${openRepairs === 1 ? "" : "s"}`;
  document.querySelector("#todayValue").textContent = `Inventory value: ${money(phoneValue + coverValue)}`;
  document.querySelector("#phoneCount").textContent = state.phones.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  document.querySelector("#coverCount").textContent = state.covers.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  document.querySelector("#repairCount").textContent = state.repairs.length;
}

function recordTitle(record) {
  if (activeTab === "phones") return record.model;
  if (activeTab === "covers") return `${record.model} cover`;
  if (activeTab === "repairs") return `${record.customer} - ${record.phone}`;
  return record.name;
}

function recordMeta(record) {
  if (activeTab === "phones") return [record.type, record.storage, money(record.sellPrice), `Stock ${record.stock || 0}`];
  if (activeTab === "covers") return [record.style, record.color, money(record.price), `Stock ${record.stock || 0}`];
  if (activeTab === "repairs") return [record.issue, record.status, money(record.cost), record.phoneNumber];
  return [record.phoneNumber, record.device, record.lastVisit, record.balance ? `Balance ${money(record.balance)}` : ""];
}

function renderList() {
  const records = filteredRecords();
  addBtn.textContent = `Add ${schemas[activeTab].label}`;

  if (!records.length) {
    list.innerHTML = `<div class="empty">No ${schemas[activeTab].title.toLowerCase()} found. Add your first record.</div>`;
    return;
  }

  list.innerHTML = records.map((record) => {
    const meta = recordMeta(record).filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    const status = activeTab === "repairs" ? `<span class="pill">${escapeHtml(record.status || "Open")}</span>` : "";
    return `
      <article class="record-card">
        <div>
          <h3>${escapeHtml(recordTitle(record))}</h3>
          <p class="meta">${meta}</p>
        </div>
        <div>
          ${status}
          <button class="secondary-button" type="button" data-edit="${record.id}">Edit</button>
        </div>
      </article>
    `;
  }).join("");
}

function render() {
  renderStats();
  renderList();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatEmailData() {
  const lines = [
    "Mr Fixit shop data",
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    "",
    "Phones"
  ];

  state.phones.forEach((phone, index) => {
    lines.push(`${index + 1}. ${phone.model || "-"} | ${phone.type || "-"} | ${phone.storage || "-"} | Sell ${money(phone.sellPrice)} | Stock ${phone.stock || 0}`);
    if (phone.notes) lines.push(`   Notes: ${phone.notes}`);
  });

  lines.push("", "Covers");
  state.covers.forEach((cover, index) => {
    lines.push(`${index + 1}. ${cover.model || "-"} | ${cover.style || "-"} | ${cover.color || "-"} | Price ${money(cover.price)} | Stock ${cover.stock || 0}`);
    if (cover.notes) lines.push(`   Notes: ${cover.notes}`);
  });

  lines.push("", "Repairs");
  state.repairs.forEach((repair, index) => {
    lines.push(`${index + 1}. ${repair.customer || "-"} | ${repair.phone || "-"} | ${repair.issue || "-"} | ${repair.status || "-"} | Charge ${money(repair.cost)} | Advance ${money(repair.advance)} | Mobile ${repair.phoneNumber || "-"}`);
    if (repair.notes) lines.push(`   Notes: ${repair.notes}`);
  });

  lines.push("", "Customers");
  state.customers.forEach((customer, index) => {
    lines.push(`${index + 1}. ${customer.name || "-"} | Mobile ${customer.phoneNumber || "-"} | Device ${customer.device || "-"} | Balance ${money(customer.balance)} | Last visit ${customer.lastVisit || "-"}`);
    if (customer.notes) lines.push(`   Notes: ${customer.notes}`);
  });

  lines.push("", "For full backup, also use the DL button and keep the JSON file safe.");
  return lines.join("\n");
}

function openDialog(record = null) {
  editingId = record?.id || null;
  const schema = schemas[activeTab];
  dialogKicker.textContent = editingId ? "Edit record" : "New record";
  dialogTitle.textContent = `${editingId ? "Edit" : "Add"} ${schema.label}`;
  deleteBtn.hidden = !editingId;

  formFields.innerHTML = schema.fields.map((field) => {
    const value = record?.[field.key] ?? field.value ?? "";
    if (field.type === "select") {
      return `
        <label class="field">${field.label}
          <select name="${field.key}" ${field.required ? "required" : ""}>
            ${field.options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>`;
    }

    if (field.type === "textarea") {
      return `
        <label class="field">${field.label}
          <textarea name="${field.key}" placeholder="${field.placeholder || ""}">${escapeHtml(value)}</textarea>
        </label>`;
    }

    return `
      <label class="field">${field.label}
        <input name="${field.key}" type="${field.type || "text"}" value="${escapeHtml(value)}" placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""}>
      </label>`;
  }).join("");

  dialog.showModal();
}

function readForm() {
  const data = { id: editingId || crypto.randomUUID() };
  const formData = new FormData(form);
  schemas[activeTab].fields.forEach((field) => {
    const value = formData.get(field.key);
    data[field.key] = field.type === "number" ? Number(value || 0) : value;
  });
  return data;
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    searchInput.value = "";
    renderList();
  });
});

addBtn.addEventListener("click", () => openDialog());
searchInput.addEventListener("input", renderList);

list.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  if (!editButton) return;
  const record = state[activeTab].find((item) => item.id === editButton.dataset.edit);
  openDialog(record);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const record = readForm();
  const records = state[activeTab];
  const existingIndex = records.findIndex((item) => item.id === editingId);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.unshift(record);
  }

  dialog.close();
  saveState();
});

deleteBtn.addEventListener("click", () => {
  if (!editingId) return;
  state[activeTab] = state[activeTab].filter((record) => record.id !== editingId);
  dialog.close();
  saveState();
});

[closeDialogBtn, cancelBtn].forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});

backupBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mr-fixit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

emailBtn.addEventListener("click", () => {
  const savedEmail = localStorage.getItem("mr-fixit-email") || "";
  const email = prompt("Enter your email address", savedEmail);
  if (!email) return;

  localStorage.setItem("mr-fixit-email", email);
  const subject = `Mr Fixit shop data - ${new Date().toISOString().slice(0, 10)}`;
  const body = formatEmailData();
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported.phones || !imported.covers || !imported.repairs || !imported.customers) {
      throw new Error("Invalid backup file");
    }
    state = imported;
    saveState();
  } catch (error) {
    alert(error.message);
  } finally {
    importInput.value = "";
  }
});

render();
