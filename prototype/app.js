import {
  getConfiguredMembers,
  getFirebaseConfigStatus,
  getFirebaseService,
  isFirebaseConfigured,
} from "./firebase-service.js";

const EXPENSE_STORAGE_KEY = "together-accounting-demo-v3";
const SESSION_STORAGE_KEY = "together-accounting-session-v2";
const APP_MODE_STORAGE_KEY = "together-accounting-app-mode-v1";

const members = getConfiguredMembers();
const categories = [
  { id: "餐饮", icon: "🍽️" },
  { id: "买菜", icon: "🛒" },
  { id: "日用", icon: "🧴" },
  { id: "出行", icon: "🚕" },
  { id: "房租水电", icon: "🏠" },
  { id: "其他", icon: "✍️" },
];

const initialExpenses = [
  {
    id: "e-1",
    amount: 42.5,
    category: "餐饮",
    note: "公司楼下买了两杯咖啡",
    spentAt: "2026-07-02T09:10",
    ownerUid: "me",
    recordedByMemberKey: "me",
    recordedByName: "抖",
    recordedByAccentClass: "member-dou",
    createdAt: "2026-07-02T09:12",
  },
  {
    id: "e-2",
    amount: 89,
    category: "买菜",
    note: "晚上做饭买的牛肉和蔬菜",
    spentAt: "2026-07-01T18:20",
    ownerUid: "wife",
    recordedByMemberKey: "wife",
    recordedByName: "宝",
    recordedByAccentClass: "member-bao",
    createdAt: "2026-07-01T18:35",
  },
  {
    id: "e-3",
    amount: 26,
    category: "出行",
    note: "下雨打车回家",
    spentAt: "2026-07-01T21:05",
    ownerUid: "wife",
    recordedByMemberKey: "wife",
    recordedByName: "宝",
    recordedByAccentClass: "member-bao",
    createdAt: "2026-07-01T21:08",
  },
  {
    id: "e-4",
    amount: 318,
    category: "日用",
    note: "超市补了纸巾、洗衣液和厨房用品",
    spentAt: "2026-06-29T16:40",
    ownerUid: "me",
    recordedByMemberKey: "me",
    recordedByName: "抖",
    recordedByAccentClass: "member-dou",
    createdAt: "2026-06-29T22:14",
  },
];

const state = {
  activeTab: "timeline",
  mode: loadAppMode(),
  currentUser: null,
  currentProfile: null,
  selectedCategory: categories[0].id,
  editingExpenseId: null,
  expenses: loadLocalExpenses(),
  cloudReady: isFirebaseConfigured(),
  cloudService: null,
  cloudAuthUser: null,
  cloudUnsubscribe: null,
};

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
});

const loginScreen = document.querySelector("#login-screen");
const loginTitle = document.querySelector("#login-title");
const loginActions = document.querySelector("#login-actions");
const loginModeNote = document.querySelector("#login-mode-note");
const cloudAuthCard = document.querySelector("#cloud-auth-card");
const cloudAuthCopy = document.querySelector("#cloud-auth-copy");
const cloudAuthForm = document.querySelector("#cloud-auth-form");
const cloudAuthFeedback = document.querySelector("#cloud-auth-feedback");
const appShell = document.querySelector(".app-shell");
const sessionPill = document.querySelector(".session-pill");
const currentUserLabel = document.querySelector("#current-user-label");
const switchUserButton = document.querySelector("#switch-user");
const categoryGrid = document.querySelector("#category-grid");
const categoryInput = document.querySelector("#category-input");
const customCategoryWrap = document.querySelector("#custom-category-wrap");
const customCategoryInput = document.querySelector("#custom-category-input");
const summaryGrid = document.querySelector("#summary-grid");
const timeline = document.querySelector("#timeline");
const ledgerList = document.querySelector("#ledger-list");
const form = document.querySelector("#expense-form");
const formKicker = document.querySelector("#form-kicker");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const tabButtons = document.querySelectorAll("[data-tab]");
const openTabButtons = document.querySelectorAll("[data-open-tab]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");

if (state.mode === "demo") {
  state.currentUser = loadSession();
  state.currentProfile = getMemberByKey(state.currentUser);
}

void bootstrap();

async function bootstrap() {
  registerServiceWorker();
  bindEvents();
  renderLoginActions();
  renderCloudAuthCard();
  renderCurrentUser();
  renderCategoryGrid();
  setDefaultDateTime();
  renderApp();
  syncLoginState();

  if (state.cloudReady) {
    state.cloudService = await getFirebaseService();
    attachCloudAuthWatcher();
  } else if (state.mode !== "demo") {
    state.mode = "demo";
    persistAppMode();
  }
}

function bindEvents() {
  loginActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-login-member]");
    if (!button) return;

    startDemoMode(button.dataset.loginMember);
  });

  switchUserButton.addEventListener("click", async () => {
    if (state.mode === "cloud" && state.cloudService) {
      await state.cloudService.signOut();
      return;
    }

    state.currentUser = null;
    state.currentProfile = null;
    exitEditMode();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    renderCurrentUser();
    renderApp();
    syncLoginState();
  });

  cloudAuthForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.cloudService) return;

    const submitter = event.submitter;
    const action = submitter?.dataset.authAction;
    const formData = new FormData(cloudAuthForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      showCloudAuthFeedback("请先输入邮箱和密码。", true);
      return;
    }

    try {
      if (action === "sign-up") {
        await state.cloudService.signUp(email, password);
        showCloudAuthFeedback("注册成功，正在进入共享账本。", false);
      } else {
        await state.cloudService.signIn(email, password);
        showCloudAuthFeedback("登录成功，正在同步账本。", false);
      }
    } catch (error) {
      showCloudAuthFeedback(getReadableAuthError(error), true);
    }
  });

  categoryGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    state.selectedCategory = button.dataset.category;
    renderCategoryGrid();
  });

  customCategoryInput.addEventListener("input", () => {
    syncCategoryValue();
  });

  timeline.addEventListener("click", handleExpenseActionClick);
  ledgerList.addEventListener("click", handleExpenseActionClick);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });

  openTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.openTab);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.currentUser || !state.currentProfile) {
      syncLoginState();
      return;
    }

    syncCategoryValue();
    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const category = String(formData.get("category") || "").trim();

    if (!category) {
      customCategoryInput.focus();
      return;
    }

    const existingExpense = getExpenseById(state.editingExpenseId);
    const expense = {
      id: existingExpense?.id ?? "",
      amount,
      category,
      note: String(formData.get("note") || "").trim(),
      spentAt: String(formData.get("spentAt")),
      ownerUid: getCurrentOwnerUid(),
      recordedByMemberKey: state.currentProfile.key,
      recordedByName: state.currentProfile.name,
      recordedByAccentClass: state.currentProfile.accentClass,
      createdAt: existingExpense?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (state.mode === "cloud" && state.cloudService && state.cloudAuthUser) {
      try {
        await state.cloudService.saveExpense(
          expense,
          state.cloudAuthUser,
          state.currentProfile
        );
        exitEditMode();
        setActiveTab("timeline");
        return;
      } catch (error) {
        showCloudAuthFeedback(`保存失败：${error.message}`, true);
        return;
      }
    }

    if (state.editingExpenseId) {
      state.expenses = state.expenses
        .map((item) => (item.id === state.editingExpenseId ? expense : item))
        .sort(sortBySpentAtDesc);
    } else {
      expense.id = crypto.randomUUID();
      state.expenses = [expense, ...state.expenses].sort(sortBySpentAtDesc);
    }

    persistLocalExpenses();
    renderApp();
    exitEditMode();
    setActiveTab("timeline");
  });

  cancelEditButton.addEventListener("click", () => {
    exitEditMode();
  });
}

function attachCloudAuthWatcher() {
  state.cloudService.watchAuth(({ user, member, error }) => {
    if (error) {
      if (state.cloudUnsubscribe) {
        state.cloudUnsubscribe();
        state.cloudUnsubscribe = null;
      }
      state.mode = state.cloudReady ? "cloud" : "demo";
      state.currentUser = null;
      state.currentProfile = null;
      state.cloudAuthUser = null;
      state.expenses = [];
      renderCurrentUser();
      renderApp();
      syncLoginState();
      showCloudAuthFeedback(error, true);
      return;
    }

    if (!user || !member) {
      if (state.cloudUnsubscribe) {
        state.cloudUnsubscribe();
        state.cloudUnsubscribe = null;
      }

      if (state.mode === "cloud") {
        state.currentUser = null;
        state.currentProfile = null;
        state.cloudAuthUser = null;
        state.expenses = [];
        renderCurrentUser();
        renderApp();
        syncLoginState();
      }
      return;
    }

    state.mode = "cloud";
    state.currentUser = member.key;
    state.currentProfile = member;
    state.cloudAuthUser = user;
    persistAppMode();
    showCloudAuthFeedback("云同步已连接。", false);
    renderCurrentUser();
    subscribeCloudExpenses();
    syncLoginState();
  });
}

function subscribeCloudExpenses() {
  if (!state.cloudService) return;

  if (state.cloudUnsubscribe) {
    state.cloudUnsubscribe();
  }

  state.cloudUnsubscribe = state.cloudService.watchExpenses((expenses) => {
    state.expenses = expenses.sort(sortBySpentAtDesc);
    renderApp();
  });
}

function startDemoMode(memberKey) {
  state.mode = "demo";
  state.currentUser = memberKey;
  state.currentProfile = getMemberByKey(memberKey);
  state.cloudAuthUser = null;
  state.expenses = loadLocalExpenses();
  exitEditMode();
  persistSession();
  persistAppMode();
  hideCloudAuthFeedback();
  renderCurrentUser();
  renderApp();
  syncLoginState();
}

function renderApp() {
  renderSummary();
  renderTimeline();
  renderLedger();
  renderFormMode();
}

function renderLoginActions() {
  loginActions.innerHTML = members
    .map(
      (member) => `
        <button class="login-button ${member.accentClass}" type="button" data-login-member="${member.key}">
          这是${member.name}在用
          <small>继续本地演示</small>
        </button>
      `
    )
    .join("");
}

function renderCloudAuthCard() {
  const configStatus = getFirebaseConfigStatus();

  if (!configStatus.enabled) {
    cloudAuthForm.classList.add("hidden");
    cloudAuthCopy.textContent =
      "还没有启用 Firebase。先把 firebase-config.js 里的 enabled 改成 true。";
    loginModeNote.textContent = "本地演示";
    hideCloudAuthFeedback();
    return;
  }

  if (!configStatus.ready) {
    cloudAuthForm.classList.add("hidden");
    const missingParts = [];
    if (configStatus.missingProjectFields.length) {
      missingParts.push(
        `项目配置缺少：${configStatus.missingProjectFields.join("、")}`
      );
    }
    if (configStatus.membersMissingEmails.length) {
      missingParts.push(
        `成员邮箱未填：${configStatus.membersMissingEmails.join("、")}`
      );
    }
    cloudAuthCopy.textContent = `Firebase 已开启，但还没填完整。${missingParts.join("；")}。`;
    loginModeNote.textContent = "本地演示 + 云端待配置";
    showCloudAuthFeedback(
      "把上面的缺项补齐后，登录表单会自动出现。",
      true
    );
    return;
  }

  cloudAuthForm.classList.remove("hidden");
  cloudAuthCopy.textContent = "邮箱密码登录后，两个人会进入同一本共享账本并实时同步。";
  loginModeNote.textContent = "本地演示 + 云端同步";
  hideCloudAuthFeedback();
}

function renderCurrentUser() {
  const accentClass = state.currentProfile?.accentClass ?? "";
  currentUserLabel.textContent = state.currentProfile
    ? `当前：${state.currentProfile.name}`
    : "未登录";
  appShell.className = `app-shell ${accentClass}`.trim();
  currentUserLabel.className = `current-user-label ${accentClass}`;
  switchUserButton.className = `text-button ${accentClass}`;
  sessionPill.className = `session-pill ${accentClass}`;
}

function syncLoginState() {
  const shouldHideLogin = Boolean(state.currentUser);
  loginScreen.classList.toggle("visible", !shouldHideLogin);
  loginTitle.textContent = state.cloudReady
    ? "继续演示，或者直接进入云端版"
    : "先确认一下这是谁的设备";
}

function renderCategoryGrid() {
  categoryGrid.innerHTML = categories
    .map((category) => {
      const activeClass = category.id === state.selectedCategory ? "active" : "";
      return `
        <button class="category-chip ${activeClass}" type="button" data-category="${category.id}">
          <span>${category.icon}</span>
          <strong>${category.id}</strong>
        </button>
      `;
    })
    .join("");

  const isCustomCategory = state.selectedCategory === "其他";
  customCategoryWrap.classList.toggle("hidden", !isCustomCategory);
  syncCategoryValue();
}

function renderSummary() {
  const thisMonthExpenses = state.expenses.filter(isCurrentMonthExpense);
  const total = sumBy(thisMonthExpenses, (item) => item.amount);
  const myTotal = sumBy(
    thisMonthExpenses.filter((item) => getExpenseMemberKey(item) === "me"),
    (item) => item.amount
  );
  const wifeTotal = sumBy(
    thisMonthExpenses.filter((item) => getExpenseMemberKey(item) === "wife"),
    (item) => item.amount
  );

  summaryGrid.innerHTML = `
    <article class="summary-card">
      <p class="summary-label">本月总支出</p>
      <p class="summary-value">${formatCurrency(total)}</p>
      <p class="summary-note">${thisMonthExpenses.length} 笔记录</p>
    </article>
    <article class="summary-card">
      <p class="summary-label">${getMemberName("me")}记的账</p>
      <p class="summary-value">${formatCurrency(myTotal)}</p>
      <p class="summary-note">${countByMember(thisMonthExpenses, "me")} 笔</p>
    </article>
    <article class="summary-card">
      <p class="summary-label">${getMemberName("wife")}记的账</p>
      <p class="summary-value">${formatCurrency(wifeTotal)}</p>
      <p class="summary-note">${countByMember(thisMonthExpenses, "wife")} 笔</p>
    </article>
  `;
}

function renderTimeline() {
  if (!state.expenses.length) {
    timeline.innerHTML = `<p class="empty-copy">还没有记录，先去记第一笔吧。</p>`;
    return;
  }

  const groups = groupExpensesByDate(state.expenses);
  timeline.innerHTML = groups
    .map(([date, items]) => {
      const groupItems = items
        .map((item) => {
          const recorder = getExpenseRecorderName(item);
          const recorderClass = getExpenseRecorderClass(item);

          return `
            <article class="timeline-item">
              <div class="timeline-top">
                <div>
                  <h3 class="timeline-title">${item.category}</h3>
                  <div class="meta-row">
                    <span class="tag">${formatTime(item.spentAt)}</span>
                    <span class="tag member ${recorderClass}">记账人：${recorder}</span>
                  </div>
                </div>
                <p class="amount">${formatCurrency(item.amount)}</p>
              </div>
              ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
            </article>
          `;
        })
        .join("");

      return `
        <section class="timeline-group">
          <p class="timeline-date">${date}</p>
          ${groupItems}
        </section>
      `;
    })
    .join("");
}

function renderLedger() {
  if (!state.expenses.length) {
    ledgerList.innerHTML = `<p class="empty-copy">账本还是空的，新增一笔就会出现在这里。</p>`;
    return;
  }

  ledgerList.innerHTML = state.expenses
    .map((item) => {
      const recorderClass = getExpenseRecorderClass(item);
      const actionMarkup = renderExpenseActions(item);
      return `
        <article class="ledger-row">
          <div class="ledger-row-top">
            <div>
              <h3 class="ledger-title">${item.category}</h3>
              <div class="ledger-meta">
                <span class="tag">${formatDateTime(item.spentAt)}</span>
                <span class="tag member ${recorderClass}">记账人：${getExpenseRecorderName(item)}</span>
              </div>
            </div>
            <p class="amount">${formatCurrency(item.amount)}</p>
          </div>
          ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
          ${actionMarkup}
        </article>
      `;
    })
    .join("");
}

function renderExpenseActions(item) {
  if (!isOwnedByCurrentUser(item)) {
    return "";
  }

  return `
    <div class="expense-actions">
      <button class="mini-button" type="button" data-action="edit-expense" data-id="${item.id}">
        编辑
      </button>
      <button class="mini-button danger" type="button" data-action="delete-expense" data-id="${item.id}">
        删除
      </button>
    </div>
  `;
}

function setActiveTab(tab) {
  state.activeTab = tab;

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tab);
  });
}

function resetFormDefaults() {
  state.selectedCategory = categories[0].id;
  customCategoryInput.value = "";
  renderCategoryGrid();
  setDefaultDateTime();
}

function renderFormMode() {
  const isEditing = Boolean(state.editingExpenseId);
  formKicker.textContent = isEditing ? "编辑记录" : "新增记录";
  formTitle.textContent = isEditing ? "修改这笔账" : "记一笔";
  submitButton.textContent = isEditing ? "保存修改" : "保存这笔记录";
  cancelEditButton.classList.toggle("hidden", !isEditing);
}

function handleExpenseActionClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const expenseId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit-expense") {
    startEditExpense(expenseId);
    return;
  }

  if (action === "delete-expense") {
    void deleteExpense(expenseId);
  }
}

function startEditExpense(expenseId) {
  const expense = getExpenseById(expenseId);
  if (!expense || !isOwnedByCurrentUser(expense)) return;

  state.editingExpenseId = expense.id;
  if (categories.some((category) => category.id === expense.category && category.id !== "其他")) {
    state.selectedCategory = expense.category;
    customCategoryInput.value = "";
  } else {
    state.selectedCategory = "其他";
    customCategoryInput.value = expense.category;
  }
  renderCategoryGrid();

  form.elements.amount.value = expense.amount;
  form.elements.spentAt.value = toLocalInputValue(expense.spentAt);
  form.elements.note.value = expense.note ?? "";
  renderFormMode();
  setActiveTab("add");
}

async function deleteExpense(expenseId) {
  const expense = getExpenseById(expenseId);
  if (!expense || !isOwnedByCurrentUser(expense)) return;

  const confirmed = window.confirm("确定删除这笔记录吗？");
  if (!confirmed) return;

  if (state.mode === "cloud" && state.cloudService) {
    await state.cloudService.deleteExpense(expenseId);
    if (state.editingExpenseId === expenseId) {
      exitEditMode();
    }
    return;
  }

  state.expenses = state.expenses.filter((item) => item.id !== expenseId);
  persistLocalExpenses();

  if (state.editingExpenseId === expenseId) {
    exitEditMode();
  }

  renderApp();
}

function exitEditMode() {
  state.editingExpenseId = null;
  form.reset();
  resetFormDefaults();
  renderFormMode();
}

function syncCategoryValue() {
  if (state.selectedCategory === "其他") {
    categoryInput.value = customCategoryInput.value.trim();
    customCategoryInput.required = true;
    return;
  }

  categoryInput.value = state.selectedCategory;
  customCategoryInput.required = false;
}

function setDefaultDateTime() {
  const input = form.elements.spentAt;
  if (!input) return;

  input.value = toLocalInputValue(new Date().toISOString());
}

function toLocalInputValue(value) {
  const now = new Date();
  const date = value ? new Date(value) : now;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function loadLocalExpenses() {
  try {
    const saved = localStorage.getItem(EXPENSE_STORAGE_KEY);
    if (!saved) {
      return initialExpenses.map(normalizeLocalExpense).sort(sortBySpentAtDesc);
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return initialExpenses.map(normalizeLocalExpense).sort(sortBySpentAtDesc);
    }

    return parsed.map(normalizeLocalExpense).sort(sortBySpentAtDesc);
  } catch {
    return initialExpenses.map(normalizeLocalExpense).sort(sortBySpentAtDesc);
  }
}

function persistLocalExpenses() {
  if (state.mode !== "demo") return;
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(state.expenses));
}

function loadSession() {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return members.some((member) => member.key === saved) ? saved : null;
  } catch {
    return null;
  }
}

function persistSession() {
  if (!state.currentUser) return;
  localStorage.setItem(SESSION_STORAGE_KEY, state.currentUser);
}

function loadAppMode() {
  try {
    const saved = localStorage.getItem(APP_MODE_STORAGE_KEY);
    return saved === "cloud" ? "cloud" : "demo";
  } catch {
    return "demo";
  }
}

function persistAppMode() {
  localStorage.setItem(APP_MODE_STORAGE_KEY, state.mode);
}

function groupExpensesByDate(expenses) {
  const grouped = new Map();

  expenses.forEach((item) => {
    const key = formatDateHeading(item.spentAt);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  });

  return [...grouped.entries()];
}

function sortBySpentAtDesc(a, b) {
  return new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime();
}

function isCurrentMonthExpense(item) {
  const now = new Date();
  const spentAt = new Date(item.spentAt);
  return (
    spentAt.getFullYear() === now.getFullYear() &&
    spentAt.getMonth() === now.getMonth()
  );
}

function sumBy(items, getter) {
  return items.reduce((sum, item) => sum + getter(item), 0);
}

function countByMember(items, memberKey) {
  return items.filter((item) => getExpenseMemberKey(item) === memberKey).length;
}

function getMemberByKey(key) {
  return members.find((member) => member.key === key) ?? null;
}

function getMemberName(key) {
  return getMemberByKey(key)?.name ?? "未知成员";
}

function getMemberAccentClass(key) {
  return getMemberByKey(key)?.accentClass ?? "";
}

function getCurrentOwnerUid() {
  if (state.mode === "cloud" && state.cloudAuthUser) {
    return state.cloudAuthUser.uid;
  }

  return state.currentUser ?? "";
}

function getExpenseMemberKey(item) {
  return item.recordedByMemberKey || item.recordedByUid || "";
}

function getExpenseRecorderName(item) {
  return item.recordedByName || getMemberName(getExpenseMemberKey(item));
}

function getExpenseRecorderClass(item) {
  return item.recordedByAccentClass || getMemberAccentClass(getExpenseMemberKey(item));
}

function getExpenseById(expenseId) {
  if (!expenseId) return null;
  return state.expenses.find((item) => item.id === expenseId) ?? null;
}

function normalizeLocalExpense(item) {
  const memberKey = item.recordedByMemberKey || item.recordedByUid || "me";
  return {
    ...item,
    ownerUid: item.ownerUid || item.recordedByUid || memberKey,
    recordedByMemberKey: memberKey,
    recordedByName: item.recordedByName || getMemberName(memberKey),
    recordedByAccentClass:
      item.recordedByAccentClass || getMemberAccentClass(memberKey),
  };
}

function isOwnedByCurrentUser(item) {
  if (state.mode === "cloud") {
    return Boolean(state.cloudAuthUser) && item.ownerUid === state.cloudAuthUser.uid;
  }

  return Boolean(state.currentUser) && item.ownerUid === state.currentUser;
}

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function formatDateHeading(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function showCloudAuthFeedback(message, isError) {
  cloudAuthFeedback.textContent = message;
  cloudAuthFeedback.className = `cloud-auth-feedback ${isError ? "error" : "success"}`;
}

function hideCloudAuthFeedback() {
  cloudAuthFeedback.textContent = "";
  cloudAuthFeedback.className = "cloud-auth-feedback hidden";
}

function getReadableAuthError(error) {
  const code = String(error?.code || "");
  const messages = {
    "auth/invalid-email": "邮箱格式不对。",
    "auth/missing-password": "请先输入密码。",
    "auth/weak-password": "密码至少需要 6 位。",
    "auth/email-already-in-use": "这个邮箱已经注册过了。",
    "auth/invalid-credential": "邮箱或密码不对。",
    "auth/user-not-found": "没有找到这个账号。",
    "auth/network-request-failed": "网络连接失败，请稍后再试。",
  };

  return messages[code] || error?.message || "登录失败，请再试一次。";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
