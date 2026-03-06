# CartoSanté - Zonage Infirmier

## Objectif
Page web où les infirmières libérales (IDEL) tapent le nom de leur ville et voient instantanément le zonage conventionnel infirmier de leur commune.

## URL cible
maisondesinfirmiers.fr/zonage (pour l'instant, déployer sur Vercel)

## Data
Le fichier `zonage-raw.csv` contient 34 919 communes françaises avec :
- Code INSEE (col 1)
- Nom commune (col 2) 
- Zonage (col 3)

Séparateur: point-virgule (;)
Header: 2 lignes (titre + colonnes)
Encoding: UTF-8

### Zones (5 niveaux)
- `1_Tres_sous_dotee` → "Très sous-dotée" (rouge foncé) — zone prioritaire
- `2_Sous_dotee` → "Sous-dotée" (orange) — zone fragile
- `3_intermediaire` → "Intermédiaire" (jaune/neutre)
- `4_Tres_dotee` → "Très dotée" (vert clair)
- `5_Sur_dotee` → "Sur-dotée" (vert foncé) — accès limité
- `N/A` → Non disponible (gris)

## Architecture
- Next.js 15 (App Router)
- Tailwind CSS
- TypeScript
- **PAS de backend** — tout en client-side
- CSV converti en JSON statique au build (script `scripts/convert-csv.ts`)
- Le JSON est importé dans la page, recherche fuzzy côté client

## Page unique: /zonage (aussi page d'accueil /)

### UX
1. Titre: "Zonage Conventionnel Infirmier"
2. Sous-titre: "Découvrez la classification de votre commune en un clic"
3. **Barre de recherche** avec autocomplete (fuzzy search sur nom commune)
   - Debounce 200ms
   - Affiche max 8 suggestions
   - Recherche aussi par code postal si possible (sinon juste nom)
4. **Résultat** affiché sous la barre:
   - Badge coloré avec le zonage
   - Code INSEE
   - Explication de ce que signifie ce zonage
   - Aides disponibles (pour zones sous-dotées)
5. **Section "Comprendre le zonage"** sous le résultat:
   - Explication des 5 zones
   - Tableau récapitulatif
   - Source: "Données CartoSanté - ARS, 2024"

### Aides par zone
- **Très sous-dotée**: Contrat incitatif ARS, aide à l'installation (jusqu'à 37 500€), exonération ZRR, accompagnement CPAM
- **Sous-dotée**: Contrat d'aide à l'installation, accompagnement CPAM
- **Intermédiaire**: Pas d'aide spécifique, installation libre
- **Très dotée**: Installation libre mais pas d'incitations
- **Sur-dotée**: Conventionnement conditionné au départ d'un confrère (règle "1 pour 1")

### Design
- Moderne, clean, professionnel
- Couleurs: bleu santé (#1E40AF) comme accent principal
- Font: Inter ou system-ui
- Mobile-first (les IDEL consultent sur téléphone)
- Pas de header/footer complexe, juste la page
- Background blanc, cards avec shadow subtile

### Stats rapides (affichées en bas)
- Nombre de communes très sous-dotées: X
- Nombre de communes sous-dotées: X  
- etc.

## Script de conversion (scripts/convert-csv.ts)
- Lit zonage-raw.csv
- Parse le CSV (séparateur ;, skip 2 premières lignes header)
- Génère `public/data/zonage.json` avec format:
```json
[
  {"code": "01001", "nom": "L'Abergement-Clémenciat", "zone": 4},
  ...
]
```
Zone mappée en number: 1=très sous-dotée, 2=sous-dotée, 3=intermédiaire, 4=très dotée, 5=sur-dotée, 0=N/A

## Contraintes
- NO em dashes (—) dans le contenu
- NO emojis dans les titres
- Texte en français
- Performance: le JSON fait ~2MB, utiliser une recherche efficace (pas de re-render de 35K items)
- SEO: meta tags, title, description appropriés

## Déploiement
- Vercel
- Créer le repo GitHub: cartosante
