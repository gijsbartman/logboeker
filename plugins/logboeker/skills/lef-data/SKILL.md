---
name: lef-data
description: Haalt actuele vaardigheden-, beroepstaken-, beroepsrollen- en beroepsproducten-criteria op van lef.hu.nl en schrijft ze naar data/, als markdown om te lezen en de vaardigheden ook als JSON voor de Logboeker-app. Gebruik deze skill altijd wanneer de student vraagt om data te verversen, vernieuwen of updaten, wanneer een andere skill (logboek, evaluator, toezichthouder, roadmap) een criterium nodig heeft dat niet in data/ staat of duidelijk verouderd is, of wanneer een specifieke vaardigheid, niveau, beroepstaak of gilde-vraag niet beantwoord kan worden uit de lokale bestanden. Ook gebruiken als een agent zelf detecteert dat data/ leeg is, ontbreekt, of geen recente .last-fetched timestamp heeft. Dit is de enige skill die met de LEF API praat; andere skills roepen deze aan in plaats van zelf te fetchen.
---

# LEF-data

Deze skill is de enige plek waar dit logboek met de LEF-website praat. Andere skills lezen `data/` en roepen deze skill pas aan als dat niet volstaat.

## Waarom dit een aparte skill is

LEF-criteria veranderen. De cumulatieve opbouw bij vaardigheden is bijvoorbeeld recent vervallen. Een lokale kopie raakt dan stil verouderd zonder dat iemand het merkt, tot een evaluatie op een criterium wordt afgekeurd dat allang niet meer geldt. Door één plek te hebben die verantwoordelijk is voor verversen, hoeft de rest nooit te gokken of de data nog klopt.

## Wat er in `data/` staat

| Bestand | Voor wie |
|---|---|
| `data/markdown/vaardigheden.md` | De skills: criteria per vaardigheid en niveau |
| `data/markdown/hboi.md` | De skills: beroepstaken (HBO-i) |
| `data/markdown/beroepsrollen.md` | De skills: beroepsrollen per gilde |
| `data/markdown/beroepsproducten.md` | De skills: voorbeeldproducten per beroepstaak en gilde |
| `data/json/vaardigheden.json` | De app: toont hiermee de criteria bij een gelabelde passage |
| `data/.last-fetched` | Tijdstip van de laatste volledige refresh, ISO 8601 in UTC |

De markdown is gemaakt om door een taalmodel gelezen te worden; lees die, niet de JSON. De JSON is er alleen voor de app en moet de vorm van `/api/v2/vaardigheden` houden.

## Wanneer zelf verversen, wanneer alleen signaleren

**Ververs meteen zonder te vragen** als:
- De student er expliciet om vraagt ("ververs de data", "is dit nog actueel")
- Een van de bestanden hierboven ontbreekt
- `data/.last-fetched` ontbreekt

**Vraag eerst kort of het moet** als:
- `data/.last-fetched` bestaat maar is ouder dan 30 dagen, en de taak waarvoor je het nodig hebt is niet urgent. Meld het gewoon: "De lokale LEF-data is van [datum], wil je dat ik die eerst ververs?" en ga anders door met wat er lokaal ligt.

**Ga altijd door zonder te blokkeren** als verversen mislukt (geen internet, endpoint down). Meld dat kort en val terug op wat er lokaal in `data/` staat, met een duidelijke waarschuwing dat het mogelijk verouderd is.

## Volledige refresh

Draai vanuit de root van het logboek. De basis-URL is `https://lef.hu.nl`, tenzij de env var `LEF_BASE_URL` iets anders zegt.

```bash
BASE="${LEF_BASE_URL:-https://lef.hu.nl}"
mkdir -p data/markdown data/json
for endpoint in vaardigheden hboi beroepsrollen beroepsproducten; do
  curl -fsSL "$BASE/llms/$endpoint" -o "data/markdown/$endpoint.md.tmp" \
    && mv "data/markdown/$endpoint.md.tmp" "data/markdown/$endpoint.md"
done
curl -fsSL "$BASE/api/v2/vaardigheden" -o data/json/vaardigheden.json.tmp \
  && mv data/json/vaardigheden.json.tmp data/json/vaardigheden.json
date -u +"%Y-%m-%dT%H:%M:%SZ" > data/.last-fetched
```

Schrijf via een `.tmp`-bestand, zodat een mislukte download het bestaande bestand niet leeg achterlaat. Zet `data/.last-fetched` alleen als alle vijf downloads gelukt zijn.

Controleer daarna de JSON: het is een object met als sleutels de tien vaardigheidsnamen ("Overzicht creëren", "Plannen", ...), elk met `description` en `level_description`. Wijkt dat af, zet dan de vorige versie terug als die er was en meld het (zie "Bij structurele veranderingen").

## Gericht ophalen

Wanneer een andere skill maar één ding nodig heeft, hoeft niet alles ververst te worden. Haal het gefilterd op naar stdout en lees het direct:

```bash
BASE="${LEF_BASE_URL:-https://lef.hu.nl}"

# Eén vaardigheid op één niveau
curl -fsSL "$BASE/llms/vaardigheden?vaardigheid=Plannen&niveau=2"

# Eén beroepstaak-laag, alle activiteiten
curl -fsSL "$BASE/llms/hboi?architectuurlaag=Software"

# Beroepsproducten voor een gilde binnen een laag
curl -fsSL "$BASE/llms/beroepsproducten?gilde=FE&architectuurlaag=Software"
```

Schrijf gefilterde resultaten nooit over de volledige bestanden in `data/markdown/`; dan lijkt de lokale data compleet terwijl hij dat niet is.

## Endpoints en filters

| Dataset | Endpoint | Filters |
|---|---|---|
| Vaardigheden | `/llms/vaardigheden` | `vaardigheid`, `niveau` |
| Beroepsrollen | `/llms/beroepsrollen` | `gilde` |
| Beroepstaken (HBO-i) | `/llms/hboi` | `architectuurlaag`, `activiteit`, `niveau` |
| Beroepsproducten | `/llms/beroepsproducten` | `architectuurlaag`, `activiteit`, `gilde` |

Filters die niet van toepassing zijn op een endpoint worden genegeerd. Meerdere filters worden met AND gecombineerd. Waarden met spaties of accenten URL-encoden (`vaardigheid=Overzicht%20cre%C3%ABren`).

Voor de JSON van de vaardigheden altijd `/api/v2/vaardigheden`, niet de gedeprecate `/api/v1/vaardigheden`: de app verwacht de v2-vorm.

De gilde-codes zijn: `AI`, `BE`, `BIT`, `CS`, `CI`, `FE`, `UI/UX`, `TI`, `GD`.

## Bij structurele veranderingen

Als een refresh data oplevert die inhoudelijk afwijkt van wat de andere skills verwachten (bijvoorbeeld een nieuw vaardigheidsniveau-format, een verdwenen of hernoemd principe, of een andere vorm van de JSON), meld dat expliciet aan de student in plaats van het stilzwijgend te verwerken. De andere skills en de app gaan uit van de huidige structuur; een format-wijziging kan betekenen dat die ook een update nodig hebben.
