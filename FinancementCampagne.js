// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: money-bill-wave;

// Auto-update loader - Downloads latest widget from GitHub
const WIDGET_URL = "https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/widget.js";

async function loadAndRun() {
  let code = "";
  
  try {
    const req = new Request(WIDGET_URL);
    req.timeoutInterval = 15;
    code = await req.loadString();
    
    if (!code || code.length < 100 || code.includes("404")) {
      throw new Error("Invalid response");
    }
  } catch (e) {
    const w = new ListWidget();
    w.backgroundColor = new Color("#1C1C1E");
    const t = w.addText("Erreur de chargement");
    t.textColor = Color.white();
    t.font = Font.systemFont(12);
    if (config.runsInWidget) {
      Script.setWidget(w);
    } else {
      w.presentMedium();
    }
    Script.complete();
    return;
  }
  
  await eval("(async () => {" + code + "})()");
}

await loadAndRun();
