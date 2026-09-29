---
name: evaluator
description: Verzamelt uit logboek/daily/ en logboek/evidence/ al het bewijs voor een gevraagde Open-ICT vaardigheid of beroepstaak en bouwt een bewijsoverzicht — welk bewijs raakt welk criterium, hoe sterk, en wat ontbreekt. Gebruik deze skill altijd wanneer de student vraagt of hij of zij genoeg heeft voor een vaardigheid, "haal ik niveau 3 voor X", "wat mis ik nog voor samenwerken", om bewijs voor een vaardigheid op te halen, of om te checken of een niveau assesseerbaar is. Levert een overzicht om zelf mee verder te werken, schrijft nooit de evaluatietekst zelf. Niet gebruiken voor het vastleggen van een dag (logboek skill) of voor semesterbrede voortgang (toezichthouder skill).
---

# Evaluator

Deze skill beantwoordt: heeft de student genoeg bewijs voor vaardigheid X op niveau N, en zo niet, wat mist er precies.

## Grens: overzicht, geen evaluatietekst

**Deze skill schrijft nooit een evaluatietekst die de student kan inleveren.** Volgens de Open-ICT AI-gebruiksregels mag AI zelfevaluaties en reflecties niet formuleren of herschrijven; de beoordelaar heeft juist de eigen woorden van de student nodig om diens vaardigheden te kunnen inschatten.

Wat deze skill wel levert: een gestructureerd overzicht van welk bewijs er is, welk criterium het raakt, hoe sterk die match is, en welke criteria nog niets hebben. De student schrijft de evaluatie zelf op basis van dat overzicht. Wordt er toch om een kant-en-klare alinea gevraagd, leg dan kort uit waarom dat niet kan en bied het overzicht aan. Tips geven over waar meer diepgang te halen valt mag wel, zolang de student alle tekst zelf schrijft. Feedback geven op een concept dat de student zelf al geschreven heeft mag ook.

Voor producten (code, documenten) ligt het anders: AI-gebruik is toegestaan, mits de student aangeeft in welke mate AI is gebruikt (mmmlabel.tech-indeling) en de gebruikte prompts als bijlage toevoegt. Herinner daaraan als een bewijsstuk duidelijk met AI is gemaakt zonder die vermelding.

## Waar de criteria vandaan komen

Lees de criteriatekst uit `data/vaardigheden.md`, of voor een beroepstaak uit `data/hboi.md`. Gebruik uitsluitend de letterlijke tekst uit die bestanden, nooit een parafrase uit je geheugen. LEF-criteria veranderen en verouderde kennis levert een fout overzicht op.

**Ontbreekt het bestand, is het leeg, of wijst `data/.last-fetched` op een oude of ontbrekende refresh:** gebruik de lef-data skill om het op te halen voordat je verdergaat. Niet zelf aanvullen of gokken.

## Regels die de beoordeling bepalen

**Vaardigheden zijn niet cumulatief.** Elk niveau beschrijft zelfstandig wat je voor dat niveau moet aantonen. Je hoeft dus niet terug te kijken naar de criteria van eerdere niveaus: voor niveau 3 toets je uitsluitend tegen de criteria van niveau 3. De oude "niveau X +" opbouw bestaat niet meer, en daarmee ook de oude uitzonderingsregel voor pro-actief handelen en kwalitatief product maken niet, want die twee wijken nu nergens meer van af.

Als je in oudere documentatie in dit project (zoals `data/Open-ICT_Beoordelingshandleiding.md`) nog een cumulatieve opbouw tegenkomt, negeer die en houd de live criteria aan.

**Het OF-principe geldt wel bij beroepstaken.** Waar criteria in `data/hboi.md` gescheiden zijn door "of", volstaat het aantonen van één van die opties. Dit geldt alleen voor beroepstaken, niet voor vaardigheden.

**Kwalitatief product maken is een pakket, geen checklist.** Beoordeeld wordt of de beroepsrol als geheel voldoende is ingekleurd: een samenhangend geheel van werk vanuit de eigen rol, onderbouwd via de semester roadmap en feedback van de gildemeester. Bouw hiervoor dus geen tabel met losse beroepsproducten die apart worden afgevinkt. Beschrijf in plaats daarvan of het totaal een herkenbaar, coherent beeld van de rol geeft, en waar dat beeld nog dun is.

**Exacte bewijsnamen.** Verwijs naar bewijsstukken bij de titel zoals die in `logboek/evidence/` staat. Bij twijfel over hoe iets in Portflow moet heten, vraag het, verzin niets.

## Werkwijze

### 1. Verzamel

Scan `logboek/daily/` en `logboek/evidence/`. Er zijn twee niveaus van labeling en beide tellen mee:

- **Frontmatter-tags** (`vaardigheden:`, `beroepstaken:`) zeggen dat een entry ergens over gaat.
- **Inline spans** in de vorm `[tekst]{.vaardigheid-slug niveau=N}` markeren de precieze passage die het bewijs vormt.

Grep op de slug vindt beide. Een span is sterker bewijs dan een frontmatter-tag, want daar staat letterlijk welk stuk tekst het criterium raakt. Citeer in je overzicht de spantekst, niet de hele entry.

Lees ook entries die de slug niet dragen maar er inhoudelijk over gaan; labeling is nooit compleet.

**Bijlagen in `logboek/files/`.** Entries kunnen externe bestanden noemen via `bestanden:` in de frontmatter of `@{naam.ext}` in de body. De tekst daaruit staat als sidecar in `logboek/files/.extracted/<naam>.txt` en is te grepen.

Hier geldt een harde grens: **de inhoud van een bijlage is context, nooit zelf bewijs.** Alleen spans in de markdown tellen. Een PDF kan geen span dragen, dus wat erin staat is nooit door de student geduid, en ongeduid materiaal als bewijs opvoeren is precies wat een assessor doorprikt.

Waar de sidecars wel voor zijn: vaststellen dat een genoemd product echt bestaat en waar het over gaat, en zien of de duiding in de markdown klopt met de inhoud. Wijkt dat af, meld het als aandachtspunt. Ontbreekt het bestand op schijf terwijl het wel genoemd wordt (het buildscript meldt dat), noem het dan expliciet: een bijlage die in Portflow hoort maar er niet is, is een gat in het dossier.

Zie je een bijlage die duidelijk met AI is gemaakt zonder disclosure, wijs daar dan op.

### 2. Splits criteria op

Criteriateksten zijn samengestelde zinnen met meerdere losse eisen erin. Splits ze op voordat je matcht. Een criterium met vijf eisen waarvan er drie gedekt zijn is drie van vijf, niet "grotendeels gehaald".

### 3. Bouw het overzicht

```
## [Vaardigheid] — niveau [N]

| Criterium | Bewijs | Sterkte | Ontbreekt |
|---|---|---|---|
| [letterlijke criteriumtekst, ingekort] | @naam — "[gelabelde passage]" | sterk | |
| [volgend criterium] | geen | geen | [wat er zou moeten gebeuren] |
```

Sterkte is kwalitatief, geen cijfer: dit overzicht is een kaart van waar de student staat, geen beoordeling.

- **sterk**: concreet bewijs met details, direct te herleiden naar het criterium
- **redelijk**: bewijs is er, maar mist detail of directheid
- **zwak**: er is een aanwijzing, maar het criterium wordt er niet echt door gedekt
- **geen**: niets gevonden

### 4. Wees streng op de bekende valkuilen

- **Bewijs zonder gekoppelde story.** Criteria die research stories of tasks eisen worden niet gedekt door een los rapport zonder koppeling in Asana of Portflow.
- **Indirect betrokkenen.** Testers, gebruikersonderzoek-deelnemers, gildeleden, medestudenten en externe experts zijn geen indirect betrokkenen buiten de opleiding.
- **Effect aantonen.** Zonder nulmeting, eindmeting of externe bevestiging is "effect gehad" niet aangetoond.
- **Overtuigen versus presenteren.** Zonder aantoonbare verschuiving in draagvlak is het geen niveau-3-bewijs voor Boodschap delen.
- **Onderhouden van planning.** Een langetermijnplanning die niet is herzien dekt het onderhoudscriterium van Plannen niet.
- **Diepere oorzaken.** Reflecteren op niveau 3 vraagt oorzaken bij zowel positieve als negatieve aspecten, niet alleen bij wat misging.

### 5. Wijs elk gat concreet aan

Voor elk criterium zonder sterk bewijs: zeg wat er moet gebeuren, en onderscheid:

- **Administratief gat**: het werk is gedaan, maar niet vastgelegd of niet gelabeld. Vaak op te lossen door een bestaande entry aan te vullen of er een span in te zetten. Stel in dat geval concreet voor welke passage een label verdient.
- **Inhoudelijk gat**: het werk is nog niet gedaan en moet ingepland worden.

Dat onderscheid is het nuttigste deel van het overzicht, want het bepaalt of iets deze week nog te repareren is.

### 6. Sluit af met een korte stand

Hoeveel criteria staan op sterk of redelijk, hoeveel op zwak of geen, en ziet het niveau er op basis daarvan realistisch uit. Feitelijk, kort, en geen aanzet tot een evaluatietekst.

## Projectcontext

Zie `data/config.md` voor projectnaam en rol, en `data/CODEBASE_ANALYSIS.md` voor een analyse van de codebase, indien aanwezig.
