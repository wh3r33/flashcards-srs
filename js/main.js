import { applyTheme, appShell, bindShell, windowHtml } from "./layout.js";
import { isSupabaseConfigured } from "./supabaseClient.js";
import { getSession, login, redirectIfAuthed, register, requireAuth } from "./auth.js";
import { createDeck, copyPublicDeck, deleteDeck, getDeck, listDecks, listPublicDecks, updateDeck } from "./decks.js";
import { createCard, createCards, deleteCard, listCards, updateCard, dueCards } from "./cards.js";
import { dashboardStats, reviewCard } from "./reviews.js";
import { exportCardsCsv, parseCsv } from "./csv.js";
import { explainCard, generateCards } from "./ai.js";
import { renderReviewsChart } from "./charts.js";
import { $, $$, escapeHtml, formDataObject, getParam, requireConfigNotice, setMessage, splitTags, tagsToText } from "./utils.js";

applyTheme();

const app = document.getElementById("app");
const page = document.body.dataset.page;

const cardTypes = [
  ["basic", "Вопрос и ответ"],
  ["reverse", "Обратная карточка"],
  ["multiple_choice", "Выбор ответа"],
  ["cloze", "Пропуск"]
];

function typeLabel(value) {
  return cardTypes.find(([key]) => key === value)?.[1] || "Вопрос и ответ";
}

function typeOptions(selected = "basic") {
  return cardTypes.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function authNotice() {
  return isSupabaseConfigured() ? "" : requireConfigNotice();
}

function renderLanding() {
  app.innerHTML = `
    <main class="desktop single-window">
      ${windowHtml("StudyOS.exe", `
        ${authNotice()}
        <div class="hero-layout">
          <div>
            <h1 class="hero-title">StudyOS.exe</h1>
            <p class="hero-copy">Ретро-система для карточек, интервальных повторений, публичных колод и генерации учебных карточек через серверную ИИ-функцию.</p>
            <div class="row">
              <a class="win-button" href="/register.html">Создать аккаунт</a>
              <a class="win-button" href="/login.html">Войти</a>
              <a class="win-button" href="/public.html">Открыть каталог</a>
            </div>
          </div>
          <div class="desktop-preview" aria-label="Рабочий стол StudyOS">
            <div class="desktop-icon"><div class="ico"></div>Deck_Manager.exe</div>
            <div class="desktop-icon"><div class="ico"></div>flashcards.exe</div>
            <div class="desktop-icon"><div class="ico"></div>AI_Generator.exe</div>
            <div class="window mini-window">
              <div class="title-bar"><span>System_Monitor.exe</span><span class="window-controls"><b>_</b><b>□</b><b>×</b></span></div>
              <div class="window-body"><div class="chart"><div class="bar" style="height:35px">2</div><div class="bar" style="height:80px">6</div><div class="bar" style="height:55px">4</div><div class="bar" style="height:120px">9</div><div class="bar" style="height:65px">5</div><div class="bar" style="height:95px">7</div><div class="bar" style="height:40px">3</div></div></div>
            </div>
          </div>
        </div>
      `, "hero-window")}
    </main>
  `;
}

async function renderRegister() {
  await redirectIfAuthed();
  app.innerHTML = `<main class="desktop single-window">${windowHtml("Register.exe", `
    ${authNotice()}
    <form id="registerForm">
      <label>Почта<input name="email" type="email" required autocomplete="email"></label>
      <label>Пароль<input name="password" type="password" minlength="6" required autocomplete="new-password"></label>
      <button class="win-button" type="submit">Зарегистрироваться</button>
      <a class="win-button" href="/login.html">Уже есть аккаунт</a>
      <div id="message" class="message hidden"></div>
    </form>
  `, "hero-window")}</main>`;
  $("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#message");
    setMessage(message, "Создаю аккаунт...");
    try {
      const data = formDataObject(event.target);
      await register(data.email, data.password);
      setMessage(message, "Аккаунт создан. Проверьте почту, если включено подтверждение.", "success");
      setTimeout(() => location.href = "/dashboard.html", 800);
    } catch (error) {
      setMessage(message, error.message, "danger");
    }
  });
}

async function renderLogin() {
  await redirectIfAuthed();
  app.innerHTML = `<main class="desktop single-window">${windowHtml("Login.exe", `
    ${authNotice()}
    <form id="loginForm">
      <label>Почта<input name="email" type="email" required autocomplete="email"></label>
      <label>Пароль<input name="password" type="password" required autocomplete="current-password"></label>
      <button class="win-button" type="submit">Войти</button>
      <a class="win-button" href="/register.html">Создать аккаунт</a>
      <div id="message" class="message hidden"></div>
    </form>
  `, "hero-window")}</main>`;
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#message");
    setMessage(message, "Вхожу...");
    try {
      const data = formDataObject(event.target);
      await login(data.email, data.password);
      location.href = getParam("next") || "/dashboard.html";
    } catch (error) {
      setMessage(message, error.message, "danger");
    }
  });
}

async function renderDashboard() {
  await requireAuth();
  app.innerHTML = appShell("System_Monitor.exe", `
    ${authNotice()}
    <div id="message" class="message">Загружаю статистику...</div>
    <div class="grid five" id="stats"></div>
    <div class="toolbar"><a class="win-button" href="/training.html">Быстрая тренировка</a><a class="win-button" href="/decks.html">Открыть колоды</a></div>
    <div class="panel"><strong>Повторы за 7 дней</strong><div class="chart" id="chart"></div></div>
  `, "dashboard.html");
  bindShell();
  try {
    const stats = await dashboardStats();
    $("#message").remove();
    $("#stats").innerHTML = [
      ["К сроку сегодня", stats.dueToday],
      ["Всего колод", stats.totalDecks],
      ["Всего карточек", stats.totalCards],
      ["Повторов за неделю", stats.reviewedWeek],
      ["Точность", `${stats.accuracy}%`],
      ["Выучено", stats.learned],
      ["Всего повторов", stats.totalReviews]
    ].map(([label, value]) => `<div class="panel">${label}<span class="stat-value">${value}</span></div>`).join("");
    renderReviewsChart($("#chart"), stats.recentReviews);
  } catch (error) {
    setMessage($("#message"), error.message, "danger");
  }
}

function deckForm(deck = {}) {
  return `
    <form id="deckForm">
      <input type="hidden" name="id" value="${escapeHtml(deck.id || "")}">
      <label>Название<input name="name" required value="${escapeHtml(deck.name || "")}"></label>
      <label>Описание<textarea name="description">${escapeHtml(deck.description || "")}</textarea></label>
      <label class="row"><input style="width:auto" type="checkbox" name="is_public" ${deck.is_public ? "checked" : ""}> Публичная колода</label>
      <button class="win-button" type="submit">${deck.id ? "Сохранить" : "Создать колоду"}</button>
    </form>
  `;
}

async function renderDecks() {
  const session = await requireAuth();
  app.innerHTML = appShell("Deck_Manager.exe", `
    <div class="split">
      <div class="panel">${deckForm()}<div id="formMessage" class="message hidden"></div></div>
      <div>
        <div class="toolbar"><input id="deckSearch" placeholder="Поиск колод"><button class="win-button" id="deckSearchButton">Найти</button></div>
        <ul class="list" id="deckList"><li class="message">Загружаю колоды...</li></ul>
      </div>
    </div>
  `, "decks.html");
  bindShell();
  const load = async () => {
    const decks = await listDecks($("#deckSearch").value.trim());
    $("#deckList").innerHTML = decks.length ? decks.map((deck) => `
      <li class="list-item">
        <header><strong>${escapeHtml(deck.name)}</strong><span class="badge">${deck.is_public ? "Публичная" : "Приватная"}</span></header>
        <p>${escapeHtml(deck.description || "Без описания")}</p>
        <div class="row">
          <a class="win-button" href="/deck.html?id=${deck.id}">Открыть</a>
          <button class="win-button" data-edit="${deck.id}">Править</button>
          <button class="win-button" data-delete="${deck.id}">Удалить</button>
        </div>
      </li>`).join("") : `<li class="message">Колоды не найдены.</li>`;
    $$("[data-edit]").forEach((button) => button.addEventListener("click", async () => {
      const deck = await getDeck(button.dataset.edit);
      $(".panel").innerHTML = deckForm(deck) + `<div id="formMessage" class="message hidden"></div>`;
      bindDeckForm(load, session.user.id);
    }));
    $$("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm("Удалить колоду?")) return;
      await deleteDeck(button.dataset.delete);
      await load();
    }));
  };
  bindDeckForm(load, session.user.id);
  $("#deckSearchButton").addEventListener("click", load);
  $("#deckSearch").addEventListener("input", load);
  await load();
}

function bindDeckForm(load, userId) {
  $("#deckForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#formMessage");
    setMessage(message, "Сохраняю...");
    try {
      const data = formDataObject(event.target);
      const payload = { name: data.name, description: data.description, is_public: event.target.is_public.checked };
      if (data.id) await updateDeck(data.id, payload);
      else await createDeck(payload, userId);
      event.target.reset();
      setMessage(message, "Готово.", "success");
      await load();
    } catch (error) {
      setMessage(message, error.message, "danger");
    }
  });
}

function cardForm(card = {}) {
  return `
    <form id="cardForm">
      <input type="hidden" name="id" value="${escapeHtml(card.id || "")}">
      <label>Лицевая сторона<textarea name="front" required>${escapeHtml(card.front || "")}</textarea></label>
      <label>Обратная сторона<textarea name="back" required>${escapeHtml(card.back || "")}</textarea></label>
      <div class="grid two">
        <label>Категория<input name="category" value="${escapeHtml(card.category || "")}"></label>
        <label>Теги через запятую<input name="tags" value="${escapeHtml(tagsToText(card.tags))}"></label>
      </div>
      <label>Тип карточки<select name="card_type">${typeOptions(card.card_type || "basic")}</select></label>
      <button class="win-button" type="submit">${card.id ? "Сохранить карточку" : "Создать карточку"}</button>
    </form>
  `;
}

async function renderDeckDetail() {
  const session = await getSession();
  const deckId = getParam("id");
  const deck = await getDeck(deckId);
  const canEdit = session && session.user.id === deck.user_id;
  app.innerHTML = appShell("Deck_Manager.exe", `
    <div class="toolbar">
      ${canEdit ? `<a class="win-button" href="/training.html?deck=${deck.id}">Тренировать</a>` : ""}
      <button class="win-button" id="exportCsv">Экспорт CSV</button>
      ${canEdit ? `<label class="win-button">Импорт CSV<input id="importCsv" type="file" accept=".csv,text/csv" class="hidden"></label>
      <button class="win-button" id="aiOpen">Сгенерировать из текста</button>` : ""}
    </div>
    <h1>${escapeHtml(deck.name)}</h1>
    <p>${escapeHtml(deck.description || "Без описания")}</p>
    <div class="split">
      ${canEdit ? `<div class="panel">${cardForm()}<div id="cardMessage" class="message hidden"></div></div>` : `<div class="panel">Это публичный просмотр. Чтобы редактировать, скопируйте колоду себе из каталога.</div>`}
      <div>
        <div class="toolbar"><input id="categoryFilter" placeholder="Категория"><input id="tagFilter" placeholder="Тег"><button class="win-button" id="filterButton">Фильтр</button></div>
        <ul class="list" id="cardList"><li class="message">Загружаю карточки...</li></ul>
      </div>
    </div>
    <div id="modalRoot"></div>
  `, "decks.html");
  bindShell();
  let currentCards = [];
  const load = async () => {
    currentCards = await listCards(deckId, { category: $("#categoryFilter").value.trim(), tag: $("#tagFilter").value.trim() });
    $("#cardList").innerHTML = currentCards.length ? currentCards.map((card) => `
      <li class="list-item">
        <header><strong>${escapeHtml(card.front)}</strong><span class="badge">${escapeHtml(typeLabel(card.card_type))}</span></header>
        <p>${escapeHtml(card.back)}</p>
        <p class="muted">${escapeHtml(card.category || "Без категории")} ${escapeHtml(tagsToText(card.tags))}</p>
        ${canEdit ? `<div class="row"><button class="win-button" data-card-edit="${card.id}">Править</button><button class="win-button" data-card-delete="${card.id}">Удалить</button></div>` : ""}
      </li>`).join("") : `<li class="message">Карточек пока нет.</li>`;
    if (canEdit) {
      $$("[data-card-edit]").forEach((button) => button.addEventListener("click", () => {
        const card = currentCards.find((item) => item.id === button.dataset.cardEdit);
        $(".panel").innerHTML = cardForm(card) + `<div id="cardMessage" class="message hidden"></div>`;
        bindCardForm(deckId, load);
      }));
      $$("[data-card-delete]").forEach((button) => button.addEventListener("click", async () => {
        if (!confirm("Удалить карточку?")) return;
        await deleteCard(button.dataset.cardDelete);
        await load();
      }));
    }
  };
  if (canEdit) bindCardForm(deckId, load);
  $("#filterButton").addEventListener("click", load);
  $("#exportCsv").addEventListener("click", () => exportCardsCsv(currentCards, deck.name));
  if (canEdit) {
    $("#importCsv").addEventListener("change", async (event) => {
      const text = await event.target.files[0].text();
      const rows = parseCsv(text).map((row) => ({ ...row, deck_id: deckId, interval_days: 1, ease_factor: 2.5, next_review_at: new Date().toISOString() }));
      await createCards(rows);
      await load();
    });
    $("#aiOpen").addEventListener("click", () => openAiModal(deckId, load));
  }
  await load();
}

function bindCardForm(deckId, load) {
  $("#cardForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#cardMessage");
    setMessage(message, "Сохраняю...");
    try {
      const data = formDataObject(event.target);
      const payload = {
        deck_id: deckId,
        front: data.front,
        back: data.back,
        category: data.category || null,
        tags: splitTags(data.tags),
        card_type: data.card_type
      };
      if (data.id) await updateCard(data.id, payload);
      else await createCard(payload);
      event.target.reset();
      setMessage(message, "Карточка сохранена.", "success");
      await load();
    } catch (error) {
      setMessage(message, error.message, "danger");
    }
  });
}

function openAiModal(deckId, load) {
  $("#modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <section class="window modal">
        <div class="title-bar"><span>AI_Generator.exe</span><span class="window-controls"><b>_</b><b>□</b><b>×</b></span></div>
        <div class="window-body">
          <form id="aiForm">
            <label>Текст для карточек<textarea name="text" required></textarea></label>
            <label>Количество<select name="amount"><option>5</option><option>10</option><option>20</option></select></label>
            <button class="win-button" type="submit">Сгенерировать из текста</button>
          </form>
          <div id="aiMessage" class="message hidden"></div>
          <form id="aiPreview" class="list"></form>
          <div class="row"><button class="win-button" id="saveGenerated" type="button">Сохранить выбранные</button><button class="win-button" id="closeAi" type="button">Закрыть</button></div>
        </div>
      </section>
    </div>`;
  let generated = [];
  $("#closeAi").addEventListener("click", () => $("#modalRoot").innerHTML = "");
  $("#aiForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage($("#aiMessage"), "Генерирую карточки...");
    try {
      const data = formDataObject(event.target);
      generated = await generateCards(data.text, Number(data.amount));
      $("#aiPreview").innerHTML = generated.map((card, index) => `
        <label class="list-item preview-card">
          <input type="checkbox" name="pick" value="${index}" checked>
          <span><strong>${escapeHtml(card.front)}</strong><br>${escapeHtml(card.back)}<br><span class="muted">${escapeHtml(card.category || "")} ${escapeHtml(tagsToText(card.tags))}</span></span>
        </label>`).join("");
      setMessage($("#aiMessage"), "Выберите карточки для сохранения.", "success");
    } catch (error) {
      setMessage($("#aiMessage"), `ИИ не смог сгенерировать карточки: ${error.message}`, "danger");
    }
  });
  $("#saveGenerated").addEventListener("click", async () => {
    const picked = $$("input[name='pick']:checked").map((input) => generated[Number(input.value)]);
    await createCards(picked.map((card) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      category: card.category || null,
      tags: Array.isArray(card.tags) ? card.tags : [],
      card_type: card.card_type || "basic",
      interval_days: 1,
      ease_factor: 2.5,
      next_review_at: new Date().toISOString()
    })));
    $("#modalRoot").innerHTML = "";
    await load();
  });
}

async function renderTraining() {
  await requireAuth();
  app.innerHTML = appShell("flashcards.exe", `
    <div id="trainingMessage" class="message">Загружаю карточки к повторению...</div>
    <div class="training-card" id="trainingCard"></div>
    <div class="toolbar">
      <button class="win-button" id="showAnswer">Показать ответ</button>
      <button class="win-button hidden" id="explainButton">Объясни мне эту тему</button>
    </div>
    <div class="rating-grid hidden" id="ratings">
      <button class="win-button" data-rating="again">Не знал</button>
      <button class="win-button" data-rating="hard">Сложно</button>
      <button class="win-button" data-rating="normal">Норм</button>
      <button class="win-button" data-rating="easy">Легко</button>
    </div>
    <div id="explanation" class="white-panel hidden"></div>
    <button class="win-button hidden" id="nextAfterExplain">Следующая карточка</button>
  `, "training.html");
  bindShell();
  const cards = await dueCards(getParam("deck"));
  let index = 0;
  let showingAnswer = false;
  const draw = () => {
    $("#explanation").classList.add("hidden");
    $("#explainButton").classList.add("hidden");
    $("#nextAfterExplain").classList.add("hidden");
    if (index >= cards.length) {
      setMessage($("#trainingMessage"), "На сейчас карточек нет.", "success");
      $("#trainingCard").textContent = "Повторения завершены";
      $("#showAnswer").classList.add("hidden");
      $("#ratings").classList.add("hidden");
      return;
    }
    setMessage($("#trainingMessage"), `Карточка ${index + 1} из ${cards.length}`);
    showingAnswer = false;
    $("#trainingCard").textContent = cards[index].front;
    $("#showAnswer").classList.remove("hidden");
    $("#ratings").classList.add("hidden");
  };
  $("#showAnswer").addEventListener("click", () => {
    showingAnswer = true;
    $("#trainingCard").textContent = cards[index].back;
    $("#showAnswer").classList.add("hidden");
    $("#ratings").classList.remove("hidden");
  });
  $$("[data-rating]").forEach((button) => button.addEventListener("click", async () => {
    if (!showingAnswer) return;
    const rating = button.dataset.rating;
    await reviewCard(cards[index], rating);
    if (rating === "again") $("#explainButton").classList.remove("hidden");
    else {
      index += 1;
      draw();
    }
  }));
  $("#explainButton").addEventListener("click", async () => {
    $("#explanation").classList.remove("hidden");
    $("#explanation").textContent = "Готовлю объяснение...";
    try {
      $("#explanation").textContent = await explainCard(cards[index]);
    } catch (error) {
      $("#explanation").textContent = `ИИ не смог объяснить тему: ${error.message}`;
    }
    index += 1;
    $("#nextAfterExplain").classList.remove("hidden");
  });
  $("#nextAfterExplain").addEventListener("click", draw);
  draw();
}

async function renderProfile() {
  const session = await requireAuth();
  app.innerHTML = appShell("Profile.exe", `
    <div class="white-panel">
      <strong>Почта</strong><br>${escapeHtml(session.user.email)}
    </div>
    <div class="toolbar"><button class="win-button" id="themeToggleLocal">Переключить тему</button></div>
    <p class="muted">Настройки темы сохраняются в localStorage. Сессия Supabase сохраняется после обновления страницы.</p>
  `, "profile.html");
  bindShell();
  $("#themeToggleLocal").addEventListener("click", () => $("#themeToggle").click());
}

async function renderPublic() {
  const session = await getSession();
  app.innerHTML = appShell("File_Explorer.exe", `
    ${authNotice()}
    <div class="toolbar"><input id="publicSearch" placeholder="Поиск публичных колод"><button class="win-button" id="publicSearchButton">Найти</button></div>
    <ul class="list" id="publicList"><li class="message">Загружаю каталог...</li></ul>
  `, "public.html");
  bindShell();
  const load = async () => {
    try {
      const decks = await listPublicDecks($("#publicSearch").value.trim());
      $("#publicList").innerHTML = decks.length ? decks.map((deck) => `
        <li class="list-item">
          <header><strong>${escapeHtml(deck.name)}</strong><span class="badge">Публичная</span></header>
          <p>${escapeHtml(deck.description || "Без описания")}</p>
          <div class="row">
            <a class="win-button" href="/deck.html?id=${deck.id}">Просмотр</a>
            <button class="win-button" data-copy="${deck.id}" ${session ? "" : "disabled"}>Копировать себе</button>
          </div>
        </li>`).join("") : `<li class="message">Публичные колоды не найдены.</li>`;
      $$("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
        const copied = await copyPublicDeck(button.dataset.copy, session.user.id);
        location.href = `/deck.html?id=${copied.id}`;
      }));
    } catch (error) {
      setMessage($("#publicList"), error.message, "danger");
    }
  };
  $("#publicSearchButton").addEventListener("click", load);
  $("#publicSearch").addEventListener("input", load);
  await load();
}

const routes = {
  landing: renderLanding,
  register: renderRegister,
  login: renderLogin,
  dashboard: renderDashboard,
  decks: renderDecks,
  deck: renderDeckDetail,
  training: renderTraining,
  profile: renderProfile,
  public: renderPublic
};

routes[page]?.();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then((registration) => registration.update());
}
