/* ==========================================================
   ロト予想アプリ - ロジック
   ========================================================== */

// ゲームごとの設定（範囲・選ぶ個数・説明文）
const GAMES = {
  loto6: {
    label: "ロト6",
    max: 43,
    pick: 6,
    desc: "1〜43の数字から<strong>6個</strong>選ぶくじです。ボックス・ミニ数字選択などの買い方がありますが、このアプリではふつうの1口分（6個）を作ります。",
  },
  loto7: {
    label: "ロト7",
    max: 37,
    pick: 7,
    desc: "1〜37の数字から<strong>7個</strong>選ぶくじです。ロトの中でも当せん金が大きくなりやすいのが特徴です。",
  },
  miniloto: {
    label: "ミニロト",
    max: 31,
    pick: 5,
    desc: "1〜31の数字から<strong>5個</strong>選ぶくじです。選ぶ数字が少なく、はじめての方にも選びやすいゲームです。",
  },
};

const HISTORY_KEY = "loto-yosou-history";
const HISTORY_LIMIT = 30;

let currentGame = "loto6";
let ticketCount = 3;

// ---------- 要素の取得 ----------
const bodyEl = document.body;
const gameTabs = document.querySelectorAll(".game-tab");
const gameInfoText = document.getElementById("gameInfoText");
const ticketCountEl = document.getElementById("ticketCount");
const ticketMinus = document.getElementById("ticketMinus");
const ticketPlus = document.getElementById("ticketPlus");
const generateBtn = document.getElementById("generateBtn");
const resultSection = document.getElementById("resultSection");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// ---------- 数字生成 ----------

// max個の中からpick個の重複しない数字を選び、昇順で返す
function pickNumbers(max, pick) {
  const pool = [];
  for (let i = 1; i <= max; i++) pool.push(i);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, pick).sort((a, b) => a - b);
}

// ---------- 画面表示 ----------

function renderGameInfo() {
  const g = GAMES[currentGame];
  gameInfoText.innerHTML = g.desc;
}

function switchGame(gameKey) {
  currentGame = gameKey;
  bodyEl.setAttribute("data-game", gameKey);

  gameTabs.forEach((tab) => {
    const isSelected = tab.dataset.game === gameKey;
    tab.setAttribute("aria-selected", String(isSelected));
  });

  renderGameInfo();
  resultSection.innerHTML = "";
}

function renderTickets(ticketsData) {
  resultSection.innerHTML = "";

  ticketsData.forEach((numbers, index) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const label = document.createElement("p");
    label.className = "ticket-label";
    label.textContent = `${index + 1}口目`;
    card.appendChild(label);

    const row = document.createElement("div");
    row.className = "ball-row";

    numbers.forEach((num, ballIndex) => {
      const ball = document.createElement("span");
      ball.className = "ball";
      ball.textContent = num;
      ball.style.animationDelay = `${ballIndex * 0.05}s`;
      row.appendChild(ball);
    });

    card.appendChild(row);
    resultSection.appendChild(card);
  });
}

// ---------- 履歴 ----------

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    /* localStorageが使えない環境では履歴を保存しない */
  }
}

function addToHistory(gameKey, ticketsData) {
  const history = loadHistory();
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  ticketsData.forEach((numbers) => {
    history.unshift({
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      game: gameKey,
      numbers,
      date: dateStr,
    });
  });

  const trimmed = history.slice(0, HISTORY_LIMIT);
  saveHistory(trimmed);
  renderHistory();
}

function deleteHistoryItem(id) {
  const history = loadHistory().filter((item) => item.id !== id);
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyEmpty.style.display = "block";
    return;
  }
  historyEmpty.style.display = "none";

  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const tag = document.createElement("span");
    tag.className = "history-tag";
    tag.textContent = GAMES[item.game]?.label || item.game;
    meta.appendChild(tag);

    const numbers = document.createElement("span");
    numbers.className = "history-numbers";
    numbers.textContent = item.numbers.join(" ・ ");
    meta.appendChild(numbers);

    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = item.date;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "history-delete";
    deleteBtn.setAttribute("aria-label", "この履歴を削除");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => deleteHistoryItem(item.id));

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "8px";
    right.appendChild(date);
    right.appendChild(deleteBtn);

    li.appendChild(meta);
    li.appendChild(right);
    historyList.appendChild(li);
  });
}

// ---------- イベント ----------

gameTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchGame(tab.dataset.game));
});

ticketMinus.addEventListener("click", () => {
  if (ticketCount > 1) {
    ticketCount -= 1;
    ticketCountEl.textContent = ticketCount;
  }
});

ticketPlus.addEventListener("click", () => {
  if (ticketCount < 5) {
    ticketCount += 1;
    ticketCountEl.textContent = ticketCount;
  }
});

generateBtn.addEventListener("click", () => {
  const g = GAMES[currentGame];
  const tickets = [];
  for (let i = 0; i < ticketCount; i++) {
    tickets.push(pickNumbers(g.max, g.pick));
  }
  renderTickets(tickets);
  addToHistory(currentGame, tickets);
});

clearHistoryBtn.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

// ---------- 初期化 ----------

renderGameInfo();
renderHistory();
