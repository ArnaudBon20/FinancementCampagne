// Widget Financement des Campagnes - Version pour chargement dynamique
// No special characters in comments

const DATA_URL = "https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/data.json";

const TRANSLATIONS = {
  fr: {
    title: "Financement des campagnes",
    date_label: "Votation du",
    supporters: "Pour",
    opponents: "Contre",
    update: "Mise a jour",
    no_data: "Pas de donnees"
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
    supporters: "Si",
    opponents: "No",
    update: "Aggiornamento",
    no_data: "Nessun dato"
  }
};

const COLORS = {
  background: new Color("#1C1C1E"),
  title: new Color("#FFFFFF"),
  date: new Color("#8E8E93"),
  supporters: new Color("#34C759"),
  opponents: new Color("#FF3B30"),
  neutral: new Color("#AEAEB2"),
  separator: new Color("#38383A")
};

function getSystemLanguage() {
  // Use preferredLanguages - most reliable method
  const prefs = Device.preferredLanguages();
  
  for (const p of prefs) {
    const l = p.toLowerCase();
    if (l.indexOf("fr") >= 0) return "fr";
    if (l.indexOf("de") >= 0) return "de";
    if (l.indexOf("it") >= 0) return "it";
  }
  
  return "fr";
}

function formatCHF(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + "M";
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + "k";
  }
  return amount.toFixed(0);
}

function shortenTitle(title, maxLength) {
  maxLength = maxLength || 35;
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + "...";
}

function getShortTitle(title) {
  // Extract text in parentheses at end
  const match = title.match(/\(([^)]+)\)\s*$/);
  if (match) {
    let result = match[1];
    // Capitalize Initiative
    result = result.replace(/^initiative/i, "Initiative");
    return result;
  }
  
  // Remove law prefixes with dates (fr/de/it)
  let cleaned = title;
  cleaned = cleaned.replace(/^Bundesgesetz vom \d{1,2}\.?\s*\w+\.?\s*\d{4}\s*(ueber|uber|über)?\s*(die\s+)?/i, "");
  cleaned = cleaned.replace(/^Loi f[eé]d[eé]rale du \d{1,2}\s*\w+\s*\d{4}\s*sur\s*(l[ea]?\s*)?/i, "");
  cleaned = cleaned.replace(/^Legge federale del \d{1,2}\s*\w+\s*\d{4}\s*su(ll[ao]?)?\s*/i, "");
  
  if (cleaned !== title && cleaned.length > 0) {
    // Capitalize first letter
    let result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    result = result.replace(/^initiative/i, "Initiative");
    return result;
  }
  
  return shortenTitle(title, 40);
}

function formatUpdateDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length >= 3) {
    return parts[2] + "." + parts[1];
  }
  return dateStr;
}

async function fetchData() {
  try {
    const req = new Request(DATA_URL);
    const data = await req.loadJSON();
    return data;
  } catch (error) {
    return null;
  }
}

async function createSmallWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(12, 12, 12, 12);
  
  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();
  const titleText = titleStack.addText("💰 " + t.title);
  titleText.font = Font.boldSystemFont(11);
  titleText.textColor = COLORS.title;
  
  widget.addSpacer(4);
  
  if (data && data.nextVoteDate) {
    const dateText = widget.addText(t.date_label + " " + data.nextVoteDate);
    dateText.font = Font.systemFont(10);
    dateText.textColor = COLORS.date;
  }
  
  widget.addSpacer(8);
  
  if (data && data.votations && data.votations.length > 0) {
    const maxVotations = Math.min(2, data.votations.length);
    
    for (let i = 0; i < maxVotations; i++) {
      const v = data.votations[i];
      const fullTitle = v.title[lang] || v.title.fr || "N/A";
      const title = getShortTitle(fullTitle);
      
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
  
  if (data && data.lastUpdate) {
    const updateText = widget.addText(t.update + ": " + formatUpdateDate(data.lastUpdate));
    updateText.font = Font.systemFont(8);
    updateText.textColor = COLORS.date;
    updateText.rightAlignText();
  }
  
  return widget;
}

async function createMediumWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(12, 14, 12, 14);
  
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
      const fullTitle = v.title[lang] || v.title.fr || "N/A";
      const title = getShortTitle(fullTitle);
      
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

async function createLargeWidget(data, lang) {
  const t = TRANSLATIONS[lang];
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(14, 16, 14, 16);
  
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
      
      const titleLine = vStack.addText(title);
      titleLine.font = Font.mediumSystemFont(12);
      titleLine.textColor = COLORS.title;
      titleLine.lineLimit = 1;
      
      vStack.addSpacer(4);
      
      const progressStack = vStack.addStack();
      progressStack.layoutHorizontally();
      progressStack.centerAlignContent();
      
      const total = v.supporters_total + v.opponents_total;
      const supPercent = total > 0 ? (v.supporters_total / total * 100) : 50;
      
      const supText = progressStack.addText(t.supporters + ": CHF " + formatCHF(v.supporters_total));
      supText.font = Font.systemFont(11);
      supText.textColor = COLORS.supporters;
      
      progressStack.addSpacer();
      
      if (total > 0) {
        const percentText = progressStack.addText(supPercent.toFixed(0) + "% / " + (100 - supPercent).toFixed(0) + "%");
        percentText.font = Font.systemFont(10);
        percentText.textColor = COLORS.neutral;
      }
      
      progressStack.addSpacer();
      
      const oppText = progressStack.addText(t.opponents + ": CHF " + formatCHF(v.opponents_total));
      oppText.font = Font.systemFont(11);
      oppText.textColor = COLORS.opponents;
      
      widget.addSpacer(8);
      
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
  
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();
  
  const sourceName = lang === "de" ? "EFK" : "CDF";
  const sourceText = footerStack.addText("Source: " + sourceName);
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

async function runWidget() {
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

await runWidget();
