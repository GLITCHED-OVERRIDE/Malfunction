/* games.js */

/* Constants */
const JSON_URL = "https://raw.githubusercontent.com/GLITCHED-OVERRIDE/Hypper-Drive-2/refs/heads/main/Games/Zones.json";
const ERROR_404 = "https://raw.githubusercontent.com/GLITCHED-OVERRIDE/Malfunction/refs/heads/main/Pages/404.html";

/* Zone mapping */
const ZONE_TYPES = {
  "Home": "Home",
  "PC": "PC",
  "Mobile": "Mobile",
  "N64": "N64",
  "NDS": "NDS",
  "PS1": "PS1",
  "Game Boy": "GB",
  "Game Boy Advance": "GBA",
  "Game Boy Color": "GBC",
  "NES": "NES",
  "SNES": "SNES",
  "Sega Genesis": "SG",
  "Sega Saturn": "SS",
  "Neo Geo Pocket Color": "NGPC",
  "MS-DOS": "MSDOS",
  "Atari Jaguar": "AJ",
  "Arcade": "Arcade",
  "Sega Game Gear": "SGG",
  "Atari Lynx": "AL",
  "Atari 2600": "A2600"
};

/* Storage */
let recents = JSON.parse(localStorage.getItem("recentGames") || "[]");
let favorites = JSON.parse(localStorage.getItem("favoriteGames") || "[]");

/* State */
let allGames = [];

/* DOM Elements */
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const topbarTitle = document.querySelector("#topbar span");

/* Sidebar */
Object.keys(ZONE_TYPES).forEach(z => {
  const b = document.createElement("button");
  b.textContent = z;
  b.onclick = () => navigateZone(z);
  sidebar.appendChild(b);
});

/* Active sidebar button */
function setActive(zone) {
  [...sidebar.children].forEach(b => {
    b.classList.toggle("active", b.textContent === zone);
  });
  topbarTitle.textContent = zone;
}

/* Render grid of games */
function renderGrid(list) {
  const g = document.createElement("div");
  g.className = "grid";
  list.forEach(game => {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `<img src="${game.cover}"><h3>${game.name}</h3>`;
    c.onclick = () => openGame(game);
    g.appendChild(c);
  });
  return g;
}

/* Home page */
function renderHome() {
  setActive("Home");
  content.innerHTML = "";

  if (recents.length === 0 && favorites.length === 0) {
    const msg = document.createElement("div");
    msg.textContent = "Go Try Some New Games!";
    msg.style.color = "#ff2d2d";
    msg.style.fontSize = "1.4rem";
    msg.style.fontWeight = "700";
    msg.style.textAlign = "center";
    msg.style.marginTop = "40px";
    content.appendChild(msg);
  }

  if (recents.length) {
    content.innerHTML += `<div class="section-title">Recently Played</div>`;
    const recentList = recents.slice(-10).reverse();
    content.appendChild(renderGrid(recentList));
  }

  if (favorites.length) {
    content.innerHTML += `<div class="section-title">Favorites</div>`;
    content.appendChild(renderGrid(favorites));
  }
}

/* Zone page */
function renderZone(zone) {
  setActive(zone);
  content.innerHTML = "";
  const typeName = ZONE_TYPES[zone];
  const list = allGames.filter(g => g.type.toLowerCase() === typeName.toLowerCase());
  if (!list.length) {
    renderError();
  } else {
    content.appendChild(renderGrid(list));
  }
}

/* Game page */
async function openGame(game) {
  history.pushState({}, "", `/games/${encodeURIComponent(game.type)}/${encodeURIComponent(game.name)}`);
  setActive(game.type);

  const isFav = favorites.some(f => f.name === game.name);
  if (!recents.find(g => g.name === game.name)) {
    recents.push(game);
    localStorage.setItem("recentGames", JSON.stringify(recents));
  }

  content.innerHTML = `
    <div class="game-container">
      <iframe id="player" src="about:blank" allowfullscreen></iframe>
      <div class="game-actions-bar">
        <button class="favorite ${isFav ? 'active' : ''}" title="Favorite">★</button>
        <button class="fullscreen" title="Fullscreen">⛶</button>
        <button class="share" title="Share">🔗</button>
      </div>
      <div class="section-title">More Games</div>
    </div>
  `;

  const iframe = document.getElementById("player");

  try {
    const res = await fetch(game.url);
    const html = await res.text();
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.classList.add("loaded");
  } catch (e) {
    iframe.contentWindow.document.body.innerHTML = `<div style="color:red;text-align:center;padding:20px;">Failed to load game.</div>`;
  }

  /* Favorite toggle */
  const favBtn = document.querySelector(".favorite");
  favBtn.onclick = () => {
    const idx = favorites.findIndex(f => f.name === game.name);
    if (idx > -1) {
      favorites.splice(idx, 1);
      favBtn.classList.remove("active");
    } else {
      favorites.push(game);
      favBtn.classList.add("active");
    }
    localStorage.setItem("favoriteGames", JSON.stringify(favorites));
  };

  /* Fullscreen */
  document.querySelector(".fullscreen").onclick = () => {
    if (iframe.requestFullscreen) iframe.requestFullscreen();
  };

  /* Share link */
  document.querySelector(".share").onclick = () => {
    navigator.clipboard.writeText(location.href).then(() => {
      const popup = document.getElementById("clipboard-popup");
      popup.classList.add("show");
      setTimeout(() => popup.classList.remove("show"), 2000);
    });
  };

  /* More games */
  const more = allGames.filter(g => g.type === game.type && g.name !== game.name)
                       .sort(() => 0.5 - Math.random())
                       .slice(0, 10);
  content.appendChild(renderGrid(more));
}

/* Error page */
async function renderError() {
  try {
    const res = await fetch(ERROR_404);
    const html = await res.text();
    const iframe = document.createElement("iframe");
    iframe.src = "about:blank";
    iframe.style.width = "100%";
    iframe.style.height = "70vh";
    iframe.style.border = "none";
    content.innerHTML = `<div class="section-title">Error: Page Not Found</div>`;
    content.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.classList.add("loaded");
  } catch (e) {
    content.innerHTML = `<div class="section-title" style="color:red">Error: Could not load 404 page</div>`;
  }
}

/* Navigate */
function navigateZone(zone) {
  history.pushState({}, "", zone === "Home" ? "/games/Home" : `/games/${zone}`);
  zone === "Home" ? renderHome() : renderZone(zone);
}

/* Live Search */
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  searchResults.innerHTML = "";
  if (!q) { searchResults.style.display = "none"; return; }

  const matches = allGames.filter(g => g.name.toLowerCase().includes(q));
  if (matches.length) {
    matches.forEach(game => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `<img src="${game.cover}">
                        <div class="info">
                          <div class="name">${game.name}</div>
                          <div class="type">${game.type}</div>
                        </div>`;
      item.onclick = () => {
        openGame(game);
        searchResults.style.display = "none";
        searchInput.value = "";
      };
      searchResults.appendChild(item);
    });
    searchResults.style.display = "flex";
  } else searchResults.style.display = "none";
});

/* Init */
fetch(JSON_URL).then(r => r.json()).then(games => {
  allGames = games;
  if (location.pathname.startsWith("/games/")) {
    const [, , type, name] = location.pathname.split("/");
    if (type && name) {
      const g = games.find(x => x.type.toLowerCase() === decodeURIComponent(type).toLowerCase() &&
                                x.name === decodeURIComponent(name));
      g ? openGame(g) : renderError();
    } else {
      renderHome();
    }
  } else {
    renderHome();
  }
});
