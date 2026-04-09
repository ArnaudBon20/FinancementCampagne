const DATA_URL = "https://raw.githubusercontent.com/aexil-234/FinancementCampagne/main/data.json";
const HISTORY_URL = "https://raw.githubusercontent.com/aexil-234/FinancementCampagne/main/history.json";

const TRANSLATIONS = {
  fr: {
    title: "Financement des campagnes",
    date_label: "Votations",
    supporters: "Pour",
    opponents: "Contre",
    update: "Mise à jour",
    no_data: "Pas de données disponibles",
    loading: "Chargement des données...",
    error_title: "Erreur de chargement",
    error_message: "Impossible de charger les données. Vérifiez votre connexion internet.",
    retry: "Réessayer",
    install: "Installer l'application",
    source: "CDF",
    months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
  },
  de: {
    title: "Kampagnenfinanzierung",
    date_label: "Abstimmungen",
    supporters: "Ja",
    opponents: "Nein",
    update: "Aktualisierung",
    no_data: "Keine Daten verfügbar",
    loading: "Daten werden geladen...",
    error_title: "Ladefehler",
    error_message: "Daten konnten nicht geladen werden. Überprüfen Sie Ihre Internetverbindung.",
    retry: "Erneut versuchen",
    install: "App installieren",
    source: "EFK",
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
  },
  it: {
    title: "Finanziamento campagne",
    date_label: "Votazioni",
    supporters: "Sì",
    opponents: "No",
    update: "Aggiornamento",
    no_data: "Nessun dato disponibile",
    loading: "Caricamento dati...",
    error_title: "Errore di caricamento",
    error_message: "Impossibile caricare i dati. Verificare la connessione internet.",
    retry: "Riprova",
    install: "Installa l'applicazione",
    source: "CDF",
    months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
  }
};

let currentLang = 'fr';
let cachedData = null;
let cachedHistory = null;
let deferredPrompt = null;

function getSystemLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const lang = browserLang.toLowerCase();
  
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('it')) return 'it';
  return 'fr';
}

function formatCHF(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.', ',') + ' M';
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + ' k';
  }
  return amount.toFixed(0);
}

function getShortTitle(title) {
  const match = title.match(/\(([^)]+)\)\s*$/);
  if (match) {
    let result = match[1];
    // Si c'est juste un acronyme court (ex. "LSC"), enrichir avec le nom de la loi
    if (/^[A-Z]{2,6}$/.test(result)) {
      const lawMatch = title.match(/loi\s+(?:fédérale\s+)?sur\s+(.+?)\s*\([^)]+\)\s*$/i);
      if (lawMatch) {
        const subject = lawMatch[1].trim().replace(/^(?:la\s+|le\s+|les\s+|l['`']?\s*)/i, '');
        result = 'Loi sur ' + subject + ', ' + result;
      }
    }
    result = result.replace(/^initiative/i, "Initiative");
    return result;
  }
  
  let cleaned = title;
  cleaned = cleaned.replace(/^Bundesgesetz vom \d{1,2}\.?\s*\w+\.?\s*\d{4}\s*(ueber|uber|über)?\s*(die\s+)?/i, "");
  cleaned = cleaned.replace(/^Loi fédérale du \d{1,2}\s*\w+\s*\d{4}\s*sur\s*(l[ea]?['`']?\s*)?/i, "");
  cleaned = cleaned.replace(/^Legge federale del \d{1,2}\s*\w+\s*\d{4}\s*su(ll[ao]?)?\s*/i, "");
  
  if (cleaned !== title && cleaned.length > 0) {
    let result = cleaned.replace(/^[\s'`'"«»]+/, "");
    result = result.charAt(0).toUpperCase() + result.slice(1);
    result = result.replace(/^initiative/i, "Initiative");
    result = result.replace(/^imposition/i, "Imposition");
    return result;
  }
  
  return title;
}

function formatVoteDate(dateStr, lang) {
  if (!dateStr) return "-";
  const t = TRANSLATIONS[lang];
  const parts = dateStr.split(".");
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[2];
    return `${day} ${t.months[monthIdx]} ${year}`;
  }
  return dateStr;
}

function formatUpdateDate(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length >= 3) {
    return `${parts[2]}.${parts[1]}.`;
  }
  return dateStr;
}

function updateLanguage(lang) {
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  
  // Mettre à jour les textes de l'interface
  document.getElementById('app-title').textContent = t.title;
  document.getElementById('vote-label').textContent = t.date_label;
  
  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = t.loading;
  
  document.getElementById('update-label').textContent = t.update;
  document.getElementById('install-text').textContent = t.install;
  document.getElementById('source-link').textContent = t.source;
  
  // Mettre à jour l'indicateur de langue actif
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    if (btn.dataset.lang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Re-rendre les votations avec la nouvelle langue
  if (cachedData) {
    renderVotations(cachedData);
  }
  
  localStorage.setItem('preferredLanguage', lang);
}

async function fetchData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function fetchHistory() {
  try {
    const response = await fetch(HISTORY_URL);
    if (!response.ok) return [];
    const history = await response.json();
    cachedHistory = history;
    return history;
  } catch (error) {
    return [];
  }
}

function isRecentEntry(timestamp, maxDays) {
  if (!timestamp) return false;
  const parts = timestamp.split(' ');
  if (parts.length < 2) return false;
  const [date, time] = parts;
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split(':');
  const entryDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));
  const now = new Date();
  const diffMs = now - entryDate;
  return diffMs < maxDays * 24 * 60 * 60 * 1000;
}

function getLastChanges(history) {
  if (!history || history.length === 0) return {};
  const latest = history[0];
  if (!isRecentEntry(latest.timestamp, 2)) return {};
  const map = {};
  (latest.changes || []).forEach(c => {
    map[c.votation_id] = c;
  });
  return map;
}

function formatDeltaBadge(delta) {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '';
  return `${sign}CHF ${formatCHF(Math.abs(delta))}`;
}

function renderVotations(data) {
  const container = document.getElementById('votations-container');
  const t = TRANSLATIONS[currentLang];
  
  if (data.nextVoteDate) {
    document.getElementById('vote-date').textContent = formatVoteDate(data.nextVoteDate, currentLang);
  }
  
  if (data.lastUpdate) {
    document.getElementById('last-update').textContent = formatUpdateDate(data.lastUpdate);
  }
  
  if (!data.votations || data.votations.length === 0) {
    container.innerHTML = `
      <div class="error-message">
        <h2>${t.no_data}</h2>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  const lang = currentLang;
  
  data.votations.forEach(votation => {
    // Récupérer le titre dans la langue actuelle
    let fullTitle = "N/A";
    if (votation.title && typeof votation.title === 'object') {
      fullTitle = votation.title[lang] || votation.title.fr || "N/A";
    } else if (typeof votation.title === 'string') {
      fullTitle = votation.title;
    }
    
    const title = getShortTitle(fullTitle);
    const total = votation.supporters_total + votation.opponents_total;
    const supPercent = total > 0 ? (votation.supporters_total / total * 100) : 50;
    const oppPercent = 100 - supPercent;
    
    // URL vers la page de financement (page principale dans la bonne langue)
    const campaignUrl = `https://politikfinanzierung.efk.admin.ch/app/${lang}/campaign-financings`;
    
    const card = document.createElement('div');
    card.className = 'votation-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(campaignUrl, '_blank');
    });
    
    const lastChanges = getLastChanges(cachedHistory);
    const change = lastChanges[votation.id] || null;
    const supDelta = change ? change.supporters_after - change.supporters_before : 0;
    const oppDelta = change ? change.opponents_after - change.opponents_before : 0;
    const supBadge = formatDeltaBadge(supDelta);
    const oppBadge = formatDeltaBadge(oppDelta);

    card.innerHTML = `
      <div class="votation-title">${title}</div>
      <div class="amounts-container">
        <div class="amount-row">
          <span class="amount-label supporters">
            <span>✓</span>
            <span>${t.supporters}</span>
          </span>
          <span style="display:flex;align-items:center;gap:8px">
            <span class="amount-value" style="color: var(--color-supporters)">
              CHF ${formatCHF(votation.supporters_total)}
            </span>
            ${supBadge ? `<span class="delta-badge ${supDelta > 0 ? 'delta-up' : 'delta-down'}">${supDelta > 0 ? '↑' : '↓'} ${supBadge}</span>` : ''}
          </span>
        </div>
        <div class="amount-row">
          <span class="amount-label opponents">
            <span>✗</span>
            <span>${t.opponents}</span>
          </span>
          <span style="display:flex;align-items:center;gap:8px">
            <span class="amount-value" style="color: var(--color-opponents)">
              CHF ${formatCHF(votation.opponents_total)}
            </span>
            ${oppBadge ? `<span class="delta-badge ${oppDelta > 0 ? 'delta-up' : 'delta-down'}">${oppDelta > 0 ? '↑' : '↓'} ${oppBadge}</span>` : ''}
          </span>
        </div>
      </div>
      ${total > 0 ? `
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-supporters" style="width: ${supPercent}%"></div>
            <div class="progress-opponents" style="width: ${oppPercent}%"></div>
          </div>
          <div class="progress-percentages">
            <span style="color: var(--color-supporters)">${supPercent.toFixed(0)}%</span>
            <span style="color: var(--color-opponents)">${oppPercent.toFixed(0)}%</span>
          </div>
        </div>
      ` : ''}
    `;
    
    container.appendChild(card);
  });
}

function showError() {
  const container = document.getElementById('votations-container');
  const t = TRANSLATIONS[currentLang];
  
  container.innerHTML = `
    <div class="error-message">
      <h2>${t.error_title}</h2>
      <p>${t.error_message}</p>
      <button class="retry-btn" onclick="loadData()">${t.retry}</button>
    </div>
  `;
}

async function loadData() {
  const container = document.getElementById('votations-container');
  const t = TRANSLATIONS[currentLang];
  
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${t.loading}</p>
    </div>
  `;
  
  try {
    const [data] = await Promise.all([fetchData(), fetchHistory()]);
    renderVotations(data);
  } catch (error) {
    showError();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferredLanguage') || getSystemLanguage();
  currentLang = savedLang;
  
  updateLanguage(currentLang);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateLanguage(btn.dataset.lang);
    });
  });
  
  loadData();
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const installPrompt = document.getElementById('install-prompt');
  installPrompt.classList.add('show');
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    document.getElementById('install-prompt').classList.remove('show');
  }
  
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  document.getElementById('install-prompt').classList.remove('show');
  deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
