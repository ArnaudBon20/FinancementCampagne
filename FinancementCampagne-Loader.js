// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: money-bill-wave;

// Loader - Financement des Campagnes
// Charge automatiquement la derniere version depuis GitHub

const WIDGET_URL = "https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/FinancementCampagne.js";
const CACHE_FILE = "FinancementCampagne-Cache.js";
const MODULE_NAME = "FinancementCampagne-Module";

const fm = FileManager.local();
const docsDir = fm.documentsDirectory();
const modulePath = fm.joinPath(docsDir, MODULE_NAME + ".js");

async function downloadAndSave() {
  try {
    const req = new Request(WIDGET_URL);
    req.timeoutInterval = 15;
    const code = await req.loadString();
    
    if (code && code.length > 100 && !code.includes("404")) {
      fm.writeString(modulePath, code);
      console.log("Module updated from GitHub");
      return true;
    }
  } catch (e) {
    console.log("Download error: " + e);
  }
  return false;
}

async function showErrorWidget(msg) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1C1C1E");
  const text = widget.addText("⚠️ " + msg);
  text.textColor = Color.white();
  text.font = Font.systemFont(11);
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentMedium();
  }
  Script.complete();
}

// Download latest version
await downloadAndSave();

// Check if module exists
if (!fm.fileExists(modulePath)) {
  await showErrorWidget("Module not found");
} else {
  // Import and run the module
  const widget = importModule(MODULE_NAME);
}
