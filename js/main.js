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
      ${windowHtml("Second Brain Studio", `
        ${authNotice()}
        <div class="hero-layout">
          <div>
            <div class="eyebrow">Personal knowledge collection</div>
            <h1 class="hero-title">Build your living library.</h1>
            <p class="hero-copy">Карточки, заметки, повторения и AI-подготовка складываются в личный учебный журнал, а не в очередной рабочий dashboard.</p>
            <div class="row">
              <a class="win-button" href="/register.html">Создать аккаунт</a>
              <a class="win-button" href="/login.html">Войти</a>
              <a class="win-button" href="/public.html">Открыть каталог</a>
            </div>
          </div>
          <div class="desktop-preview" aria-label="Коллаж учебного журнала">
            <div class="scrap scrap-book">Knowledge<br>Library</div>
            <div class="scrap scrap-card">Recall<br>Cards</div>
            <div class="scrap scrap-note">AI Study<br>Notes</div>
            <div class="window mini-window">
              <div class="title-bar"><span class="title-left"><span class="program-icon">M</span><span>Memory rhythm</span></span><span class="window-controls" aria-hidden="true"><b></b><b></b><b></b></span></div>
              <div class="window-body"><div class="chart"><div class="bar" style="height:35px">2</div><div class="bar" style="height:80px">6</div><div class="bar" style="height:55px">4</div><div class="bar" style="height:120px">9</div><div class="bar" style="height:65px">5</div><div class="bar" style="height:95px">7</div><div class="bar" style="height:40px">3</div></div></div>
            </div>
          </div>
        </div>
        <div class="status-bar"><span>Ready for collection</span><span>Designed as a second brain</span></div>
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
  app.innerHTML = appShell("My Knowledge Journal", `
    <div class="dashboard-hero">
      <div>
        <div class="eyebrow">Today in the archive</div>
        <h1 class="page-title">Your memory is becoming a collection.</h1>
        <p class="page-copy">Повторы, точность и рост встроены в страницу как заметки на развороте учебного журнала.</p>
      </div>
      <div class="row">
        <a class="win-button" href="/training.html">Начать тренировку</a>
        <a class="win-button" href="/decks.html">Колоды</a>
      </div>
    </div>
    ${authNotice()}
    <div id="message" class="message">Загружаю статистику...</div>
    <div class="dashboard-grid journal-grid">
      <div class="journal-metrics" id="stats"></div>
      <div class="panel chart-panel">
        <div class="eyebrow">Review rhythm</div>
        <h2>Seven-day memory trail</h2>
        <p class="muted">Ритм повторений важнее разовых рывков. Каждая отметка здесь похожа на закладку в личной библиотеке.</p>
        <div class="chart" id="chart"></div>
      </div>
    </div>
  `, "dashboard.html");
  bindShell();
  try {
    const stats = await dashboardStats();
    $("#message").remove();
    $("#stats").innerHTML = [
      ["К сроку сегодня", stats.dueToday, "featured stat-due", "bookmark-red", "Ready slips", "Тихий фокус на ближайшем повторении."],
      ["Точность", `${stats.accuracy}%`, "stat-accuracy", "bookmark-green", "Recall quality", "Доля уверенных ответов в журнале."],
      ["Неделя", `${stats.reviewedWeek}`, "stat-week", "bookmark-blue", "Seven-day trail", "Повторы за последние семь дней."],
      ["Выучено", stats.learned, "stat-learned", "bookmark-gold", "Long-term shelf", "Карточки, закрепленные в памяти."],
      ["Карточек", stats.totalCards, "stat-cards", "bookmark-red", "Archive volume", "Все учебные записи в системе."],
      ["Колоды", stats.totalDecks, "stat-decks", "bookmark-green", "Notebooks", "Отдельные коллекции знаний."],
      ["Повторов", stats.totalReviews, "stat-reviews", "bookmark-blue", "Total marks", "История сделанных повторений."]
    ].map(([label, value, variant, tone, kicker, caption]) => `
      <article class="panel stat-panel ${variant} ${tone}">
        <div class="stat-head"><span>${label}</span><span>${kicker}</span></div>
        <div class="stat-body">
          <span class="stat-value">${value}</span>
          <span class="stat-mark" aria-hidden="true"></span>
        </div>
        <p class="muted">${caption}</p>
        <div class="meter" aria-hidden="true"></div>
      </article>`).join("");
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
  app.innerHTML = appShell("Notebook Library", `
    <div class="deck-hero">
      <div>
        <div class="eyebrow">Personal archive</div>
        <h1 class="page-title">Decks should feel worth opening.</h1>
        <p class="page-copy">Каждая колода оформлена как отдельный учебный блокнот: с ярлыком, закладкой и собственной ролью в системе знаний.</p>
      </div>
    </div>
    <div class="explorer-layout">
      <div class="panel tree-panel">
        <div class="eyebrow">New notebook</div>
        <h2>Start a collection</h2>
        <p class="muted">Назовите тему так, будто ставите новый блокнот на полку личной библиотеки.</p>
        <hr>
        ${deckForm()}
        <div id="formMessage" class="message hidden"></div>
      </div>
      <div>
        <div class="toolbar"><input id="deckSearch" placeholder="Поиск по библиотеке"><button class="win-button" id="deckSearchButton">Найти</button></div>
        <ul class="list folder-list" id="deckList"><li class="message">Загружаю колоды...</li></ul>
      </div>
    </div>
    <div class="status-bar"><span>${escapeHtml(session.user.email)}</span><span id="deckCountStatus">0 collections</span></div>
  `, "decks.html");
  bindShell();
  const load = async () => {
    const decks = await listDecks($("#deckSearch").value.trim());
    $("#deckCountStatus").textContent = `${decks.length} collections`;
    $("#deckList").innerHTML = decks.length ? decks.map((deck) => `
      <li class="list-item folder-item notebook-item">
        <div class="folder-icon"></div>
        <header><strong>${escapeHtml(deck.name)}</strong><span class="badge">${deck.is_public ? "Public" : "Private"}</span></header>
        <p>${escapeHtml(deck.description || "Без описания")}</p>
        <div class="row">
          <a class="win-button" href="/deck.html?id=${deck.id}">Открыть</a>
          <button class="win-button" data-edit="${deck.id}">Править</button>
          <button class="win-button" data-delete="${deck.id}">Удалить</button>
        </div>
      </li>`).join("") : `<li class="empty-state"><div><div class="eyebrow">Empty library</div><h2>Коллекций пока нет</h2><p class="muted">Создайте первую колоду слева и превратите заметки в систему повторения.</p></div></li>`;
    $$("[data-edit]").forEach((button) => button.addEventListener("click", async () => {
      const deck = await getDeck(button.dataset.edit);
      $(".tree-panel").innerHTML = `<div class="eyebrow">Edit notebook</div><h2>${escapeHtml(deck.name)}</h2><p class="muted">Обновите публичность, название или описание.</p><hr>` + deckForm(deck) + `<div id="formMessage" class="message hidden"></div>`;
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
  app.innerHTML = appShell("Deck Notebook", `
    <div class="deck-hero">
      <div>
        <div class="eyebrow">${canEdit ? "Editable notebook" : "Public preview"}</div>
        <h1 class="page-title">${escapeHtml(deck.name)}</h1>
        <p class="page-copy">${escapeHtml(deck.description || "Без описания")}</p>
      </div>
      <div class="row">
        ${canEdit ? `<a class="win-button" href="/training.html?deck=${deck.id}">Тренировать</a>` : ""}
        <button class="win-button" id="exportCsv">Экспорт CSV</button>
        ${canEdit ? `<label class="win-button">Импорт CSV<input id="importCsv" type="file" accept=".csv,text/csv" class="hidden"></label>
        <button class="win-button" id="aiOpen">AI генерация</button>` : ""}
      </div>
    </div>
    <div class="split">
      ${canEdit ? `<div class="panel"><div class="eyebrow">New card</div><h2>Add a study slip</h2>${cardForm()}<div id="cardMessage" class="message hidden"></div></div>` : `<div class="panel"><div class="eyebrow">Read only</div><h2>Public preview</h2><p class="muted">Чтобы редактировать, скопируйте колоду себе из каталога.</p></div>`}
      <div>
        <div class="toolbar"><input id="categoryFilter" placeholder="Категория"><input id="tagFilter" placeholder="Тег"><button class="win-button" id="filterButton">Фильтр</button></div>
        <ul class="list card-list system-list" id="cardList"><li class="message">Загружаю карточки...</li></ul>
      </div>
    </div>
    <div class="status-bar"><span>${canEdit ? "Editable" : "Read only"}</span><span id="cardCountStatus">0 cards</span></div>
    <div id="modalRoot"></div>
  `, "decks.html");
  bindShell();
  let currentCards = [];
  const load = async () => {
    currentCards = await listCards(deckId, { category: $("#categoryFilter").value.trim(), tag: $("#tagFilter").value.trim() });
    $("#cardCountStatus").textContent = `${currentCards.length} cards`;
    $("#cardList").innerHTML = currentCards.length ? currentCards.map((card) => `
      <li class="list-item">
        <header><strong>${escapeHtml(card.front)}</strong><span class="badge">${escapeHtml(typeLabel(card.card_type))}</span></header>
        <p>${escapeHtml(card.back)}</p>
        <p class="muted">${escapeHtml(card.category || "Без категории")} ${escapeHtml(tagsToText(card.tags))}</p>
        ${canEdit ? `<div class="row"><button class="win-button" data-card-edit="${card.id}">Править</button><button class="win-button" data-card-delete="${card.id}">Удалить</button></div>` : ""}
      </li>`).join("") : `<li class="empty-state"><div><div class="eyebrow">No cards</div><h2>Карточек пока нет</h2><p class="muted">Добавьте первую карточку или импортируйте CSV, чтобы собрать тренировочный набор.</p></div></li>`;
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
        <div class="title-bar"><span class="title-left"><span class="program-icon">A</span><span>AI study notes</span></span><span class="window-controls" aria-hidden="true"><b></b><b></b><b></b></span></div>
        <div class="window-body">
          <div class="menu-bar"><span class="menu-item">Source text</span><span class="menu-item">Generate</span><span class="menu-item">Review</span></div>
          <form id="aiForm">
            <label>Текст для карточек<textarea class="notepad" name="text" required></textarea></label>
            <label>Количество<select name="amount"><option>5</option><option>10</option><option>20</option></select></label>
            <button class="win-button" type="submit">Сгенерировать из текста</button>
          </form>
          <div id="aiMessage" class="message hidden"></div>
          <form id="aiPreview" class="list system-list"></form>
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
  app.innerHTML = appShell("Recall Studio", `
    <div class="training-intro">
      <div>
        <div class="eyebrow">Immersive recall</div>
        <h1 class="page-title">One beautiful study card at a time.</h1>
        <p class="page-copy">Вопрос, раскрытие ответа и оценка памяти выстроены как спокойный учебный ритуал без лишних отвлечений.</p>
      </div>
    </div>
    <div class="training-shell">
      <div id="trainingMessage" class="message">Загружаю карточки к повторению...</div>
      <div class="training-stage" aria-live="polite">
        <div class="training-card" id="trainingCard"></div>
        <div class="toolbar training-actions">
          <button class="win-button" id="showAnswer">Показать ответ</button>
          <button class="win-button hidden" id="explainButton">Объяснить тему</button>
        </div>
        <div class="rating-grid hidden" id="ratings">
          <button class="win-button" data-rating="again">Не вспомнил</button>
          <button class="win-button" data-rating="hard">Сложно</button>
          <button class="win-button" data-rating="normal">Вспомнил</button>
          <button class="win-button" data-rating="easy">Легко</button>
        </div>
        <div id="explanation" class="help-document hidden"></div>
        <button class="win-button hidden" id="nextAfterExplain">Следующая карточка</button>
      </div>
    </div>
    <div class="status-bar"><span>Spaced repetition active</span><span>Designed for recall, not browsing</span></div>
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
    $("#trainingCard").classList.remove("is-answer");
    $("#trainingCard").textContent = cards[index].front;
    $("#showAnswer").classList.remove("hidden");
    $("#ratings").classList.add("hidden");
  };
  $("#showAnswer").addEventListener("click", () => {
    showingAnswer = true;
    $("#trainingCard").classList.add("is-answer");
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
  app.innerHTML = appShell("Study Workspace", `
    <div class="profile-hero">
      <div>
        <div class="eyebrow">Learning identity</div>
        <h1 class="page-title">Your desk inside the second brain.</h1>
        <p class="page-copy">Аватар, серия, достижения и рост знаний собраны как персональное учебное пространство.</p>
      </div>
    </div>
    <div class="profile-grid">
      <section class="panel avatar-card">
        <div class="avatar-preview" id="avatarPreview"></div>
        <div>
          <div class="eyebrow">Avatar</div>
          <h2>${escapeHtml(session.user.email.split("@")[0])}</h2>
          <p class="muted">${escapeHtml(session.user.email)}</p>
        </div>
        <div class="row avatar-actions">
          <label class="win-button">Загрузить<input id="avatarInput" type="file" accept="image/*" class="hidden"></label>
          <button class="win-button" id="removeAvatar" type="button">Удалить</button>
        </div>
        <div id="avatarMessage" class="message hidden"></div>
      </section>
      <section class="panel">
        <div class="eyebrow">Learning signature</div>
        <h2>Collector profile</h2>
        <div id="profileStats" class="profile-stats"><div class="message">Загружаю статистику...</div></div>
        <hr>
        <div class="achievement-list">
          <div class="achievement"><strong>Daily rhythm</strong><span class="muted">Повторы за неделю</span></div>
          <div class="achievement"><strong>Archive builder</strong><span class="muted">Колоды и карточки</span></div>
          <div class="achievement"><strong>Recall quality</strong><span class="muted">Точность ответов</span></div>
          <div class="achievement"><strong>Knowledge growth</strong><span class="muted">Выученные карточки</span></div>
        </div>
        <hr>
        <div class="toolbar"><button class="win-button" id="themeToggleLocal">Переключить тему</button></div>
        <p class="muted">Аватар и тема сохраняются локально в браузере. Логика авторизации и данные Supabase не изменялись.</p>
      </section>
    </div>
  `, "profile.html");
  bindShell();
  const avatarKey = `studyos-avatar:${session.user.id}`;
  const renderAvatar = () => {
    const avatar = localStorage.getItem(avatarKey);
    const fallback = escapeHtml(session.user.email.slice(0, 1).toUpperCase());
    $("#avatarPreview").innerHTML = avatar ? `<img src="${avatar}" alt="Аватар пользователя">` : fallback;
  };
  renderAvatar();
  $("#avatarInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage($("#avatarMessage"), "Выберите изображение.", "danger");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      localStorage.setItem(avatarKey, reader.result);
      renderAvatar();
      setMessage($("#avatarMessage"), "Аватар обновлен.", "success");
    });
    reader.readAsDataURL(file);
  });
  $("#removeAvatar").addEventListener("click", () => {
    localStorage.removeItem(avatarKey);
    renderAvatar();
    setMessage($("#avatarMessage"), "Аватар удален.", "success");
  });
  $("#themeToggleLocal").addEventListener("click", () => $("#themeToggle").click());
  try {
    const stats = await dashboardStats();
    $("#profileStats").innerHTML = [
      ["Точность", `${stats.accuracy}%`, "annotation-red"],
      ["Карточек", stats.totalCards, "annotation-blue"],
      ["Выучено", stats.learned, "annotation-green"],
      ["Повторов", stats.totalReviews, "annotation-gold"],
      ["Колоды", stats.totalDecks, "annotation-red"],
      ["Неделя", stats.reviewedWeek, "annotation-blue"]
    ].map(([label, value, tone]) => `<div class="profile-note ${tone}"><span>${label}</span><strong>${value}</strong></div>`).join("");
  } catch (error) {
    setMessage($("#profileStats"), error.message, "danger");
  }
}

async function renderPublic() {
  const session = await getSession();
  app.innerHTML = appShell("Shared Archive", `
    <div class="deck-hero">
      <div>
        <div class="eyebrow">Shared knowledge</div>
        <h1 class="page-title">Collect notebooks from other minds.</h1>
        <p class="page-copy">Просматривайте публичные колоды и копируйте полезные коллекции в свое пространство.</p>
      </div>
    </div>
    ${authNotice()}
    <div class="explorer-layout">
      <div class="panel tree-panel">
        <div class="eyebrow">Curated shelf</div>
        <h2>Browse and collect</h2>
        <p class="muted">Публичные материалы представлены как выставка учебных блокнотов.</p>
      </div>
      <div>
        <div class="toolbar"><input id="publicSearch" placeholder="Поиск публичных колод"><button class="win-button" id="publicSearchButton">Найти</button></div>
        <ul class="list folder-list" id="publicList"><li class="message">Загружаю каталог...</li></ul>
      </div>
    </div>
    <div class="status-bar"><span>${session ? "Copy enabled" : "Login required to copy"}</span><span id="publicCountStatus">0 shared collections</span></div>
  `, "public.html");
  bindShell();
  const load = async () => {
    try {
      const decks = await listPublicDecks($("#publicSearch").value.trim());
      $("#publicCountStatus").textContent = `${decks.length} shared collections`;
      $("#publicList").innerHTML = decks.length ? decks.map((deck) => `
        <li class="list-item folder-item notebook-item">
          <div class="folder-icon"></div>
          <header><strong>${escapeHtml(deck.name)}</strong><span class="badge">Public</span></header>
          <p>${escapeHtml(deck.description || "Без описания")}</p>
          <div class="row">
            <a class="win-button" href="/deck.html?id=${deck.id}">Просмотр</a>
            <button class="win-button" data-copy="${deck.id}" ${session ? "" : "disabled"}>Скопировать</button>
          </div>
        </li>`).join("") : `<li class="empty-state"><div><div class="eyebrow">No public decks</div><h2>Каталог пуст</h2><p class="muted">Когда пользователи откроют доступ к колодам, они появятся здесь.</p></div></li>`;
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
