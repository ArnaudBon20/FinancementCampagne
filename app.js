const DATA_URL = "https://raw.githubusercontent.com/aexil-234/FinancementCampagne/main/data.json";

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
    
    card.innerHTML = `
      <div class="votation-title">${title}</div>
      <div class="amounts-container">
        <div class="amount-row">
          <span class="amount-label supporters">
            <span>✓</span>
            <span>${t.supporters}</span>
          </span>
          <span class="amount-value" style="color: var(--color-supporters)">
            CHF ${formatCHF(votation.supporters_total)}
          </span>
        </div>
        <div class="amount-row">
          <span class="amount-label opponents">
            <span>✗</span>
            <span>${t.opponents}</span>
          </span>
          <span class="amount-value" style="color: var(--color-opponents)">
            CHF ${formatCHF(votation.opponents_total)}
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
    const data = await fetchData();
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
