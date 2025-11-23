#!/bin/bash

# Script pour ajouter export const dynamic = 'force-dynamic' aux pages client

echo "🔧 Ajout des directives dynamic aux pages client..."

# Liste des fichiers à modifier
files=(
  "app/alimentations/page.tsx"
  "app/update-product/[productId]/page.tsx"
  "app/give/page.tsx"
  "app/mobile-test/page.tsx"
  "app/statistiques/page.tsx"
  "app/page.tsx"
  "app/post-sign-in/page.tsx"
  "app/octrois/page.tsx"
  "app/sign-in/[[...sign-in]]/page.tsx"
  "app/reset-password/page.tsx"
  "app/transactions/page.tsx"
  "app/forgot-password/page.tsx"
  "app/new-product/page.tsx"
  "app/admin/users/pending/page.tsx"
  "app/dashboard/page.tsx"
  "app/admin/settings/page.tsx"
  "app/admin/users/page.tsx"
  "app/admin/ministeres/page.tsx"
  "app/admin/structures/page.tsx"
  "app/admin/roles/page.tsx"
  "app/category/page.tsx"
  "app/products/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Vérifier si les directives existent déjà
    if ! grep -q "export const dynamic" "$file"; then
      echo "  ✓ $file"
      # Ajouter après 'use client' si présent
      if grep -q '"use client"' "$file"; then
        sed -i '' '/^"use client";$/a\
\
// Force dynamic rendering (évite erreurs prerendering)\
export const dynamic = '\''force-dynamic'\'';\
export const revalidate = 0;
' "$file"
      fi
    else
      echo "  ⊘ $file (déjà configuré)"
    fi
  fi
done

echo "✅ Terminé!"
