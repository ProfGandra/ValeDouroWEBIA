// Ponte explícita entre o núcleo do app (variáveis globais léxicas) e módulos auxiliares.
// Scripts clássicos com const/let no topo não criam propriedades em window automaticamente.
window.state = state;
window.esc = esc;
window.saveChars = saveChars;
window.savedCharacters = savedCharacters;
window.renderParty = renderParty;
window.openSheet = openSheet;
window.closeSheet = closeSheet;
