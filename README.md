# Today Time Plugin for Obsidian

Ce plugin met à jour automatiquement une propriété `today` dans le frontmatter d'une note spécifiée avec la date et l'heure actuelles.

## Fonctionnalités

- Mise à jour automatique toutes les secondes
- Format de date/heure personnalisable (utilise la syntaxe moment.js)
- Sélection facile de la note à mettre à jour
- Création automatique du frontmatter si inexistant

## Configuration

1. Sélectionnez la note à mettre à jour dans les paramètres du plugin
2. Personnalisez le format de date/heure selon vos besoins (par défaut: YYYY-MM-DD HH:mm:ss)

## Format

Le plugin utilise la syntaxe moment.js pour le formatage. Exemples :
- `YYYY-MM-DD HH:mm:ss` → 2024-02-14 15:30:45
- `DD/MM/YYYY HH:mm` → 14/02/2024 15:30
- `MMMM Do YYYY, h:mm a` → February 14th 2024, 3:30 pm

## Licence

MIT License © 2024 Henri Jamet
