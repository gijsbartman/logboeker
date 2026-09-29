---
name: setup
description: Stelt het logboek eenmalig in op de student, het semester, het project en de gebruikte tracker. Schrijft config.md in de root van het logboek, en legt het project vast in project.md, op basis van een projectdocument van de student of van een kort gesprek. Gebruik deze skill wanneer de student "setup", "configureren", "instellen", "opnieuw instellen" zegt, wanneer config.md of project.md ontbreekt of config.md lege verplichte velden heeft, of wanneer een andere skill een configgegeven nodig heeft dat er niet is. Ook gebruiken als de student van project, rol, semester of tracker wisselt. Niet gebruiken voor het dagelijkse logboek (logboek skill), de semester roadmap (roadmap skill), Jira-stories (stories skill) of het ophalen van LEF-criteria (lef-data skill).
---

# Setup

Deze skill vult `config.md` in de root van het logboek, het enige bestand waar persoonlijke gegevens in horen, en `project.md`, de beschrijving van het project waar de student dit semester aan werkt. Alle andere skills lezen die twee bestanden en blijven zelf generiek.

Draai hem één keer bij de start van een semester. Daarna alleen nog als er iets verandert: ander project, andere rol, ander semester, andere tracker, of een veld dat bij het eerste gesprek nog niet bekend was.

## Waarom config gescheiden staat van de skills

Een skill die een projectsleutel en een absoluut pad als `/Users/iemand/Projecten/Ding` in zijn tekst heeft staan is niet meer te delen en niet meer bij te werken. Werk je die skill bij, dan verdwijnen de ingevulde gegevens; deel je hem, dan draagt hij andermans paden mee.

Vandaar de splitsing. De skill beschrijft wat er moet gebeuren, de config zegt met welke gegevens. Schrijf dus nooit een projectsleutel of een pad terug in een `SKILL.md`, ook niet als dat op dat moment handiger lijkt.

## De velden van config.md

| Veld | Betekenis |
|---|---|
| `student_naam` | Hoe de skills de student aanspreken |
| `projectnaam` | Het project van dit semester. De app toont dit als naam van het logboek |
| `rol` | Rol in het team, bijvoorbeeld frontend of backend |
| `semester` | Welk semester van Open-ICT, 1 tot en met 8. Bepaalt welke niveaus de student moet halen |
| `semesterstart` | Eerste dag van het semester, `YYYY-MM-DD`. Hiermee rekenen de app en de skills week en sprint uit |
| `sprintlengte_weken` | Weken per sprint, standaard 2 |
| `semesterlengte_weken` | Weken in het semester, standaard 20 |
| `code_repo` | Absoluut pad naar de repo met de code. Leeg als er geen repo is |
| `tracker` | `jira`, `github`, `trello` of `geen` |
| `jira_site` | Hostname van de Atlassian-site |
| `jira_project_key` | De sleutel vóór het issuenummer, bijvoorbeeld `PROJ` bij `PROJ-14` |
| `jira_project_naam` | De weergavenaam van het project. Vaak anders dan de sleutel |
| `jira_account_id` | Atlassian account-id van de student, tussen aanhalingstekens |
| `jira_statussen` | De kolommen van het bord, in volgorde, als lijst |
| `ingesteld_op` | Datum van de laatste setup-run |

`semesterstart` en `semester` zijn de belangrijkste: zonder de eerste kan niemand weeknummers bepalen, zonder de tweede weet de roadmap skill niet welke niveaus nodig zijn.

## Werkwijze

### 1. Kijk wat er al is

Lees `config.md` en `project.md` in de root van het logboek.

- **`config.md` bestaat niet**: dit is een eerste run, loop alle velden langs.
- **`config.md` bestaat al**: vaak heeft de app hem aangemaakt bij het openen van een nieuw logboek, met naam, project, rol, semesterstart en sprintlengte. Noem wat er staat, vul aan wat mist, en laat de rest met rust. Overschrijf het bestand nooit in zijn geheel.
- **`project.md` ontbreekt of is dun**: doe stap 4.

Draait deze skill omdat een andere skill een ontbrekend veld nodig had, vraag dan alleen naar dat veld en wat er direct mee samenhangt. Een volledige setup-ronde is dan onnodig en irritant.

### 2. Vul in wat je zelf kunt vinden

Vraag niet naar wat je kunt opzoeken. Dat is het verschil tussen een setup die twee minuten kost en een die als een formulier voelt.

**De code-repo.** Zoek naar plausibele kandidaten voordat je het vraagt:

```bash
find ~/Documents ~/Projects ~/Developer ~/code -maxdepth 4 -name .git -type d 2>/dev/null \
  | sed 's|/.git$||' | head -20
```

Gebruik de projectnaam als zoekterm als die er al is. Vind je één duidelijke kandidaat, stel die voor ter bevestiging in plaats van hem stilzwijgend over te nemen.

**Jira.** Is de Atlassian MCP beschikbaar, haal dan alles op in plaats van te vragen:

- `getAccessibleAtlassianResources` geeft de site
- `getVisibleJiraProjects` geeft de projecten, met sleutel én weergavenaam
- `atlassianUserInfo` geeft het account-id van de student

Let op het verschil tussen sleutel en naam. Een project dat "Verduurzaming" heet kan issues hebben die `VERD-14` heten, of zelfs `SCRUM-14`. De sleutel is wat in de issuekey staat, en dat is wat de skills nodig hebben. Haal ze niet door elkaar, want een JQL met de verkeerde van de twee geeft geen fout maar nul resultaten.

Zijn er meerdere projecten zichtbaar, vraag welke het is. Is er één, stel die voor.

De statussen van het bord haal je uit een paar bestaande issues. Kijk naar wat er werkelijk voorkomt, niet naar wat gebruikelijk is: veel borden hebben een kolom als In Review die makkelijk over het hoofd wordt gezien en die later in de check-out ten onrechte als Done wordt gelezen.

**Semesterstart.** Is soms af te leiden uit de vroegste datum in `logboek/roadmap.md` of uit de oudste entry in `logboek/daily/`. Kun je hem niet vinden, vraag het.

**Semester.** Niet op te zoeken, altijd vragen. Het cijfer 1 tot en met 8, niet het studiejaar: een tweedejaars zit in semester 3 of 4.

### 3. Vraag de rest in één keer

Wat overblijft is meestal: naam, projectnaam, rol, semester, en bevestiging van wat je hebt gevonden. Stel dat als één compact blok, niet als een reeks losse vragen.

```
Gevonden:
- Repo: /Users/.../MijnProject
- Jira: mijnteam.atlassian.net, project "Verduurzaming", sleutel VERD
- Statussen: To Do, In Progress, In Review, Done

Nog nodig:
- Welk semester van Open-ICT zit je in (1 tot en met 8)?
- Je rol dit semester?
- Startdatum van het semester?
```

### 4. Leg het project vast in project.md

De andere skills hebben context nodig om goed door te vragen en om de roadmap te maken: wat voor opdracht dit is, voor wie, en wat de student er zelf in doet. Die context staat in `project.md` in de root van het logboek.

**Vraag eerst om een document.** Bijna elke opdracht heeft er een: een projectopdracht of -plan van de opdrachtgever, of het document dat uit de design sprint kwam. Vraag of de student zoiets heeft, en zo ja, om het te delen: sleep het bestand in de terminal of geef het pad.

**Heeft de student een bestand:**

1. Kopieer het naar `data/project/`, met de oorspronkelijke bestandsnaam. Dat is de bron; die pas je nooit aan.
2. Lees het. PDF en afbeeldingen kun je direct lezen. Een `.docx` of `.pptx` is een zip-bestand, dus haal de tekst eruit met `unzip -p <bestand> word/document.xml` of `unzip -p <bestand> 'ppt/slides/*.xml'` en strip de tags.
3. Schrijf `project.md` op basis van het document, in de structuur hieronder. Vul alleen in wat er staat.
4. Mist er daarna nog iets wezenlijks, zoals de eigen rol of de indirect betrokkenen, vraag dat gericht na en vul het aan.

**Heeft de student geen bestand**, vraag dan genoeg door om `project.md` zelf te schrijven. Niet alles in één keer: begin met de kern (opdrachtgever, probleem, wat er opgeleverd moet worden, de eigen rol) en vraag daarna door op wat nog vaag is. Twee of drie rondes is normaal. Stop als je elk kopje hieronder met iets concreets kunt vullen, of als de student het zelf nog niet weet; dat laatste zet je dan onder Open vragen.

```markdown
# [Projectnaam]

Bron: [data/project/<bestand> | gesprek met de student op YYYY-MM-DD]

## Opdrachtgever
[Organisatie en contactpersoon, en wat hun belang is]

## Aanleiding en probleem
[Waarom dit project er is]

## Doel en op te leveren resultaat
[Wat er aan het eind moet staan, en wanneer het geslaagd is]

## Scope
[Wat er wel en niet bij hoort]

## Team en rollen
[Wie er in het team zit en wie wat doet]

## Eigen rol en verantwoordelijkheden
[Wat de student zelf oppakt, en welke beroepsrol en welk gilde daarbij horen]

## Betrokkenen
[Direct betrokkenen, en indirect betrokkenen buiten de opleiding]

## Techniek en omgeving
[Stack, bestaande systemen, repo]

## Planning en fasen
[Wat er bekend is over mijlpalen en deadlines]

## Open vragen
[Wat nog niet duidelijk is]
```

Schrijf feitelijk en in de woorden van het document of van de student. Dit is een contextdocument voor de skills, geen bewijsstuk en geen reflectie, dus AI mag het opstellen. Laat een kopje weg als er echt niets over bekend is, in plaats van het te vullen met aannames.

Bestaat `project.md` al, werk hem dan bij in plaats van hem te vervangen, en laat de student zien wat er verandert.

### 5. Schrijf config.md

Schrijf de frontmatter volledig, ook de velden die leeg blijven. Een veld dat er niet staat is niet te onderscheiden van een veld dat nog niet bekend is, en dan gaat de volgende skill er alsnog naar raden.

Behoud de bestaande tekst onder de frontmatter en de volgorde van de velden die er al staan; de app leest en bewerkt dit bestand ook.

Gebruik je geen tracker, zet dan `tracker: geen` en laat de jira-velden leeg. De skills slaan hun trackerstappen dan over in plaats van te struikelen.

Zet onder een kopje "Notities" wat er nog open staat, zodat een volgende run ziet wat er mist.

### 6. Oudere entries

Rol, sprint en week staan niet per entry: rol staat in `config.md`, sprint en week volgen uit `date` plus `semesterstart` en `sprintlengte_weken`. Draagt een oudere entry ze toch nog, laat ze dan staan zoals ze waren: dat beschrijft wat er op dat moment gold, en terugschrijven zou de geschiedenis vervalsen. Voeg ze ook niet toe aan nieuwe entries.

### 7. Zeg wat er nu kan

Sluit af met de volgende stap, niet met een samenvatting van de config:

- Staat er nog geen `logboek/roadmap.md` met `doelniveaus`: de semester roadmap maken met de roadmap skill. Dat is bijna altijd de eerste stap na een setup, want de roadmap wordt in de eerste twee ontwikkelgesprekken besproken.
- Is het bord leeg: het bord bijwerken met de stories skill.
- Anders: de dag beginnen met de logboek skill.

## Wat je niet doet

**Geen gegevens in skills schrijven.** Ook niet "voor de zekerheid" of "als voorbeeld". Voorbeelden in skills gebruiken neutrale namen.

**Niets stilzwijgend overnemen.** Alles wat je zelf hebt gevonden leg je voor. Een verkeerd geraden projectsleutel levert later lege queries op zonder foutmelding, en dat is lastig terug te vinden.

**Niet ongevraagd opnieuw draaien.** Deze skill is er voor de eerste keer en voor wijzigingen. Draait hij vanzelf bij elke sessie, dan is dat een bug in de aanroep, niet iets om in mee te gaan.

**Geen bestaand werk weggooien.** Entries in `logboek/daily/` en `logboek/evidence/` en de roadmap blijven staan, ook bij een volledige herconfiguratie. Gaat het echt om een schone start, vraag daar expliciet naar en benoem wat er dan verdwijnt.

## Toon

Nederlands, nuchter, direct. Dit is een instelmoment, geen gesprek: zo min mogelijk vragen, zo snel mogelijk klaar. Alleen bij het project mag je doorvragen, want daar hangt de kwaliteit van alle volgende skills van af.
