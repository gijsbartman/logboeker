---
name: logboek
description: Voert de dagelijkse check-in en check-out uit en legt die vast in logboek/daily/. Bij de check-in haalt de skill zelf op wat er gisteren openstond en wat er op het bord op naam van de student loopt, en helpt de dag als todolijst plannen. Bij de check-out kijkt de skill naar git en de tracker, vraagt door op de echte Open-ICT criteria en labelt de passages die als bewijs kunnen dienen. Gebruik deze skill altijd wanneer de student "check-in", "check-out", "logboek", "goedemorgen", "wat ga ik doen", "wat heb ik gedaan", "einde dag" zegt, de dag wil starten of afsluiten, of een dag wil bijwerken of inhalen. Niet gebruiken voor het beoordelen van bewijs per vaardigheid (evaluator skill), voortgangsbewaking (toezichthouder skill) of het aanmaken van Jira-stories (stories skill).
---

# Logboek

Deze skill begeleidt twee momenten per dag: een **check-in** 's ochtends en een **check-out** 's middags of 's avonds. Beide schrijven naar hetzelfde bestand, `logboek/daily/YYYY-MM-DD.md`. De projectcontext (projectnaam, rol, tracker, code-repo) staat in `data/config.md`.

Het probleem dat deze skill oplost is tweeledig. Zonder check-in begint de dag zonder structuur en wordt de drempel om te loggen zo hoog dat er niks gebeurt. Zonder check-out leg je te weinig vast tijdens het werk en moet je aan het eind van het semester bewijs reconstrueren dat je half vergeten bent.

**De twee helften hebben verschillende regels.** Verwar ze niet:

| | Check-in | Check-out |
|---|---|---|
| Kop in het bestand | `## Check-in`, met daaronder `### Wat ga ik doen vandaag?` en `### Hulpvragen` | `## Check-out`, met daaronder `### Wat heb ik gedaan vandaag?` en `### Openstaand` |
| Vorm | Todolijst, korte regels | Lopende tekst met spans |
| Doel | De student weet wat hij moet doen | Bewijs dat later standhoudt |
| Detailniveau | Laag. Geen bewijs, geen spans | Hoog. Dit is het bewijsdeel |
| Doorvragen | Nee, alleen voorstellen | Ja, gericht op criteria |

De `## Check-in` en `## Check-out` koppen zijn vast en altijd aanwezig als dat blok er is: ze maken de twee helften ook visueel uit elkaar in de viewer, los van elkaar doorzoekbaar en filterbaar. Alles wat bij die helft hoort komt er als `###` onder, nooit als eigen `##`.

Schrijf bij de check-in dus geen spans en geen uitgebreide beschrijvingen. Dat is verspilde moeite, want 's avonds herschrijf je het toch op basis van wat er echt gebeurd is.

## Bronnen die je zelf ophaalt

De student hoort niet te hoeven vertellen wat er gisteren gebeurde of wat er op het bord staat. Dat zoek je op.

**Config eerst.** Lees `data/config.md`. Daar staan de projectsleutel, de site, het pad naar de code-repo en de statussen van het bord. Ontbreekt het bestand of is een veld dat je nodig hebt leeg, gebruik dan de setup skill in plaats van te raden of te vragen. Hieronder staat `{veldnaam}` voor de waarde uit die config.

**Tracker.** Is `tracker: geen`, sla dit hele blok over. Bij `jira`: gebruik de Atlassian MCP-tools op `{jira_site}`. De JQL die je bijna altijd wilt:

```
project = {jira_project_key} AND assignee = currentUser() AND statusCategory != Done ORDER BY status ASC, updated DESC
```

Voor de check-out, om te zien wat er vandaag is bewogen:

```
project = {jira_project_key} AND assignee = currentUser() AND updated >= -1d ORDER BY updated DESC
```

Let op: de projectsleutel is wat vóór het issuenummer staat, en dat is vaak iets anders dan de projectnaam. Een JQL met de naam in plaats van de sleutel geeft geen foutmelding maar nul resultaten, en dat lijkt op een rustige dag.

Kijk naar `{jira_statussen}` voor de kolommen van dit bord. Zit er een tussenkolom in zoals In Review, lees die dan niet als Done.

Is de MCP niet beschikbaar of geeft hij een fout, zeg dat één keer en ga door zonder. Verzin nooit issue-keys of statussen, want een verzonnen issuenummer in een logboek is erger dan geen nummer.

**Git.** De code staat in `{code_repo}`, niet in deze map. Is dat veld leeg, sla de git-stappen over. Voor de check-out:

```bash
cd {code_repo} && \
  git log --since="yesterday" --author="$(git config user.email)" --stat --oneline && \
  git status --short && git diff --stat
```

Commits zijn ruw materiaal, geen bewijs. Ze vertellen wat er is veranderd, niet waarom, en juist het waarom is wat een criterium raakt. Gebruik ze om te herkennen wat de student vergeten is te noemen, niet om de entry mee te vullen.

**Gisteren.** Lees de vorige entry in `logboek/daily/`, vooral het `### Openstaand` blok onder `## Check-out`. Lees ook de twee dagen daarvoor, want dan zie je of iets blijft hangen.

**Criteria.** Lees `data/vaardigheden.md` en `data/hboi.md` voordat je doorvraagt. Baseer doorvragen uitsluitend op de letterlijke criteriateksten daar. Ontbreekt een van beide of ontbreekt `data/.last-fetched`, gebruik dan de lef-data skill. Verzin nooit eigen criteria, want een entry die op een verzonnen criterium is gebouwd houdt geen stand bij de beoordeling.

## Check-in

Doel: de student weet binnen twee minuten wat hij vandaag gaat doen, zonder dat het loggen zelf een obstakel wordt.

### 1. Haal op en vat samen

Draai de Jira-query en lees de vorige entries. Presenteer dan compact, in deze volgorde:

```
Gisteren bleef open:
- [uit het Openstaand-blok van de vorige entry]

Jira, op jouw naam:
- PROJ-14 In Progress — [titel]
- PROJ-17 To Do — [titel]

Blijft hangen: PROJ-14 staat sinds maandag op In Progress.
```

Die laatste regel alleen als het zo is. Iets dat drie dagen op In Progress staat is meestal geen werk maar een blokkade, en dat is precies waar de student zelf overheen kijkt.

### 2. Doe een voorstel voor vaardigheden

Kijk naar welke vaardigheden de afgelopen twee weken niet zijn geraakt, en of het werk van vandaag daar toevallig ruimte voor biedt. Eén of twee suggesties, concreet, uit de criteriatekst:

```
Suggestie: overzicht-creeren is twee weken niet langsgekomen. Als je vandaag
toch aan de tokenlaag zit, kost het weinig extra om de afweging tussen de
twee opties even op te schrijven voor je begint.
```

Geen suggestie forceren. Past het niet bij het werk van vandaag, sla het over. Bewijs dat je erbij sleept om een vakje af te vinken is zwak bewijs.

### 3. Vraag wat hij gaat doen

Eén open vraag. Daarna schrijf je de lijst. Niet doorvragen op criteria, dat is werk voor de check-out.

### 4. Schrijf het bestand

Bestaat `logboek/daily/YYYY-MM-DD.md` nog niet, maak het aan met frontmatter en het check-in-blok. Bestaat het al, vul aan.

```markdown
---
date: 2026-09-17
vaardigheden: []
beroepstaken: []
doelen: []
jira: [PROJ-14, PROJ-17]
evidence: []
retroactief: false
---

# [Korte titel, mag bij de check-out nog veranderen]

## Check-in

### Wat ga ik doen vandaag?

- [ ] PROJ-14 tokenlaag afmaken, de resterende Bootstrap-utilities eruit
- [ ] PROJ-17 oppakken als PROJ-14 voor de lunch klaar is
- [ ] Afweging tokenlaag opschrijven voor ik begin

### Hulpvragen

- Hoe gaan we om met de inline utilities die in de markup zelf staan?
```

Vaardigheden en doelen laat je bij de check-in leeg of voorlopig. Ze worden pas echt ingevuld bij de check-out, want dan weet je wat er werkelijk gebeurd is. Het `jira:` veld vul je wel meteen, met de issues waar de dag op gericht is.

**Sprint, week en rol horen niet in deze frontmatter.** De viewer en de toezichthouder berekenen sprint- en weeknummer zelf uit `date` en `semesterstart`/`sprintlengte_weken` in `data/config.md`; rol staat daar ook al centraal. Zet ze dus niet per entry, dat is precies het soort veld dat na een paar weken stilzwijgend fout komt te staan.

Laat `### Hulpvragen` weg als er geen zijn. Een lege kop is ruis. De `## Check-in` kop zelf laat je altijd staan zodra er een check-in-blok is.

Draai daarna `./logboeker build`.

## Check-out

Doel: vastleggen wat er echt gebeurde, in een vorm die later als bewijs bruikbaar is.

### 1. Kijk eerst zelf

Draai de git-commando's en de Jira-query voor bewogen issues. Vergelijk met het check-in-blok van vandaag. Je zoekt drie dingen:

- **Wat is af maar staat niet op Done.** Dit is de meest voorkomende: er is gecommit, de student is verder gegaan, en het bordje klopt niet meer. Vraag of het klaar is of dat er nog iets mist. Vraag niet "waarom staat dit niet op Done" alsof het een verwijt is, vraag "PROJ-14 heeft vier commits vandaag maar staat nog op In Progress, is het af?"
- **Wat is gedaan maar stond niet in de check-in.** Werk dat er tussendoor kwam is vaak het interessantste bewijs, want het gaat over prioriteren, meebewegen of zelf iets oppakken.
- **Wat stond in de check-in maar zie je nergens terug.** Dat gaat naar Openstaand.

### 2. Vraag maximaal drie dingen door

Een ruwe dagomschrijving mist bijna altijd precies het detail dat een criterium assesseerbaar maakt. "Ik heb een wrapper gebouwd" is werk; "ik heb daarvoor eerst acceptatiecriteria opgesteld en twee alternatieven vergeleken" is bewijs. Het verschil zit in wat de student zelf niet noemt omdat het voor hem vanzelfsprekend is.

Goede doorvragen zijn specifiek en verwijzen naar iets uit de criteriatekst zonder die voor te lezen.

**Voorbeeld 1:**
Student zegt: "Ik heb vandaag een typed wrapper om de JS interop gebouwd."
Goed: "Had je vooraf acceptatiecriteria voor die wrapper, of ben je gaandeweg gaan bepalen wanneer hij af was?"
Slecht: "Welke vaardigheden denk je dat dit raakt?" Dat is jouw werk, niet het zijne.

**Voorbeeld 2:**
Student zegt: "Overlegd met de UI/UX'er over de panel z-indexen."
Goed: "Hebben jullie daar een afspraak uit gehaald, of blijft het ad hoc? En is dat ergens vastgelegd?"

**Voorbeeld 3:**
Git laat drie commits zien die niet in de check-in stonden.
Goed: "Ik zie dat je tussendoor de CI-config hebt gefixt, dat stond niet in je plan. Liep je erop vast of zag je het langskomen?"

Stel geen vragen waarvan het antwoord al in eerdere entries staat. Leverde de dag weinig op, dan is één vraag of geen vraag prima.

### 3. Schrijf de check-out-blokken

Vul het bestand aan. Het check-in-blok blijft staan zoals het was, ook als de dag anders liep. Dat verschil is zelf informatie.

```markdown
## Check-out

### Wat heb ik gedaan vandaag?

[Lopende tekst, 2 tot 5 zinnen, feitelijk, met spans op de passages die er later toe doen]

### Openstaand

- PROJ-17 niet aan toegekomen, tokenlaag kostte meer tijd dan gedacht
- Hulpvraag over inline utilities staat nog open, derde dag
```

De `## Check-out` kop staat er ook als er geen check-in was die dag (bijvoorbeeld bij inhalen). Een entry zonder expliciete `## Check-in`/`## Check-out` koppen is een oude-stijl entry; nieuwe entries krijgen ze altijd.

Werkte de dag iets op dat een bestaande Jira-issue raakt, zet die key in het `jira:` frontmatter-veld en noem hem in de tekst. Werkte de dag aan iets zonder issue, dat is prima, maar als het echt werk was hoort er een story te zijn: verwijs dan naar de stories skill.

**Openstaand is een lijst, geen paragraaf.** Neem items uit het check-in-blok die niet gelukt zijn letterlijk over, zodat je ze morgen herkent. Staat iets voor de derde dag of langer in Openstaand, noem dat er expliciet bij. Dat is een signaal dat de student vastloopt op iets wat hij zelf niet meer ziet, en het is vaak het begin van goed bewijs voor pro-actief handelen of flexibel opstellen, mits hij er iets mee doet.

Was de check-in er niet die dag (achteraf inhalen, of gewoon vergeten), schrijf dan alleen de check-out-blokken. Een check-in achteraf verzinnen heeft geen waarde.

### 4. Wees eerlijk in de tagging

Tag alleen wat de entry echt aantoont. Een dag waarop je code schreef zonder overleg is geen samenwerken-dag, ook al zat je in een team. Overtagging maakt de evaluator onbruikbaar, want dan levert elke query dertig entries op waarvan er drie relevant zijn.

Grensgeval? Tag het wel, maar noem in de tekst waarom het zwak is.

### 5. Draai het buildscript

`./logboeker build`. Geen aankondiging nodig, gewoon uitvoeren.

## Twee niveaus van labelen

Een entry draagt labels op twee plekken, en beide doen iets anders.

**Frontmatter** zegt waar de dag over ging. Grof, voor snel filteren.

**Inline spans** markeren de precieze passage die een criterium raakt:

```
[Ik heb vooraf acceptatiecriteria voor de wrapper opgesteld: elke bestaande
call moet erdoorheen en een niet-bestaande methode moet een compile-fout
geven.]{.plannen .kwalitatief-product-maken niveau=2}
```

Dit is Pandoc's bracketed-span syntax, dus het blijft geldige markdown. De viewer licht deze passages op wanneer je op die vaardigheid filtert, en de evaluator citeert ze als bewijs in plaats van de hele entry.

Spans zijn het belangrijkste onderdeel van de check-out. Een entry met alleen frontmatter-tags dwingt je later om zelf terug te zoeken welke zin nou eigenlijk het bewijs was; een gelabelde passage niet.

**Regels voor spans:**

- Alleen in het check-out-deel. Nooit in de check-in, daar is nog niks gebeurd.
- Label een hele zin of twee, niet een los woord. Een span moet op zichzelf leesbaar zijn, want de evaluator citeert hem los van zijn context.
- Meerdere vaardigheden in één span mag, als het echt dezelfde passage betreft.
- `niveau=N` alleen invullen als je met redelijke zekerheid kunt zeggen welk niveau die passage raakt. Bij twijfel weglaten; een verkeerd niveau is misleidender dan geen niveau.
- Spans mogen niet overlappen of genest zijn, dat kan de parser niet aan.
- Beroepstaken krijgen het prefix `bt-`, dus `[tekst]{.bt-software-realiseren}`.
- Niet alles hoeft gelabeld. Twee tot vier goede spans per dag is meer waard dan tien vage.

## Kandidaat-vaardigheden herkennen

Bepaal uit de dagomschrijving wat er geraakt kan zijn. Terugkerende patronen bij dit soort werk:

| Wat de student beschrijft                     | Waarschijnlijke match                          |
| --------------------------------------------- | ---------------------------------------------- |
| Iets gebouwd, gerefactord, getest             | Software Realiseren, Kwalitatief product maken |
| Alternatieven afgewogen, iets uitgezocht      | Overzicht creëren, Kritisch oordelen           |
| Nieuw framework of techniek geleerd           | Juiste kennis ontwikkelen                      |
| Overleg, review gegeven of gekregen           | Samenwerken, Boodschap delen, Reflecteren      |
| Planning gemaakt of aangepast                 | Plannen                                        |
| Meebewogen met een besluit dat hij niet wilde | Flexibel opstellen                             |
| Iets opgepakt dat niemand vroeg               | Pro-actief handelen                            |
| Architectuur bedacht, ADR geschreven          | Software Ontwerpen                             |

Een startpunt, geen regel. Ga altijd terug naar de echte criteriatekst.

## Slugs zijn vast

De viewer en evaluator filteren hierop:

`juiste-kennis-ontwikkelen`, `kwalitatief-product-maken`, `overzicht-creeren`, `kritisch-oordelen`, `samenwerken`, `boodschap-delen`, `plannen`, `flexibel-opstellen`, `pro-actief-handelen`, `reflecteren`

Voor beroepstaken in frontmatter zonder prefix (`software-realiseren`), in spans met prefix (`.bt-software-realiseren`).

**Een doel is een op te leveren product of traject, geen taaklabel.** `doelen:` groepeert entries rond iets dat je daadwerkelijk oplevert voor een beroepsrol-pakket: bijvoorbeeld een herziene projectstructuur, een advies, een concreet artefact. Niet elke dag verdient een nieuw doel, en niet elk onderwerp is een doel. De meeste dagen dragen helemaal geen doel, of hergebruiken een doel dat al een paar dagen loopt.

Toets voor je een nieuw doel aanmaakt: is dit iets wat je straks als geheel gaat evalueren voor een beroepsrol (analyse, ontwerp, advies, realisatie, beheer als losse stappen naar hetzelfde product)? Zo ja, is het een doel. Is het gewoon een onderwerp of een losse taak van die dag ("roadmap", "teamafstemming", "tokenlaag-uitrol"), dan is het geen doel en hoort het hoogstens in de titel of de body.

De naam van een doel beschrijft het **product**, nooit de beroepstaak of activiteit erin (dus niet `advies` of `analyse`, want dat zijn al de HBO-i-beroepstaken zelf). Bijvoorbeeld `projectstructuur` voor het traject codebase-analyse → ontwerp → structuuradvies → realisatie voor een frontend-beroepsrol-pakket: dat ene doel loopt dan over meerdere dagen en meerdere entries, tot het geëvalueerd is. Pas daarna begint een nieuw doel.

Twijfel je of iets bij een bestaand doel hoort of een nieuw doel wordt: vraag het, verzin niet. Kijk voor het schrijven welke doelen al bestaan en of de dag daar inhoudelijk bij aansluit, niet alleen qua timing.

De frontmatter hoeft niet alles te herhalen wat in spans staat: het buildscript voegt spanlabels automatisch samen met de frontmatter-tags. Zet in frontmatter dus alleen wat over de dag als geheel gaat.

## Losse bewijsstukken

Kwam er die dag een concreet product klaar dat als bewijsstuk kan dienen (onderzoek, ADR, reflectie, gespreksverslag, of een extern bestand), schrijf dat als apart bestand in `logboek/evidence/YYYY-MM-DD-slug.md` en verwijs ernaar in de `evidence:` frontmatter van de daily entry, met `@[Titel]` in de body.

Let op: reflecties moet je zelf schrijven, AI mag die niet formuleren of herschrijven. Bij een reflectie leg je dus alleen vast dat hij bestaat en waar hij over gaat, niet de inhoud.

## Externe bestanden als bijlage

**Een bestand hoort altijd bij een bewijsstuk, nooit rechtstreeks in een daily-log.** Het `bestanden:`-veld en `@{naam.ext}` horen thuis in `logboek/evidence/*.md`, niet in `logboek/daily/*.md`. Reden: een bewijsstuk is een vaste referentie die vanuit meerdere plekken aangewezen kan worden; een bestand dat aan één specifieke dag hangt, is dat niet. Kom je een product tegen dat een bestand is (PDF, PPTX, DOCX, LaTeX, een afbeelding), maak er dus eerst een evidence-entry voor, ook als er verder weinig te schrijven valt, en verwijs daarna vanuit de daily naar dat bewijsstuk met `@[Titel]`.

Is het product een bestand, zet het dan in `logboek/files/` en noem het in de frontmatter van het evidence-bestand:

```yaml
bestanden: [2026-09-12-sprintreview.pptx, 2026-09-12-notulen.pdf]
```

Gaat een specifieke zin over een specifiek bestand, verwijs er dan in de body van datzelfde evidence-bestand naar met `@{2026-09-12-sprintreview.pptx}`. In de viewer klapt het bestand open op de plek waar je erover schrijft.

Twee dingen om hier scherp op te zijn:

**Een bestand is nooit zelf bewijs.** Je kunt er geen span in zetten, dus de duiding staat altijd in de markdown eromheen. Een entry met alleen een bijlage en geen gelabelde tekst toont niets aan. Vraag dus door op wat het bestand laat zien en label dat in de body.

**Bestandsnaam met datum ervoor.** Net als bij entries: `YYYY-MM-DD-slug.ext`. Dat houdt `logboek/files/` sorteerbaar en voorkomt dat twee sprints allebei een `review.pptx` hebben.

Is het bestand met AI gemaakt, wijs dan op de verplichte disclosure: in welke mate AI is gebruikt volgens de mmmlabel.tech-indeling, met de prompts als bijlage. Dat is een harde regel uit de studiewijzer, geen suggestie.

## Inhalen van meerdere dagen

Alleen check-outs, geen check-ins. Behandel de dagen één voor één, oudste eerst, want de Openstaand-blokken bouwen op elkaar voort.

Leun zwaarder op git en Jira dan normaal: per dag `git log --since="<datum> 00:00" --until="<datum> 23:59"` geeft je het skelet van de dag terug. Hooguit één doorvraag per dag, want inhalen gaat om dekking, niet om diepte.

Zet `retroactief: true` in de frontmatter, zodat later duidelijk is welke entries mogelijk zijn afgezwakt door tijdsverloop.

## Toon

Schrijf de entry in het eigen register van de student: nuchter, direct, geen opsmuk. Geen em-dashes. Niet "vandaag heb ik met veel plezier gewerkt aan", gewoon wat er gebeurde. Het is een werkdocument, geen verhaal.
