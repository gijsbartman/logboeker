---
name: setup
description: Stelt het logboek eenmalig in op de student, het project en de gebruikte tracker, en schrijft dat naar data/config.md zodat de andere skills generiek kunnen blijven. Gebruik deze skill wanneer de student "setup", "configureren", "instellen", "opnieuw instellen" zegt, wanneer data/config.md ontbreekt of lege verplichte velden heeft, of wanneer een andere skill een configgegeven nodig heeft dat er niet is. Ook gebruiken als de student van project, rol of tracker wisselt. Niet gebruiken voor het dagelijkse logboek (logboek skill), Jira-stories (stories skill) of het ophalen van LEF-criteria (lef-data skill).
---

# Setup

Deze skill vult `data/config.md`, het enige bestand in dit project waar persoonlijke gegevens in horen. Alle andere skills lezen dat bestand en blijven zelf generiek.

Draai hem één keer bij de start van een semester. Daarna alleen nog als er iets verandert: ander project, andere rol, andere tracker, of een veld dat bij het eerste gesprek nog niet bekend was.

## Waarom config gescheiden staat van de skills

Een skill die een projectsleutel en een absoluut pad als `/Users/iemand/Projecten/Ding` in zijn tekst heeft staan is niet meer te delen en niet meer bij te werken. Werk je die skill bij vanuit de repo, dan verdwijnen de ingevulde gegevens; deel je hem, dan draagt hij andermans paden mee.

Vandaar de splitsing. De skill beschrijft wat er moet gebeuren, de config zegt met welke gegevens. Schrijf dus nooit een projectsleutel of een pad terug in een `SKILL.md`, ook niet als dat op dat moment handiger lijkt.

## Werkwijze

### 1. Kijk wat er al is

Lees `data/config.md`. Bestaat het niet, dan is dit een eerste run: loop alle velden langs. Bestaat het wel, dan is dit een wijziging: noem wat er staat, vraag wat er anders moet, en laat de rest met rust.

Draait deze skill omdat een andere skill een ontbrekend veld nodig had, vraag dan alleen naar dat veld en wat er direct mee samenhangt. Een volledige setup-ronde is dan onnodig en irritant.

### 2. Vul in wat je zelf kunt vinden

Vraag niet naar wat je kunt opzoeken. Dat is het verschil tussen een setup die twee minuten kost en een die als een formulier voelt.

**De code-repo.** Zoek naar plausibele kandidaten voordat je het vraagt:

```bash
find ~/Documents ~/Projects ~/Developer ~/code -maxdepth 4 -name .git -type d 2>/dev/null \
  | sed 's|/.git$||' | head -20
```

Zit de projectnaam al in `CLAUDE.md` of in `data/`, gebruik die dan als zoekterm. Vind je één duidelijke kandidaat, stel die voor ter bevestiging in plaats van hem stilzwijgend over te nemen.

**Jira.** Is de Atlassian MCP beschikbaar, haal dan alles op in plaats van te vragen:

- `getAccessibleAtlassianResources` geeft de site
- `getVisibleJiraProjects` geeft de projecten, met sleutel én weergavenaam
- `atlassianUserInfo` geeft het account-id van de student

Let op het verschil tussen sleutel en naam. Een project dat "Verduurzaming" heet kan issues hebben die `VERD-14` heten, of zelfs `SCRUM-14`. De sleutel is wat in de issuekey staat, en dat is wat de skills nodig hebben. Haal ze niet door elkaar, want een JQL met de verkeerde van de twee geeft geen fout maar nul resultaten.

Zijn er meerdere projecten zichtbaar, vraag welke het is. Is er één, stel die voor.

De statussen van het bord haal je uit een paar bestaande issues. Kijk naar wat er werkelijk voorkomt, niet naar wat gebruikelijk is: veel borden hebben een kolom als In Review die makkelijk over het hoofd wordt gezien en die later in de check-out ten onrechte als Done wordt gelezen.

**Semesterstart.** Staat vaak al in `PLAN.md` of is af te leiden uit de oudste entry in `logboek/daily/`. Kun je hem niet vinden, vraag het, want de toezichthouder kan zonder die datum geen weeknummers bepalen.

### 3. Vraag de rest in één keer

Wat overblijft is meestal: naam, projectnaam, rol, en bevestiging van wat je hebt gevonden. Stel dat als één compact blok, niet als een reeks losse vragen.

```
Gevonden:
- Repo: /Users/.../MijnProject
- Jira: mijnteam.atlassian.net, project "Verduurzaming", sleutel VERD
- Statussen: To Do, In Progress, In Review, Done

Nog nodig:
- Je rol dit semester?
- Startdatum van het semester?
```

### 4. Schrijf config.md

Schrijf de frontmatter volledig, ook de velden die leeg blijven. Een veld dat er niet staat is niet te onderscheiden van een veld dat nog niet bekend is, en dan gaat de volgende skill er alsnog naar raden.

Gebruik geen tracker, zet dan `tracker: geen` en laat de jira-velden leeg. De skills slaan hun trackerstappen dan over in plaats van te struikelen.

Zet onder "Notities" wat er nog open staat, zodat een volgende run ziet wat er mist.

### 5. Controleer of de rest klopt

Twee dingen die na een wijziging makkelijk uit de pas gaan lopen:

**`CLAUDE.md`** noemt de projectnaam en rol in de kopregel. Verandert dat, werk het bij. De koppelingen zelf horen daar niet nog eens uitgeschreven te staan; verwijs naar `data/config.md`.

**Rol, sprint en week staan niet meer per entry.** Daily-entries dragen deze niet in hun frontmatter; ze worden afgeleid uit `data/config.md` (rol) en uit `date` plus `semesterstart`/`sprintlengte_weken` (sprint, week). Draagt een oudere entry ze toch nog, laat ze dan staan zoals ze waren: dat beschrijft wat er op dat moment gold, en terugschrijven zou de geschiedenis vervalsen. Verwijder ze niet actief uit oude entries, maar voeg ze ook niet toe aan nieuwe.

### 6. Zeg wat er nu kan

Sluit af met wat de volgende stap is, niet met een samenvatting van de config. Meestal: het bord bijwerken met de stories skill, of de dag beginnen met de logboek skill.

## Wat je niet doet

**Geen gegevens in skills schrijven.** Ook niet "voor de zekerheid" of "als voorbeeld". Voorbeelden in skills gebruiken neutrale namen.

**Niets stilzwijgend overnemen.** Alles wat je zelf hebt gevonden leg je voor. Een verkeerd geraden projectsleutel levert later lege queries op zonder foutmelding, en dat is lastig terug te vinden.

**Niet ongevraagd opnieuw draaien.** Deze skill is er voor de eerste keer en voor wijzigingen. Draait hij vanzelf bij elke sessie, dan is dat een bug in de aanroep, niet iets om in mee te gaan.

**Geen bestaand werk weggooien.** Entries in `logboek/daily/` en `logboek/evidence/` blijven staan, ook bij een volledige herconfiguratie. Gaat het echt om een schone start, vraag daar expliciet naar en benoem wat er dan verdwijnt.

## Toon

Nederlands, nuchter, direct. Dit is een instelmoment, geen gesprek: zo min mogelijk vragen, zo snel mogelijk klaar.
