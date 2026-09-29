---
name: stories
description: Analyseert de git-historie en de werkmap van de code-repo en leidt daaruit af welk werk er is gedaan of loopt, om daar stories en subtaken van te maken op het bord van de student. Gebruik deze skill wanneer de student zegt "stories", "ik heb nog geen stories", "maak stories", "jira bijwerken", "bord bijwerken", "wat heb ik eigenlijk gedaan deze sprint", achterloopt met het bord, of werk wil terugvinden dat nooit op het bord is gezet. Ook gebruiken om lopende issues op de juiste status te zetten. Niet gebruiken voor het schrijven van logboekentries (logboek skill) of het beoordelen van bewijs (evaluator skill).
---

# Stories

Deze skill maakt het Jira-bord kloppend met wat er werkelijk gebeurd is. De aanleiding is bijna altijd dezelfde: er is gewerkt, er is gecommit, maar er staat niets op het bord. En omdat het bord de structuur is waar de student het loggen aan ophangt, blokkeert een leeg bord ook het logboek.

Een story die achteraf wordt aangemaakt is geen boekhouding. Het is de plek waar het werk zichtbaar wordt voor het team en voor de beoordeling, en het geeft de logboekentries iets om naar te verwijzen.

## Gegevens komen uit de config

Lees `data/config.md` voordat je iets doet. Daar staan de site, de projectsleutel, het pad naar de code-repo, de statussen van het bord en het account-id van de student. Ontbreekt het bestand of is een veld leeg dat je nodig hebt, gebruik dan de setup skill in plaats van te raden.

Hieronder staat `{veldnaam}` voor de waarde uit die config.

Twee dingen die vaak misgaan:

**Sleutel is niet hetzelfde als naam.** `{jira_project_key}` is wat vóór het issuenummer staat, `{jira_project_naam}` is de weergavenaam. Een JQL met de naam geeft geen foutmelding maar nul resultaten, en dan lijkt het alsof het bord leeg is.

**De code-repo staat niet in deze map.** Deze map is het logboek en meestal zelf geen git-repo. Draai git-commando's altijd tegen `{code_repo}`, met het volledige pad.

## Werkwijze

### 1. Kijk wat er al op het bord staat

Doe dit eerst, altijd. Een dubbele story is vervelender dan een ontbrekende, want het team ziet twee keer hetzelfde werk en niemand weet welke de echte is.

```
project = {jira_project_key} ORDER BY updated DESC
```

Let daarbij op drie dingen: welke issues al bestaan, welke op naam van de student staan, en welke epics of parent-stories er zijn waar nieuw werk onder hoort. Gebruikt het bord parent-relaties, dan hangt nieuw werk vaak beter onder een bestaande story dan ernaast.

Kijk hier ook welke issuetypes en welke titelstijl er in gebruik zijn, want daar sluit je in stap 3 en 5 op aan.

### 2. Lees de git-historie

```bash
cd {code_repo} && \
  git log --all --since="<sprintstart>" --stat --date=short \
    --pretty=format:'%h|%ad|%an|%s' && \
  git status --short && git diff --stat && git diff --cached --stat
```

Vier bronnen, elk met een eigen betekenis:

- **Commits** zijn afgerond werk. De commitboodschap zegt wat, de `--stat` zegt hoe groot.
- **Branches** (`git branch -a --sort=-committerdate`) verraden werk dat nog niet op main staat. Een branchnaam is vaak letterlijk de story die er had moeten zijn.
- **Staged changes** zijn werk dat nu af is maar nog niet gecommit.
- **Unstaged en untracked** zijn werk in uitvoering. Dit hoort bij een story op In Progress, niet bij een nieuwe story op Done.

Filter op de student zelf met `--author`, maar kijk ook naar het geheel: soms is het relevantste dat er ergens anders iets gebeurde waar zijn werk op wacht.

### 3. Groepeer naar stories, niet naar commits

Dit is het punt waarop het misgaat als je het mechanisch doet. Twaalf commits zijn geen twaalf stories. Een story is een samenhangend stuk werk met een resultaat dat iemand anders kan herkennen.

Groepeer op wat er inhoudelijk gebeurde:

| Wat je in git ziet | Waarschijnlijk |
|---|---|
| Vijf commits die allemaal hetzelfde bestand raken | Eén story |
| Eén commit die twintig bestanden raakt over twee onderwerpen | Twee stories |
| Een branch met een duidelijke naam | Eén story, naam is de titel |
| Losse fixes zonder verband | Een Taak, geen Story |
| Verwijderde of opgeschoonde code | Hoort vaak onder een bestaande opschoon-story |

**Story of Taak?** Een Story beschrijft iets dat waarde oplevert voor een gebruiker of het team en heeft een resultaat. Een Taak is werk dat gedaan moet worden zonder dat er een gebruiker iets van merkt. Bij twijfel: Story, want die telt beter mee in het bord en geeft meer om naar te verwijzen.

### 4. Leg het eerst voor, maak het daarna aan

Maak nooit issues aan zonder ze eerst te tonen. De git-historie liegt niet over wat er veranderd is, maar wel over wat de bedoeling was, en dat weet alleen de student.

Toon per voorgestelde story: titel, type, voorgestelde status, de commits waar hij op gebaseerd is, en waar hij onder hangt. Compact:

```
1. Story — "Folderstructuur opgeschoond, ongebruikte mappen verwijderd"
   Status: Done
   Basis: 8b347a9 (removed Scratch, removed Presets)
   Onder: PROJ-10

2. Story — "..."
```

Vraag daarna in één keer wat er moet gebeuren: welke kloppen, welke moeten samen, welke zijn onzin. Ga niet story voor story langs, dat duurt te lang en de student haakt af.

Twijfel je over de status, vraag het. Een story op Done zetten die niet af is, is vervelender om terug te draaien dan andersom.

### 5. Maak ze aan

Gebruik `createJiraIssue` met `projectKey: "{jira_project_key}"`. Voor subtaken: `parent` met de key van de parent-story.

Zet de student als assignee met `{jira_account_id}`. Alleen als het werk ook echt van hem is; werk van teamgenoten laat je met rust, ook als je het in git ziet.

Moet een issue na aanmaken op een andere status: `getTransitionsForJiraIssue` en dan `transitionJiraIssue`. Nieuwe issues komen op To Do binnen.

**Beschrijving: vast format, maar alleen voor stories.** Een Story krijgt altijd deze opbouw, ook onderzoeks- of evaluatiewerk zonder duidelijke eindgebruiker (gebruik dan een rol als "teamlid" of de eigen rol van de student):

```
Als {rol} wil ik {doel}, zodat {waarde}.

**Acceptatiecriteria**
- [ ] ...
- [ ] ...

**Kwaliteitscriteria**
- [ ] ...
```

De koppen "Acceptatiecriteria" en "Kwaliteitscriteria" altijd vetgedrukt (`**...**`), de criteria zelf altijd als Jira-taaklijst met `- [ ] `, niet als gewone bullets. Markdown-checkboxes worden in Jira automatisch een aanvinkbare taaklijst; gewone `- ` bullets niet. Gebruik daarom altijd `contentFormat: "markdown"` bij `createJiraIssue` en `editJiraIssue`, nooit ADF voor dit veld.

Een story zonder logisch AC/KC-onderscheid mag het bij Acceptatiecriteria alleen laten; verzin geen kwaliteitscriteria als er geen zijn.

**Subtaken krijgen meestal geen beschrijving.** De titel is de taak. Voeg alleen een beschrijving toe als de titel zelf niet duidelijk maakt wat er moet gebeuren of waaraan je ziet dat het af is, en houd die dan tot één of twee zinnen, zonder AC/KC-structuur. Een subtaak als "Techstack-keuzes beoordelen" heeft niets extra's nodig; "Opschonen" op zichzelf wel.

Kort en feitelijk verder, voor zover er een beschrijving komt. Wat er is gedaan of moet gebeuren, en waaraan je ziet dat het af is. Geen verhaal.

### 6. AI-disclosure is verplicht

Een door AI opgestelde story is een product, en producten vallen onder de disclosureplicht uit de studiewijzer. Dat is een harde regel, geen suggestie.

Zet onderaan elke beschrijving van een issue die via deze skill is aangemaakt:

```
---
Opgesteld met AI-assistentie (Claude) op basis van git-historie-analyse.
Inhoud gecontroleerd en geaccordeerd door de student.
```

Dat laatste is alleen waar als het waar is, dus zet het er pas op na stap 4. Is de beschrijving daarna door de student herschreven, pas de regel dan aan naar wat er feitelijk gebeurde.

Ontstaat er een grotere batch (een hele sprint inhalen), noem dan dat de mmmlabel.tech-indeling en de prompts als bijlage horen bij het uiteindelijke portfolio, en dat dit gesprek daar de bron voor is.

### 7. Sluit af richting het logboek

Nadat de stories staan: noem de keys en wijs erop dat de check-in ze nu vanzelf oppakt. Loopt het logboek ook achter, verwijs dan naar de logboek skill voor het inhalen, met de stories als kapstok.

## Wat je niet doet

**Geen issues aanmaken voor werk van anderen.** Je ziet in git alles van het hele team. Alleen wat van de student is gaat op zijn naam.

**Niets verzinnen.** Elke story moet terug te voeren zijn op een commit, een branch, een wijziging in de werkmap of iets dat de student zelf zegt. Een plausibele story zonder bron is een verzinsel en dat is bij een beoordeling een probleem, geen slordigheid.

**Geen issues sluiten die je niet begrijpt.** Staat er iets op het bord waarvan je niet ziet of het af is, vraag het dan.

**Niet stiekem vullen.** Alles wat je aanmaakt noem je bij key en titel, zodat de student weet wat er op zijn bord staat.

## Toon

Nederlands, nuchter, direct. Titels mogen kort en beschrijvend blijven ("Folderstructuur refactor"), ook als de beschrijving zelf wel het vaste As...wil ik...zodat-format volgt. De titel is een label, de beschrijving is waar de structuur zit.
