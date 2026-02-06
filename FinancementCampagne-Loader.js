// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: money-bill-wave;

/**
 * Loader pour le widget Financement des Campagnes
 * 
 * Ce script charge automatiquement la dernière version du widget
 * depuis GitHub à chaque exécution.
 * 
 * Installation unique : copiez ce fichier dans Scriptable,
 * les mises à jour seront automatiques.
 */

const WIDGET_URL = "https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/FinancementCampagne.js";
const CACHE_FILE = "FinancementCampagne-Cache.js";

async function loadWidget() {
  const fm = FileManager.local();
  const cacheDir = fm.cacheDirectory();
  const cachePath = fm.joinPath(cacheDir, CACHE_FILE);
  
  let code;
  
  try {
    // Télécharger la dernière version
    const req = new Request(WIDGET_URL);
    req.timeoutInterval = 10;
    code = await req.loadString();
    
    if (code && code.length > 100) {
      // Sauvegarder en cache
      fm.writeString(cachePath, code);
      console.log("Widget mis à jour depuis GitHub");
    } else {
      throw new Error("Code invalide");
    }
  } catch (error) {
    console.log("Erreur réseau, utilisation du cache: " + error);
    // Utiliser le cache si disponible
    if (fm.fileExists(cachePath)) {
      code = fm.readString(cachePath);
    } else {
      // Afficher un widget d'erreur
      const widget = new ListWidget();
      widget.backgroundColor = new Color("#1C1C1E");
      const text = widget.addText("⚠️ Erreur de chargement");
      text.textColor = Color.white();
      text.font = Font.systemFont(12);
      Script.setWidget(widget);
      Script.complete();
      return;
    }
  }
  
  // Exécuter le code du widget
  await eval(code);
}

await loadWidget();
