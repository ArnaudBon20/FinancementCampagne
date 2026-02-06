// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: money-bill-wave;

/**
 * Widget iOS Scriptable - Financement des campagnes de votations
 * Affiche les budgets des campagnes pour les prochaines votations suisses
 * 
 * Source: https://politikfinanzierung.efk.admin.ch
 * Données mises à jour tous les 2 jours
 */

const DATA_URL = "https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/data.json";

// Traductions
const TRANSLATIONS = {
  fr: {
    title: "Financement des campagnes",
    date_label: "Votation du",
    supporters: "Pour",
    opponents: "Contre",
    update: "Mise à jour",
    no_data: "Pas de données"
  },
  de: {
    title: "Kampagnenfinanzierung",
    date_label: "Abstimmung vom",
    supporters: "Ja",
    opponents: "Nein",
    update: "Aktualisierung",
    no_data: "Keine Daten"
  },
  it: {
    title: "Finanziamento campagne",
    date_label: "Votazione del",
    supporters: "Sì",
    opponents: "No",
    update: "Aggiornamento",
    no_data: "Nessun dato"
  }
};

// Couleurs
const COLORS = {
  background: new Color("#1C1C1E"),
  title: new Color("#FFFFFF"),
  date: new Color("#8E8E93"),
  supporters: new Color("#34C759"),
  opponents: new Color("#FF3B30"),
  neutral: new Color("#AEAEB2"),
  separator: new Color("#38383A")
};

/**
 * Détecte la langue du système
 */
function getSystemLanguage() {
  const lang = Device.language();
  // Vérifier français en premier (fr, fr-CH, fr-FR)
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("it")) return "it";
  return "fr"; // Par défaut français
}

/**
 * Formate un montant en CHF
 */
function formatCHF(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + "M";
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + "k";
  }
  return amount.toFixed(0);
}

/**
 * Raccourcit un titre si trop long
 */
function shortenTitle(title, maxLength = 35) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + "...";
}

/**
 * Extrait le nom court entre parenthèses
 */
function getShortTitle(title) {
  const match = title.match(/\(([^)]+)\)\s*$/);
  if (match) {
    return match[1];
  }
  return shortenTitle(title, 40);
}

/**
 * Formate la date de mise à jour (jour.mois)
 */
function formatUpdateDate(dateStr) {
  if (!dateStr) return "";
  // Format attendu: "2026-02-06 11:38" -> "06.02"
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length >= 3) {
    return parts[2] + "." + parts[1];
  }
  return dateStr;
}

/**
 * Récupère les données depuis GitHub
 */
async function fetchData() {
  try {
    const req = new Request(DATA_URL);
    const data = await req.loadJSON();
    return data;
  } catch (error) {
    console.error("Erreur fetch data: " + error);
    return null;
  }
}

/**
 * Crée un widget de taille small
 */
async function createSmallWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(12, 12, 12, 12);
  
  // Titre
  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();
  const titleText = titleStack.addText("💰 " + t.title);
  titleText.font = Font.boldSystemFont(11);
  titleText.textColor = COLORS.title;
  
  widget.addSpacer(4);
  
  // Date de votation
  if (data && data.nextVoteDate) {
    const dateText = widget.addText(t.date_label + " " + data.nextVoteDate);
    dateText.font = Font.systemFont(10);
    dateText.textColor = COLORS.date;
  }
  
  widget.addSpacer(8);
  
  // Afficher les 2 premières votations
  if (data && data.votations && data.votations.length > 0) {
    const maxVotations = Math.min(2, data.votations.length);
    
    for (let i = 0; i < maxVotations; i++) {
      const v = data.votations[i];
      const title = v.title[lang] || v.title.fr || "N/A";
      
      const vStack = widget.addStack();
      vStack.layoutVertically();
      
      const titleLine = vStack.addText(shortenTitle(title, 25));
      titleLine.font = Font.mediumSystemFont(9);
      titleLine.textColor = COLORS.title;
      titleLine.lineLimit = 1;
      
      const amountsStack = vStack.addStack();
      amountsStack.layoutHorizontally();
      
      const supText = amountsStack.addText("✓" + formatCHF(v.supporters_total));
      supText.font = Font.systemFont(9);
      supText.textColor = COLORS.supporters;
      
      amountsStack.addSpacer(8);
      
      const oppText = amountsStack.addText("✗" + formatCHF(v.opponents_total));
      oppText.font = Font.systemFont(9);
      oppText.textColor = COLORS.opponents;
      
      if (i < maxVotations - 1) {
        widget.addSpacer(4);
      }
    }
  } else {
    const noData = widget.addText(t.no_data);
    noData.font = Font.systemFont(10);
    noData.textColor = COLORS.neutral;
  }
  
  widget.addSpacer();
  
  // Mise à jour
  if (data && data.lastUpdate) {
    const updateText = widget.addText(t.update + ": " + formatUpdateDate(data.lastUpdate));
    updateText.font = Font.systemFont(8);
    updateText.textColor = COLORS.date;
    updateText.rightAlignText();
  }
  
  return widget;
}

/**
 * Crée un widget de taille medium
 */
async function createMediumWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(12, 14, 12, 14);
  
  // Header
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  const titleText = headerStack.addText("💰 " + t.title);
  titleText.font = Font.boldSystemFont(14);
  titleText.textColor = COLORS.title;
  
  headerStack.addSpacer();
  
  if (data && data.nextVoteDate) {
    const dateText = headerStack.addText(t.date_label + " " + data.nextVoteDate);
    dateText.font = Font.systemFont(11);
    dateText.textColor = COLORS.date;
  }
  
  widget.addSpacer(8);
  
  // Contenu en 2 colonnes
  const contentStack = widget.addStack();
  contentStack.layoutHorizontally();
  
  const leftColumn = contentStack.addStack();
  leftColumn.layoutVertically();
  
  contentStack.addSpacer(12);
  
  const rightColumn = contentStack.addStack();
  rightColumn.layoutVertically();
  
  if (data && data.votations && data.votations.length > 0) {
    const votations = data.votations;
    
    for (let i = 0; i < Math.min(4, votations.length); i++) {
      const v = votations[i];
      const column = i < 2 ? leftColumn : rightColumn;
      const title = v.title[lang] || v.title.fr || "N/A";
      
      const vStack = column.addStack();
      vStack.layoutVertically();
      
      const titleLine = vStack.addText(shortenTitle(title, 30));
      titleLine.font = Font.mediumSystemFont(10);
      titleLine.textColor = COLORS.title;
      titleLine.lineLimit = 2;
      
      const amountsStack = vStack.addStack();
      amountsStack.layoutHorizontally();
      
      const supText = amountsStack.addText(t.supporters + ": " + formatCHF(v.supporters_total));
      supText.font = Font.systemFont(9);
      supText.textColor = COLORS.supporters;
      
      amountsStack.addSpacer(6);
      
      const oppText = amountsStack.addText(t.opponents + ": " + formatCHF(v.opponents_total));
      oppText.font = Font.systemFont(9);
      oppText.textColor = COLORS.opponents;
      
      column.addSpacer(6);
    }
  } else {
    const noData = leftColumn.addText(t.no_data);
    noData.font = Font.systemFont(11);
    noData.textColor = COLORS.neutral;
  }
  
  widget.addSpacer();
  
  // Footer
  if (data && data.lastUpdate) {
    const footerStack = widget.addStack();
    footerStack.layoutHorizontally();
    footerStack.addSpacer();
    const updateText = footerStack.addText(t.update + ": " + formatUpdateDate(data.lastUpdate));
    updateText.font = Font.systemFont(8);
    updateText.textColor = COLORS.date;
  }
  
  return widget;
}

/**
 * Crée un widget de taille large
 */
async function createLargeWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(14, 16, 14, 16);
  
  // Header
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  const titleText = headerStack.addText("💰 " + t.title);
  titleText.font = Font.boldSystemFont(16);
  titleText.textColor = COLORS.title;
  
  headerStack.addSpacer();
  
  if (data && data.nextVoteDate) {
    const dateText = headerStack.addText(t.date_label + " " + data.nextVoteDate);
    dateText.font = Font.systemFont(12);
    dateText.textColor = COLORS.date;
  }
  
  widget.addSpacer(10);
  
  // Séparateur
  const sep = widget.addStack();
  sep.backgroundColor = COLORS.separator;
  sep.size = new Size(0, 1);
  
  widget.addSpacer(10);
  
  if (data && data.votations && data.votations.length > 0) {
    for (let i = 0; i < data.votations.length; i++) {
      const v = data.votations[i];
      const fullTitle = v.title[lang] || v.title.fr || "N/A";
      const title = getShortTitle(fullTitle);
      
      const vStack = widget.addStack();
      vStack.layoutVertically();
      
      // Titre de la votation (nom court)
      const titleLine = vStack.addText(title);
      titleLine.font = Font.mediumSystemFont(12);
      titleLine.textColor = COLORS.title;
      titleLine.lineLimit = 1;
      
      vStack.addSpacer(4);
      
      // Barre de progression et montants
      const progressStack = vStack.addStack();
      progressStack.layoutHorizontally();
      progressStack.centerAlignContent();
      
      const total = v.supporters_total + v.opponents_total;
      const supPercent = total > 0 ? (v.supporters_total / total * 100) : 50;
      
      // Montant supporters
      const supText = progressStack.addText(t.supporters + ": CHF " + formatCHF(v.supporters_total));
      supText.font = Font.systemFont(11);
      supText.textColor = COLORS.supporters;
      
      progressStack.addSpacer();
      
      // Pourcentage
      if (total > 0) {
        const percentText = progressStack.addText(supPercent.toFixed(0) + "% / " + (100 - supPercent).toFixed(0) + "%");
        percentText.font = Font.systemFont(10);
        percentText.textColor = COLORS.neutral;
      }
      
      progressStack.addSpacer();
      
      // Montant opponents
      const oppText = progressStack.addText(t.opponents + ": CHF " + formatCHF(v.opponents_total));
      oppText.font = Font.systemFont(11);
      oppText.textColor = COLORS.opponents;
      
      widget.addSpacer(8);
      
      // Séparateur entre votations
      if (i < data.votations.length - 1) {
        const sepLine = widget.addStack();
        sepLine.backgroundColor = COLORS.separator;
        sepLine.size = new Size(0, 1);
        widget.addSpacer(8);
      }
    }
  } else {
    const noData = widget.addText(t.no_data);
    noData.font = Font.systemFont(12);
    noData.textColor = COLORS.neutral;
  }
  
  widget.addSpacer();
  
  // Footer
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();
  
  const sourceText = footerStack.addText("Source: EFK/CDF");
  sourceText.font = Font.systemFont(9);
  sourceText.textColor = COLORS.date;
  sourceText.url = "https://politikfinanzierung.efk.admin.ch";
  
  footerStack.addSpacer();
  
  if (data && data.lastUpdate) {
    const updateText = footerStack.addText(t.update + ": " + formatUpdateDate(data.lastUpdate));
    updateText.font = Font.systemFont(9);
    updateText.textColor = COLORS.date;
  }
  
  return widget;
}

// Main
async function main() {
  const lang = getSystemLanguage();
  const data = await fetchData();
  
  let widget;
  const widgetSize = config.widgetFamily || "medium";
  
  switch (widgetSize) {
    case "small":
      widget = await createSmallWidget(data, lang);
      break;
    case "large":
      widget = await createLargeWidget(data, lang);
      break;
    default:
      widget = await createMediumWidget(data, lang);
  }
  
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Preview
    switch (widgetSize) {
      case "small":
        widget.presentSmall();
        break;
      case "large":
        widget.presentLarge();
        break;
      default:
        widget.presentMedium();
    }
  }
  
  Script.complete();
}

await main();
