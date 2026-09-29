---
name: lef-data
description: Haalt actuele vaardigheden-, beroepstaken-, beroepsrollen- en beroepsproducten-criteria op van lef.hu.nl en schrijft ze naar data/ als markdown. Gebruik deze skill altijd wanneer de student vraagt om data te verversen, vernieuwen of updaten, wanneer een andere skill (logboek, evaluator, toezichthouder) een criterium nodig heeft dat niet in data/ staat of duidelijk verouderd is, of wanneer een specifieke vaardigheid, niveau, beroepstaak of gilde-vraag niet beantwoord kan worden uit de lokale bestanden. Ook gebruiken als een agent zelf detecteert dat data/ leeg is, ontbreekt, of geen recente .last-fetched timestamp heeft. Dit is de enige skill die met de LEF API praat; andere skills roepen deze aan in plaats van zelf te fetchen.
---

# LEF-data

Deze skill is de enige plek waar dit project met de LEF-website praat. Andere skills lezen `data/` en roepen deze skill pas aan als dat niet volstaat.

## Waarom dit een aparte skill is

LEF-criteria veranderen. Het OF-principe bij beroepstaken is bijvoorbeeld recent verdwenen. Vendored JSON-bestanden in de repo raken dan stil verouderd zonder dat iemand het merkt, tot een evaluatie op een criterium wordt afgekeurd dat allang niet meer geldt. Door één plek te hebben die verantwoordelijk is voor verversen, hoeft de rest van het project nooit te gokken of de data nog klopt.

## Wanneer zelf verversen, wanneer alleen signaleren

**Ververs meteen zonder te vragen** als:
- De student er expliciet om vraagt ("ververs de data", "is dit nog actueel")
- Een van de vier bestanden in `data/` ontbreekt
- `data/.last-fetched` ontbreekt

**Vraag eerst kort of het moet** als:
- `data/.last-fetched` bestaat maar is ouder dan 30 dagen, en de taak waarvoor je het nodig hebt is niet urgent. Meld het gewoon: "De lokale LEF-data is van [datum], wil je dat ik die eerst ververs?" en ga anders door met wat er lokaal ligt.

**Ga altijd door zonder te blokkeren** als verversen mislukt (geen internet, endpoint down). Meld dat kort en val terug op wat er lokaal in `data/` staat, met een duidelijke waarschuwing dat het mogelijk verouderd is.

## Volledige refresh

Gebruikt voor de eerste keer opzetten, of wanneer de student expliciet alles wil verversen:

```bash
./logboeker refresh
```

Haalt alle vier datasets ongefilterd op en schrijft ze naar:
- `data/vaardigheden.md`
- `data/hboi.md` (beroepstaken)
- `data/beroepsrollen.md`
- `data/beroepsproducten.md`

Werkt de timestamp in `data/.last-fetched` bij.

## Gericht ophalen

Wanneer een andere skill maar één ding nodig heeft, hoeft niet alles ververst te worden. Gebruik `.logboeker/scripts/fetch-lef.sh` direct met het juiste endpoint en de juiste query, zie `data/llms-endpoints-reference.md` voor de volledige parameterlijst per endpoint.

```bash
# Eén vaardigheid op één niveau
./.logboeker/scripts/fetch-lef.sh vaardigheden "vaardigheid=Plannen&niveau=2"

# Eén beroepstaak-laag, alle activiteiten
./.logboeker/scripts/fetch-lef.sh hboi "architectuurlaag=Software"

# Beroepsproducten voor een gilde binnen een laag
./.logboeker/scripts/fetch-lef.sh beroepsproducten "gilde=FE&architectuurlaag=Software"
```

Zonder derde argument print het script naar stdout, wat vaak genoeg is als je het meteen wilt lezen in plaats van opslaan. Geef een derde argument mee om weg te schrijven naar een bestand in `data/`.

## Endpoints en filters

Vier datasets, elk met JSON (`/api/...`) en markdown (`/llms/...`). Gebruik altijd de markdown-vorm hier, die is gemaakt om door een taalmodel gelezen te worden.

| Dataset | Endpoint | Filters |
|---|---|---|
| Vaardigheden | `/llms/vaardigheden` | `vaardigheid`, `niveau` |
| Beroepsrollen | `/llms/beroepsrollen` | `gilde` |
| Beroepstaken (HBO-i) | `/llms/hboi` | `architectuurlaag`, `activiteit`, `niveau` |
| Beroepsproducten | `/llms/beroepsproducten` | `architectuurlaag`, `activiteit`, `gilde` |

Filters die niet van toepassing zijn op een endpoint worden genegeerd. Meerdere filters worden met AND gecombineerd. Gebruik `/api/v2/vaardigheden`, niet de gedeprecate `/api/v1/vaardigheden` — niet dat dit hier relevant is, want deze skill gebruikt uitsluitend de `/llms/` markdown-vorm, maar noem het niet per ongeluk verkeerd als je een JSON-variant aanraadt.

De gilde-codes zijn: `AI`, `BE`, `BIT`, `CS`, `CI`, `FE`, `UI/UX`, `TI`, `GD`.

Basis-URL is `https://lef.hu.nl`, override-baar met de env var `LEF_BASE_URL` voor forks van dit template die tegen een andere LEF-instantie praten.

## Bij structurele veranderingen

Als een refresh data oplevert die inhoudelijk afwijkt van wat de andere skills verwachten (bijvoorbeeld een nieuw vaardigheidsniveau-format, een verdwenen of hernoemd principe), meld dat expliciet aan de student in plaats van het stilzwijgend te verwerken. De andere skills gaan uit van de huidige structuur; een format-wijziging kan betekenen dat evaluator of toezichthouder ook een update nodig hebben.
