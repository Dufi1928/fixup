This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Thème clair/sombre et responsivité

- Un sélecteur de thème est disponible en haut à droite (soleil/lune). Il bascule entre le thème clair et le thème sombre et mémorise votre choix dans le navigateur.
- Par défaut, le thème suit le thème système si aucun choix n'a été mémorisé.
- Techniquement, le thème est appliqué via l'attribut `data-theme` sur la balise `html` (`light` | `dark`) et une classe `dark` pour les variantes Tailwind. Les couleurs passent par des variables CSS déclarées dans `app/globals.css`.

### Où modifier
- Provider et hook: `lib/theme-context.tsx`
- Bouton de bascule (toggle): `components/ThemeToggle.tsx`
- En-tête global: `components/Header.tsx` (affiché sur toutes les pages)
- Tokens couleurs et overrides: `app/globals.css`

### Responsivité
- La mise en page globale enveloppe tout le contenu dans un conteneur fluide et responsive (`max-w-screen-xl` + `px-4 sm:px-6 lg:px-8`) défini dans `app/layout.tsx`. Cela assure une bonne lisibilité sur mobile, tablette et desktop.
- Pour les contenus très larges (listes, tableaux, etc.), utilisez la classe utilitaire `.responsive-container` (définie dans `globals.css`) pour activer un défilement horizontal sur mobile.

### Bonnes pratiques pour ajouter de nouvelles vues
- Utilisez les tokens CSS (`--background`, `--foreground`, `--primary`, etc.) ou les classes Tailwind avec variantes `dark:` au lieu de couleurs codées en dur.
- Évitez de fixer des largeurs en pixels; préférez `w-full`, `max-w-*`, flex/grid et `gap-*`.
- Contrôlez vos formulaires avec `w-full` sur les inputs et des espacements adaptés (`py-3 px-4`, etc.).
