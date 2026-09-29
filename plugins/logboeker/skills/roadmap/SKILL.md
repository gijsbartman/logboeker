---
name: roadmap
description: Maakt of herziet samen met de student de semester roadmap in logboek/roadmap.md. Legt de ambitie vast (op niveau of boven niveau), bepaalt per vaardigheid een doelniveau dat aan de semesternorm voldoet, en plant producten, evaluaties en ontwikkelgesprekken als items die de Logboeker-app als kalender toont. Gebruik deze skill wanneer de student "roadmap", "semester roadmap", "planning maken", "semesterplanning", "welke niveaus ga ik halen", "op niveau of boven niveau" zegt, wanneer logboek/roadmap.md ontbreekt of geen doelniveaus heeft, of wanneer de student de roadmap wil aanpassen na feedback van coach of gildemeester. Niet gebruiken om te beoordelen of de roadmap haalbaar is of hoe de student ervoor staat (toezichthouder skill), of om bewijs per vaardigheid te beoordelen (evaluator skill).
---

# Roadmap

De semester roadmap is het document waarin de student voortgang op producten, evaluaties en feedback plant. Hij is van de student en is het hele semester de leidraad waarmee de student de regie voert over het eigen leer- en werkproces. Coach en gildemeester geven er feedback op, de toezichthouder skill toetst hem aan wat er werkelijk gebeurt.

Deze skill helpt hem maken en bijwerken. Hij stelt voor, de student beslist. Een roadmap die de skill heeft bedacht en de student alleen heeft goedgekeurd, is geen roadmap van de student, en dat merkt de coach in het eerste ontwikkelgesprek.

## Waar het staat

Alles staat in `logboek/roadmap.md`. De app toont de `planning:` als kalender en laat de student items bewerken en afvinken. De app bewaart andere velden in de frontmatter onaangeroerd, dus daar staan ook de ambitie en de doelniveaus.

```markdown
---
ambitie: op-niveau
doelniveaus:
  juiste-kennis-ontwikkelen: 3
  kwalitatief-product-maken: 2
  overzicht-creeren: 3
  kritisch-oordelen: 2
  samenwerken: 2
  boodschap-delen: 2
  plannen: 3
  flexibel-opstellen: 2
  pro-actief-handelen: 2
  reflecteren: 2
planning:
  - titel: Ontwikkelgesprek 1, roadmap bespreken
    datum: week 2
  - titel: Stakeholderanalyse
    datum: week 2
    tot: week 3
    doel: stakeholderanalyse
    vaardigheden: [samenwerken, overzicht-creeren]
    bewijs: [Stakeholderanalyse]
  - titel: Evaluatie Plannen N3
    datum: week 12
    vaardigheden: [plannen]
---

# Roadmap

[Vrije tekst van de student: toelichting, keuzes, afspraken met coach en gildemeester]
```

**De velden van een planning-item:**

| Veld | Verplicht | Betekenis |
|---|---|---|
| `titel` | ja | Korte naam |
| `datum` | ja | `YYYY-MM-DD` of `week N`. Alleen `week N` betekent de vrijdag van die week, een deadline |
| `tot` | nee | Einde van een periode. Met `tot` erbij betekent `datum: week N` de maandag |
| `doel` | nee | De slug die entries in `doelen:` gebruiken, zodat de app de entries bij dit item kan tonen |
| `vaardigheden` | nee | Slugs, alleen de tien vaste. Een onbekende slug is een fout in de app |
| `bewijs` | nee | Namen van bewijsstukken, zoals je ze met `@[...]` zou noemen |
| `afgerond` | nee | Datum waarop het klaar is. Zet de student zelf, of jij op verzoek |

Weken tellen van maandag tot en met zondag, vanaf de week waarin `semesterstart` valt. Gebruik een exacte datum als die bekend is, anders `week N`.

`ambitie` is `op-niveau` of `boven-niveau`. `doelniveaus` heeft voor alle tien vaardigheden een niveau van 1 tot en met 4, of 0 als de student die vaardigheid dit semester niet laat beoordelen.

## De semesternorm

Welke niveaus nodig zijn hangt af van `semester` in `config.md` en van de ambitie. **Op niveau** is de rij van het eigen semester. **Boven niveau** is de rij van het volgende semester; voor semester 7 is dat 8 op 3, 2 op 2, en kwalitatief product maken op 3.

| Semester | Niveau opdracht | Op niveau (LEF) | Kwalitatief product maken | Beheersingsniveau hbo-i |
|---|---|---|---|---|
| 1 | Taak | 4 van 10 op 1 | nvt | |
| 2 | Taak | 8 van 10 op 1 | minimaal 1 | T |
| 3 | Probleem | 4 op 2, 6 op 1 | minimaal 1 | |
| 4 | Probleem | 8 op 2, 2 op 1 | minimaal 2 | P |
| 5 | Situatie | 3 op 3, 7 op 2 | minimaal 2 | |
| 6 | Situatie (keuze, minor) | 4 op 3, 6 op 2 | minimaal 2 | |
| 7 | Situatie | 5 op 3, 5 op 2 | minimaal 2 | |
| 8 | Afstuderen | geen LEF-norm, BOKSA | | S |

Deze tabel staat ook in de toezichthouder skill. Pas je hem aan, pas hem daar ook aan.

**Zo lees je een norm.** "3 op 3, 7 op 2" betekent: minstens 3 vaardigheden op niveau 3 of hoger, en minstens 10 op niveau 2 of hoger. "4 van 10 op 1" betekent minstens 4 vaardigheden op niveau 1 of hoger; de rest mag ontbreken. Kwalitatief product maken is een van de tien vaardigheden en telt mee, met daarnaast een eigen minimum.

Een niveau hoger dan nodig telt ook voor de lagere treden: een vaardigheid op 3 telt mee voor "op 2".

In semester 8 gelden de afstudeerregels (BOKSA), niet deze norm. Maak dan wel een roadmap met ontwikkelgesprekken en producten, maar zonder `ambitie` en `doelniveaus`, en zeg dat erbij.

## Werkwijze

### 1. Lees wat er is

- `config.md`: `semester`, `semesterstart`, `semesterlengte_weken`, `rol`. Ontbreekt `semester` of `semesterstart`, gebruik eerst de setup skill; zonder die twee kun je geen norm of weken bepalen.
- `project.md`: waar het project over gaat en wat de eigen rol is. Ontbreekt het, gebruik de setup skill; zonder projectcontext wordt de roadmap een lijst losse evaluaties.
- `logboek/roadmap.md`: bestaat hij al, dan is dit een herziening. Lees de bestaande items en tekst.
- `data/markdown/vaardigheden.md` voor de criteria per niveau, en `data/markdown/beroepsproducten.md` voor passende producten bij rol en gilde. Ontbreekt iets, gebruik de lef-data skill.
- Bij een herziening ook `logboek/daily/` en `logboek/evidence/`, om te zien wat er al ligt.

### 2. Kies de ambitie

Leg de twee opties uit met de norm die erbij hoort, voor dit semester concreet uitgeschreven:

```
Je zit in semester 5.
- Op niveau: 3 vaardigheden op 3, de andere 7 op 2. Kwalitatief product maken minimaal op 2.
- Boven niveau: 4 op 3, 6 op 2. Kwalitatief product maken minimaal op 2.
Wat wil je?
```

De keuze is aan de student. Vraag wel waarom, want dat helpt bij de volgende stap, en de coach vraagt het ook.

### 3. Bepaal de doelniveaus samen

Loop de tien vaardigheden langs. Vraag per vaardigheid, of per groepje, welk niveau de student realistisch vindt, gegeven het project en de eigen rol. Help met wat je weet:

- Waar biedt het project ruimte voor een hoger niveau? Lees de criteriatekst voor dat niveau en vergelijk met `project.md`. Een project zonder externe opdrachtgever maakt bijvoorbeeld sommige niveau 3-criteria lastig.
- Waar heeft de student al bewijs, bij een herziening?
- Welke vaardigheden hebben een lange aanloop nodig? Lees de niveau 3-criteria op wat er vroeg in het semester moet starten, bijvoorbeeld betrokkenen buiten de opleiding of een nulmeting vóór een initiatief. Dat moet dan vroeg op de roadmap.

Tel daarna na of het totaal aan de norm voldoet, en zeg het concreet:

```
Nu: 2 op 3, 8 op 2. Voor op niveau heb je 3 op 3 nodig.
Kandidaten om op 3 te zetten: plannen (je bent al scrum master) of overzicht creëren
(de analyse van de bestaande codebase past bij de criteria).
```

Heeft de student meer dan nodig, zeg dat ook. Dat is ruimte, en ruimte is nuttig als een vaardigheid later tegenvalt.

Schrijf `ambitie` en `doelniveaus` pas in de frontmatter als de student akkoord is.

### 4. Plan per vaardigheid een evaluatie en het bewijs erachter

Voor elke vaardigheid met een doelniveau:

- **Een evaluatie-item**: `titel: Evaluatie <Vaardigheid> N<niveau>`, `datum: week N`, `vaardigheden: [slug]`. Plan evaluaties uiterlijk in week 17; week 18 en 19 zijn verbeterweken en moeten daarvoor vrij blijven. Spreid ze: tien evaluaties in dezelfde week lukt niet. Een eerdere evaluatie op een lager niveau als tussenstap mag, als de student feedback wil voordat het telt.
- **De producten waar die evaluatie op leunt**: items met `doel` (de slug die entries straks in `doelen:` dragen), `vaardigheden` en `bewijs` (de namen die het bewijsstuk gaat krijgen). Kies producten die uit het project zelf voortkomen, niet producten die alleen voor een vaardigheid worden gemaakt.

Voor kwalitatief product maken geldt: het is een pakket, geen checklist. Plan een samenhangend geheel van producten vanuit de eigen beroepsrol, zie `data/markdown/beroepsrollen.md` en `beroepsproducten.md`, en geen losse producten per vakje.

Een item mag meerdere vaardigheden dragen. Eén goed product dat drie vaardigheden raakt is beter dan drie losse.

### 5. Zet de vaste momenten erin

Deze komen uit de studiewijzer en horen in elke roadmap, als gewone items:

| Item | Wanneer |
|---|---|
| Ontwikkelgesprek met de coach | Om de twee weken, week 2 tot en met 16. Gebruik de echte data als de student die weet |
| Ontwikkelgesprekken 1 en 2: roadmap bespreken | Week 2 en 4 |
| Feedback op de semester roadmap, notitie in Portflow | Uiterlijk week 4. Van de coach in semester 1 en 2, van coach en gildemeester in semester 3 tot en met 7 |
| Voortgang op de roadmap bespreken | Minstens één ontwikkelgesprek tussen week 9 en 11 |
| Verbeterweken | `datum: week 18`, `tot: week 19` |
| Voorbereiding | Week 20 |

Noem de ontwikkelgesprekken met nummer, zodat ze in de kalender herkenbaar zijn: `Ontwikkelgesprek 3`. Het gesprek in week 4 en dat tussen week 9 en 11 krijgen het onderwerp in de titel.

### 6. Schrijf het bestand

- Bestaat `logboek/roadmap.md` niet, maak hem aan met de frontmatter en een kort kopje `# Roadmap`.
- Bestaat hij al, bewerk hem. Laat bestaande items staan, ook afgeronde. Pas een item aan in plaats van het te verwijderen en opnieuw toe te voegen. Verwijder alleen wat de student expliciet weg wil.
- Houd de vrije tekst onder de frontmatter van de student. Voeg er alleen iets aan toe als de student dat vraagt, bijvoorbeeld een samenvatting van de feedback van de coach.
- Gebruik voor een `doel` een slug die al in entries voorkomt als dat hetzelfde product is. De app waarschuwt bij doelen die op elkaar lijken.

Loop daarna na: elk item heeft `titel` en `datum`, `tot` ligt niet vóór `datum`, alle slugs bestaan, en de YAML is geldig. De app toont anders een fout bij de roadmap.

### 7. Sluit af

Geef een korte stand: de norm en hoe de doelniveaus daaraan voldoen, het aantal geplande evaluaties per blok weken, en wat de eerste twee weken moet gebeuren. Noem dat de roadmap in de eerste twee ontwikkelgesprekken met de coach wordt besproken, en dat de toezichthouder skill hem gedurende het semester tegen de werkelijkheid houdt.

## Bij een herziening

Een roadmap wordt tijdens het semester aangepast: na feedback van coach of gildemeester, of omdat de werkelijkheid anders loopt. Dat is normaal en hoort zo.

- Vraag wat de aanleiding is: feedback, een advies van de toezichthouder, of een verandering in het project.
- Verlaagt de student een doelniveau, reken dan meteen na of de norm nog gehaald wordt, en welke andere vaardigheid omhoog kan als dat niet zo is.
- Schuift een evaluatie op, kijk of hij daarmee niet in de verbeterweken belandt.
- Schrijf het niet stilzwijgend weg. Laat zien wat er verandert voordat je het bestand aanpast.

## Wat je niet doet

**Geen doelniveaus kiezen voor de student.** Je stelt voor en rekent na, de student beslist.

**Geen evaluatieteksten of reflecties schrijven.** Ook niet als toelichting in de roadmap. Volgens de Open-ICT AI-regels schrijft de student die zelf.

**Geen items voor terugkerende gewoontes.** Feedback vragen en geven, of dagelijks loggen, hoort niet als item op de roadmap. Dat is gedrag, geen mijlpaal, en het vervuilt de kalender. De toezichthouder kijkt in de logs of het gebeurt.

## Toon

Nederlands, nuchter, direct. Geen em-dashes. Rekenen doe je hardop en concreet, zodat de student ziet waar het krapt.
