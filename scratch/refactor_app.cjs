const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

// 1. Add Imports
content = content.replace(
  "import { MotazinLogo } from './components/MotazinLogo';",
  "import { MainLayout } from './layouts/MainLayout';\nimport { authService } from './services/authService';\nimport { MotazinLogo } from './components/MotazinLogo';"
);

// 2. Fix Auth
content = content.replace(
  "await signInWithPopup(auth, googleProvider);",
  "await authService.loginWithGoogle();"
);
content = content.replace(
  "const unsubscribe = onAuthStateChanged(auth, (currentUser) => {",
  "const unsubscribe = authService.onAuthStateChanged((currentUser) => {"
);

// 3. Remove navItems array
content = content.replace(/const navItems = \[\s*\{ id: 'equation'[\s\S]*?\];/g, '');

// 4. Replace the Header and Navs with MainLayout
const startHeaderIdx = content.indexOf('{/* Header */}');
const endHeaderIdx = content.indexOf('{/* Balanced Status Banner */}');

if (startHeaderIdx !== -1 && endHeaderIdx !== -1) {
  content = content.substring(0, startHeaderIdx) + `
        <MainLayout
          user={user}
          currentView={currentView}
          currency={currency}
          handleCurrencyChange={handleCurrencyChange}
          accountingPeriod={accountingPeriod}
          setAccountingPeriod={setAccountingPeriod}
          historyIndex={historyIndex}
          historyLength={history.length}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          handleClearAll={handleClearAll}
          setIsPdfScannerOpen={setIsPdfScannerOpen}
          setIsSnapshotsModalOpen={setIsSnapshotsModalOpen}
          setIsTransactionFormOpen={setIsTransactionFormOpen}
          setEditingTransactionId={setEditingTransactionId}
          handleCancelEdit={handleCancelEdit}
          handleGoogleLogin={handleGoogleLogin}
          deferredPrompt={deferredPrompt}
          handleInstallClick={handleInstallClick}
        >
          ` + content.substring(endHeaderIdx);
}

// 5. Replace the closing main and extract Mobile Navigation
const closingMainIdx = content.indexOf('</main>');
if (closingMainIdx !== -1) {
  content = content.substring(0, closingMainIdx) + '</MainLayout>\n      </div>';
  
  // Cut out from `</MainLayout>` until the Snapshots Modal (removing Mobile Navigation)
  const afterMainLayoutIdx = content.indexOf('</div>', closingMainIdx + '</MainLayout>'.length) + 6;
  const snapshotsModalIdx = content.indexOf('{/* Snapshots & Backups Modal */}');
  
  if (snapshotsModalIdx !== -1) {
    content = content.substring(0, afterMainLayoutIdx) + '\n\n      ' + content.substring(snapshotsModalIdx);
  }
}

// Write back
fs.writeFileSync(appTsxPath, content, 'utf8');
console.log('App.tsx refactored successfully.');
