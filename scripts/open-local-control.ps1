# SONAFRIK - Ouvre les URLs locales de controle dans le navigateur
# Usage:
#   .\scripts\open-local-control.ps1              # infra + admin (défaut)
#   .\scripts\open-local-control.ps1 -Mode mvp    # chaîne MVP
#   .\scripts\open-local-control.ps1 -Mode all    # tout

param(
    [ValidateSet("control", "mvp", "all")]
    [string]$Mode = "control",

    [string]$BaseUrl = "http://localhost:3000",

    [int]$DelayMs = 150
)

$ErrorActionPreference = "Stop"

$SupabaseStudio = "http://127.0.0.1:54323"
$SupabaseApi = "http://127.0.0.1:54321"
$Storybook = "http://localhost:6006"
$ExpoMetro = "http://localhost:8081"

function Open-Url([string]$Url) {
    Start-Process $Url
    if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }
}

$groups = @{
    infra = @(
        @{ label = "Supabase Studio"; url = $SupabaseStudio }
        @{ label = "Supabase API"; url = $SupabaseApi }
        @{ label = "App Web"; url = $BaseUrl }
        @{ label = "Storybook"; url = $Storybook }
        @{ label = "Expo Metro"; url = $ExpoMetro }
    )
    admin = @(
        @{ label = "Admin Dashboard"; url = "$BaseUrl/admin" }
        @{ label = "Admin Catalogue"; url = "$BaseUrl/admin/catalog" }
        @{ label = "Admin Finances"; url = "$BaseUrl/admin/finance" }
        @{ label = "Admin Fraude"; url = "$BaseUrl/admin/fraud" }
        @{ label = "Admin Droits"; url = "$BaseUrl/admin/rights" }
        @{ label = "Admin Flags"; url = "$BaseUrl/admin/flags" }
        @{ label = "Admin Paramètres"; url = "$BaseUrl/admin/settings" }
        @{ label = "Admin Santé"; url = "$BaseUrl/admin/health" }
    )
    auth = @(
        @{ label = "Connexion"; url = "$BaseUrl/auth/connexion" }
        @{ label = "Inscription"; url = "$BaseUrl/auth/inscription" }
        @{ label = "Mot de passe oublié"; url = "$BaseUrl/auth/mot-de-passe-oublie" }
        @{ label = "Onboarding rôle"; url = "$BaseUrl/onboarding/role" }
        @{ label = "Onboarding artiste"; url = "$BaseUrl/onboarding/artist" }
        @{ label = "Onboarding auditeur"; url = "$BaseUrl/onboarding/listener" }
    )
    creator = @(
        @{ label = "Créateur Dashboard"; url = "$BaseUrl/creator" }
        @{ label = "Créateur Catalogue"; url = "$BaseUrl/creator/catalog" }
        @{ label = "Créateur Morceaux"; url = "$BaseUrl/creator/catalog/tracks" }
        @{ label = "Créateur Releases"; url = "$BaseUrl/creator/catalog/releases" }
        @{ label = "Créateur Analytics"; url = "$BaseUrl/creator/analytics" }
        @{ label = "Créateur Droits"; url = "$BaseUrl/creator/rights" }
        @{ label = "Créateur Vérification"; url = "$BaseUrl/creator/verification" }
        @{ label = "Créateur Identité"; url = "$BaseUrl/creator/identity" }
    )
    listener = @(
        @{ label = "Écoute Accueil"; url = "$BaseUrl/listen" }
        @{ label = "Recherche"; url = "$BaseUrl/search" }
        @{ label = "Bibliothèque"; url = "$BaseUrl/library" }
        @{ label = "Beats"; url = "$BaseUrl/listen/beats" }
        @{ label = "Notifications"; url = "$BaseUrl/notifications" }
    )
    wallet = @(
        @{ label = "Wallet"; url = "$BaseUrl/wallet" }
        @{ label = "Royalties"; url = "$BaseUrl/wallet/royalties" }
        @{ label = "Retraits"; url = "$BaseUrl/wallet/payout" }
    )
    public = @(
        @{ label = "Landing"; url = "$BaseUrl/" }
        @{ label = "Lancement"; url = "$BaseUrl/lancement" }
        @{ label = "Profil"; url = "$BaseUrl/profile" }
        @{ label = "Paramètres"; url = "$BaseUrl/settings" }
        @{ label = "CGU"; url = "$BaseUrl/legal/terms" }
        @{ label = "Confidentialité"; url = "$BaseUrl/legal/privacy" }
    )
}

$selectedGroups = switch ($Mode) {
    "control" { @("infra", "admin") }
    "mvp"     { @("infra", "auth", "creator", "listener", "wallet", "admin") }
    "all"     { @("infra", "admin", "auth", "creator", "listener", "wallet", "public") }
}

$toOpen = [System.Collections.Generic.List[object]]::new()
foreach ($groupName in $selectedGroups) {
    foreach ($entry in $groups[$groupName]) {
        $toOpen.Add($entry)
    }
}

Write-Host ""
Write-Host "SONAFRIK - Ouverture mode '$Mode' - $($toOpen.Count) onglets" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl" -ForegroundColor DarkGray
Write-Host ""

foreach ($entry in $toOpen) {
    Write-Host "  -> $($entry.label): $($entry.url)" -ForegroundColor Green
    Open-Url $entry.url
}

Write-Host ""
Write-Host "Termine. Compte dev: dev@sonafrik.local / DevSonafrik2026!" -ForegroundColor Yellow
Write-Host "Astuce: cd apps\web; pnpm dev  |  supabase start" -ForegroundColor DarkGray
Write-Host ""
