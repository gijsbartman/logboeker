---
date: 2026-09-09
titel: ADR 001 Tokenlaag in app.css
vaardigheden: [kritisch-oordelen]
beroepstaken: [software-ontwerpen]
---

# ADR 001: tokenlaag in app.css

## Context

Componenten mengen inline Bootstrap-utilities met scoped CSS, en z-index-waarden staan hardcoded op drie plekken in JS.

## Beslissing

[Drie opties afgewogen: alles in scoped CSS houden, een tokenlaag in app.css, of een CSS-in-Blazor aanpak. Getoetst aan onderhoudbaarheid, aantal raakvlakken tussen rollen, en hoeveel bestaande code moet wijzigen. De tokenlaag scoorde het hoogst op de eerste twee tegen de laagste migratiekosten.]{.kritisch-oordelen niveau=2}
