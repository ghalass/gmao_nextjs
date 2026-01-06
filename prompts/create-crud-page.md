# Prompt pour créer une page CRUD complète

## Configuration
- **ModelName** : `Lubrifiant` (nom exact du modèle dans prisma/schema.prisma, ex: Typelubrifiant, Engin, Parc)

## Instructions
Le prompt va automatiquement analyser le schéma Prisma pour extraire :
- Le nom de la table depuis `@@map("table_name")`
- Les champs et leurs types
- Les relations avec d'autres modèles
- Les contraintes (unique, default, etc.)

Génère une page CRUD complète pour le modèle `{ModelName}` en suivant la même architecture que la gestion des sites.

## Structure à générer :

### 1. API Routes
**Fichier :** `app/api/{table_name}/route.ts` (nom déduit depuis @@map)
- GET : Récupérer tous les enregistrements avec relations si nécessaire
- POST : Créer un nouvel enregistrement
- Inclure la protection RBAC avec `protectReadRoute` et `protectCreateRoute`
- Gérer les erreurs de validation et les contraintes d'unicité

**Fichier :** `app/api/{table_name}/[id]/route.ts`
- GET : Récupérer un enregistrement par ID
- PUT : Mettre à jour un enregistrement
- DELETE : Supprimer un enregistrement
- Inclure la protection RBAC avec `protectReadRoute`, `protectUpdateRoute`, `protectDeleteRoute`

### 2. Hook React
**Fichier :** `hooks/use{ModelName}.ts`
- Interface TypeScript pour le modèle et les données du formulaire
- Hook `use{ModelName}` avec TanStack Query
- Mutations pour créer, mettre à jour, supprimer
- Invalidation automatique du cache

### 3. Schéma de validation
**Fichier :** `lib/validations/{table_name}Schema.ts`
- Schéma Yup avec validation française
- Types TypeScript déduits
- Messages d'erreur en français

### 4. Composants UI
**Fichier :** `components/{table_name}/{ModelName}Form.tsx`
- Formulaire avec React Hook Form et Yup
- Champs adaptés au modèle de données
- Gestion des états loading/error

**Fichier :** `components/{table_name}/{ModelName}Modal.tsx`
- Modal réutilisable pour créer/éditer
- Intégration avec le formulaire

**Fichier :** `components/{table_name}/Delete{ModelName}Modal.tsx`
- Modal de confirmation de suppression

### 5. Page principale
**Fichier :** `app/(main)/{table_name}/page.tsx`
- Tableau avec pagination, tri, filtrage
- Recherche globale et par colonne
- Actions CRUD (créer, éditer, supprimer)
- Export Excel
- Design responsive avec Tailwind CSS et shadcn/ui

## Caractéristiques techniques requises :

### Architecture
- Next.js 16 avec App Router
- TypeScript strict
- Prisma ORM avec PostgreSQL
- TanStack Query pour la gestion d'état serveur
- Tailwind CSS + shadcn/ui pour le style
- React Hook Form + Yup pour les formulaires

### Sécurité
- Middleware RBAC pour chaque route API
- Validation des entrées côté serveur et client
- Protection CSRF

### UX/UI
- Loading states avec skeleton
- Gestion d'erreurs utilisateur
- Confirmations pour les actions destructives
- Accessibilité (ARIA labels, keyboard navigation)
- Design responsive mobile-first

### Performance
- Pagination côté serveur
- Mise en cache avec TanStack Query
- Optimimisations React (useMemo, useCallback)

## Relations entre tables :
Analyse automatiquement le modèle Prisma `{ModelName}` pour extraire :
- Le nom exact de la table depuis `@@map("table_name")`
- Tous les champs avec leurs types (String, Boolean, DateTime, Int, Float, etc.)
- Les champs uniques avec `@unique`
- Les valeurs par défaut avec `@default()`
- Les relations 1-N et N-M avec d'autres modèles
- Les contraintes de suppression

## Exemple d'analyse du modèle :
```prisma
model {ModelName} {
  id        String   @id @default(cuid())
  name      String   @unique
  active    Boolean  @default(true)
  // Autres champs...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations...
  @@map("table_name")
}
```

## Instructions spécifiques :
1. Analyse le modèle `{ModelName}` dans `prisma/schema.prisma`
2. Extraire automatiquement le nom de la table depuis `@@map()`
3. Générer les champs du formulaire selon les types de données
4. Inclure les relations appropriées dans les requêtes Prisma
5. Adapter les validations selon les contraintes (@unique, @default)
6. Maintenir la cohérence avec le code existant
7. Ajouter les exports Excel si pertinent
8. Inclure les filtres appropriés selon les champs

Génère tous les fichiers nécessaires avec le code complet et fonctionnel en se basant uniquement sur le nom du modèle `{ModelName}`.
