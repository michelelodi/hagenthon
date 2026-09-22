---
name: discovery
description: >-
  Da usare quando servono idee candidate per l'hackathon dai temi/brief, oppure
  quando c'e gia del materiale-idea da valutare o rafforzare con la rubrica di
  discovery. Trigger (tutto il brief): "sono usciti i temi", "quali idee possiamo
  fare", "aiutami a scegliere l'idea". Trigger (una sola unita): "esplora solo il
  tema N"; "valuta / genera la card di questa idea che ho recuperato";
  "approfondisci / rivedi / fai varianti di un'idea gia generata". NON usarla per
  progettare il build dell'idea gia scelta (allora: brainstorming sull'idea).
model: opus
effort: max
---

# Discovery idee (dai temi dell'hackathon)

## Overview
Trasforma il brief dei temi in **una proposta forte per tema**, tramite un **orchestratore** (questa sessione) che **fa esplorare ogni tema in parallelo a un worker dedicato** (`discovery-theme-explorer`, pinnato Opus+max) e poi **riduce**: riconcilia le proposte, calibra i trade-off **con** l'utente, classifica. Ogni proposta nasce da un **funnel a due fasi**: prima l'**IDEA vincente** (persona + barriera + angolo del problema), poi la **SOLUZIONE** che chiude il **loop MVP e2e** (fino all'azione eseguita). Una proposta per tema, valutata con un punteggio confrontabile: l'utente sceglie **tra i temi**, non tra dieci varianti. Principio: ogni proposta vive o muore su **una persona concreta + una barriera precisa**, su **quanto il loop e2e è reale e si chiude fino all'azione eseguita** (setup→raccolta→analisi→proposta→conferma→esecuzione), e su **quanto ripensa il modello della soluzione** — non solo *cosa* risolve, ma *come* il servizio si relaziona alla persona nel tempo e *cosa fa* (fino a **eseguire**) concretamente per lei. Evita il paradigma derivativo "porti l'artefatto → te lo analizzo" (è ciò che fa già un comparatore). **Resta agnostica sulla forma tecnica del prodotto finito** (app, estensione, daemon…): quella si decide dopo.

**Il funnel (due fasi, due gruppi di KPI):**
1. **IDEA (concept)** — per ogni tema converge su **una** idea che massimizza i **KPI-concetto**: *Impatto persona · Originalità · Innovazione* (mira a 5/5/5). Genera più angoli internamente, tieni solo il vincente.
2. **SOLUZIONE (execution)** — per l'idea scelta progetta **la** soluzione che chiude il **loop MVP end-to-end** e massimizza i **KPI-esecuzione**: *Fattibilità MVP e2e · Wow demo · Profondità agentica* (l'agente **fa** qualcosa fino a **eseguire l'azione**, non solo analizza).

**Due piani per ogni proposta (in quest'ordine):** (1) l'**MVP e2e** deve *funzionare davvero* su **un flusso completo** — **setup/registrazione → raccolta dati → analisi → proposta azione → conferma (umana o agentica) → esecuzione (possibilmente automatica)** — con dati/integrazioni reali (rete/cloud **per i dati**, mai per l'inferenza; nessun vincolo 90s sul loop). (2) La **demo di 90s** è una *fetta fedele* dell'MVP, **estratta dopo**, che **mocka il necessario** per stare nei tempi, su dati locali/registrati, offline. Prima il loop reale, poi la fetta: la demo non è un finto flusso, è una fetta vera di qualcosa che gira davvero.

## Modalità (router) — scegli PRIMA di tutto
Un solo motore (il **funnel del worker**) esposto in **4 modalità**. Riconosci la modalità dagli **argomenti** espliciti o, in mancanza, dalla **richiesta**; nel dubbio chiedi con `AskUserQuestion`.

| Modo | Riconosci da | Cosa fai |
|---|---|---|
| **FULL** | c'è un brief/temi da processare **tutti** ("sono usciti i temi", "quali idee") | **Procedura — modo FULL** (mappa→riduci), sotto |
| **TEMA** | un **singolo** tema ("solo il tema N", `tema <n>`) | **Modi single-unit** → 1 worker, **niente reduce** |
| **IDEA-ESTERNA** | un'idea **portata da te** da valutare/cardare (`valuta: "<idea>"`) | **Modi single-unit** → 1 worker `formalize` |
| **APPROFONDISCI** | una **card esistente** da rivedere (`approfondisci <file> [--asse X \| --varianti N]`) | **Modi single-unit** → `deepen` (o inline per un asse) |

**Solo FULL fa il reduce** (riconciliazione cross-tema + classifica + indice). I modi single-unit lavorano su **una** unità e **saltano** riconciliazione/classifica. **Valgono per tutti i modi:** questa **Precondizione modello/effort**, i **GATE/KPI/funnel/template**, e il **Trade-off interattivo** (§Procedura 4).

## Precondizione — modello & effort
La discovery gira su **Opus 4.8 + effort max**. Il frontmatter di questa skill lo richiede, e i worker sono **pinnati via agent-def** (`.claude/agents/discovery-theme-explorer.md`: `model: opus`, `effort: max`) → il ragionamento pesante gira su Opus+max **anche se la sessione è ripartita su un altro default** (es. Sonnet per policy). Come orchestratore, **verifica dal tuo contesto** di essere su Opus; se non lo sei (o l'effort non è max), fermati e chiedi all'utente `/model opus` + `/effort max` prima di procedere.

## Architettura — orchestratore + worker (map-reduce)
- **Orchestratore = questa sessione interattiva.** Possiede **tutti** i dialoghi `AskUserQuestion`. Fa: parsing del brief → fan-out dei worker → **riconciliazione** → trade-off con l'utente → classifica → scrive l'**indice** → si ferma.
- **Worker = `discovery-theme-explorer`**, uno **per tema**, in **parallelo**. Ognuno esplora UN tema in **isolamento** (contesto pulito), **scrive il file** della proposta e **ritorna un header** (persona, archetipo-barriera, punteggio, flag). **Non** interpella l'utente: se emerge un trade-off, lo **flagga**.
- **REQUIRED SUB-SKILL:** usa **superpowers:dispatching-parallel-agents** per orchestrare il fan-out.
- **Registrazione worker:** l'agent-def `.claude/agents/discovery-theme-explorer.md` **può non essere disponibile subito** dopo creazione/modifica — l'harness lo carica dopo un breve **rescan** (o al riavvio). Se un dispatch dà *"agent type not found"*, **riprova a breve** o riavvia. Fallback: `general-purpose` con `model: opus` + il *Funnel del worker* passato inline — ma così **l'effort non è garantito max** (l'effort si pinna **solo** via agent-def; non c'è parametro effort sul dispatch).

## Quando usarla
- Trigger: il brief HTML dei temi è disponibile e bisogna generare/valutare idee.
- **Skill interattiva:** ai trade-off l'**orchestratore** usa `AskUserQuestion` per calibrare le proposte **con** l'utente. I **worker** non possono: eseguono il funnel e ritornano flag; l'interazione vive nel reduce.
- **Non** usarla per: **scegliere il tema/proposta vincente al posto dell'utente**, aggiornare la memory, pianificare il build. L'interazione *calibra i trade-off*, non fa la scelta finale. La skill si ferma a **una proposta valutata per tema** + indice. (Dopo la scelta → brainstorming sull'idea singola.)

## Cosa produce (contratto di output — non negoziabile)
**Questo contratto vale per il modo FULL.** (Modi single-unit: TEMA/IDEA-ESTERNA → **un** file idea, indice aggiornato **solo se già esiste**; APPROFONDISCI → card aggiornata in place, oppure `<card>-varianti.md`.)
Esattamente questi file, sotto `docs/discovery/`:
- `docs/discovery/discovery.md` — **indice**: classifica in tabella + top pick + puntatori. **Lo scrive l'orchestratore** (dagli header dei worker).
- `docs/discovery/<tema-slug>-<idea-slug>.md` — **un file per tema** (una sola proposta per tema; template sotto). **Lo scrive il worker** del tema.

Copri **tutti** i temi del brief — **qualunque sia il numero (2, 3, 5…)** — con **una proposta ciascuno** (mai più d'una per tema; mai saltare un tema). Punta a **≥27/30**: itera il funnel per arrivarci **onestamente**; se un tema non ce la fa, presenta comunque la sua migliore e **marcala ⚠ sotto-soglia** — **mai gonfiare i voti**.

## Procedura — modo FULL (orchestratore)
> Modo **FULL**: processa **tutti** i temi del brief. Per i modi single-unit → **§Modi single-unit** (una unità, niente riconciliazione/classifica).

1. **Estrai dal brief (adattivo — non assumere uno schema fisso).** Apri l'HTML. Conta i temi (**qualunque numero**). Per **ogni** tema estrai per **SIGNIFICATO**, adattandoti alle **etichette reali del brief** (che cambiano da un'edizione all'altra), questi ruoli informativi: **obiettivo/scopo**, **taglio/focus** (se c'è), **la sfida/challenge**, i **vincoli**, i **deliverable**, **cosa evitare**, gli **esempi-da-superare**. Mappa **per significato, non per nome esatto**; se un ruolo **manca**, procedi con ciò che c'è; se i temi sono **asimmetrici** (uno ha una sezione, un altro no), va bene lo stesso. Gli **"esempi"** sono **scartati a priori come sorgente d'idee — sia il concetto sia l'oggetto/scenario**: servono **solo** a calibrare il *pattern/livello* atteso e il concetto "ovvio" da superare. Resta nel **dominio** del tema, su uno scenario che gli esempi **non** hanno servito.
2. **Fan-out: un worker per tema (parallelo).** Lancia **in parallelo** un `discovery-theme-explorer` per **ciascun** tema. A ognuno passa: l'**estratto del tema** (punto 1) e — **al primo giro, nessun** vincolo di riconciliazione. *(In FULL il MODE è implicito = `generate`; le etichette MODE/INPUT/DIRECTIVE servono ai modi single-unit.)* La rubrica (GATE/KPI/persona/assi/template) **la legge il worker dalla skill**: non ripetergliela. Ogni worker **scrive il suo file** e ti ritorna l'**header** (file, nome, persona, **ARCHETIPO-BARRIERA**, modello-innovazione, **SUBSTRATO-DATI**, gate, punteggio/30, FLAG-TRADEOFF, perimetro-IT (intersezione) + scala EU/Mondo + fonte).
   - **Lente substrato dati (spinta proattiva — non un vincolo).** Al fan-out individua il/i tema/i che più naturalmente reggono un **substrato dati reale** e passa a **≥1 worker** (sul tema più adatto) una **lente soft**: *«esplora anche angoli il cui substrato dati è **hardware/sensori commerciali** o **API/portali PA · dataset pubblici-open**, se emerge un angolo forte — senza forzare»*. Alza il **base-rate** di proposte a integrazione dati reale (spec. **hardware**), che i worker isolati tendono a mancare (ripiegano su documento/software). **Resta soft:** se per quel tema nessun angolo a dati-reali batte l'alternativa, il worker sceglie il migliore — mai gonfiare.
3. **RICONCILIAZIONE (cross-tema) — check obbligatorio, ri-dispatch su conferma.** I worker sono **ciechi tra loro** e tendono a convergere. Confronta le proposte per **sostanza della barriera**, non per etichetta:
   - **Collisione vera = stessa barriera in sostanza**: stesso `ARCHETIPO-BARRIERA` **E** stesso meccanismo/esperienza vissuta. **Stesso tag ma meccanismo diverso NON è collisione** — es. due *cognitiva/apprendimento* dove una è *disfunzione esecutiva/sequenziamento* e l'altra *acquisizione di un'abilità di discriminazione*: **sostanzialmente diverse → tienile entrambe**. Giudica dal descrittore di sostanza nell'header (`ARCHETIPO-BARRIERA: <tag> — <meccanismo>`); se non basta, leggi la sezione *Modello & innovazione* del file.
   - **Monocultura di modello-soluzione (leggi `MODELLO-INNOVAZIONE`):** se **≥metà** delle proposte girano sulla **stessa famiglia di modello**, è un segnale — anche se le barriere differiscono, il set spinge un solo paradigma. Famiglie tipiche: *simulatore/rehearsal* ("provi al sicuro"), *rappresentazione/spiega* ("te lo mostro"), *carica→analizza*, *detect-and-act su dati reali* (agganciato a un flusso device/banca → rilevazione proattiva → azione). Vale **anche per un modello buono**: la varietà è di *paradigma*, non di qualità. (Osservato: il modello "prova/simulatore" ricompare run-dopo-run.)
   - **Monocultura di persona**, su due piani: (a) *demografica* (tutte donne, tutte 30enni, stesso mestiere); (b) **aggancio della barriera** — se **tutte/quasi** le persone sono agganciate a una **condizione oggettiva o a una paura** (una diagnosi — ADHD, discalculia, ipovisione — o "paura di X"), il set ha **perso le barriere situazionali** (ruolo/contesto/compito): spesso gli agganci situazionali (mestiere, tipo di contratto) restano **solo colore anagrafico** e non generano la barriera. Passano lo swap-test, ma sono il pozzo di default dei worker isolati → **segnalalo** (è un segnale, non un obbligo; non penalizzare il punteggio).
   - **Copertura del substrato dati (leggi `SUBSTRATO-DATI`).** Guarda **da cosa** ogni proposta trae i dati. **(a) Floor hardware:** se **nessuna** proposta ha un substrato **hardware/sensori**, è il caso che l'utente vuole rompere → **offri** (con motivazione + costo) un ri-dispatch verso un **substrato hardware reale** (palette hardware) sul **tema che meglio regge un angolo hardware onesto e competitivo** (giudizio: di norma **non** il tuo top pick — non sacrificarlo — né un tema dove l'hardware non calza, che darebbe solo un ⚠ sotto-soglia). Nota: su un brief di temi *software/servizio* l'hardware può essere onestamente **battuto sul merito** — allora il floor è una **scelta** (barattare qualità per avere hardware nel set), non un difetto. **(b) Monocultura di substrato:** se **≥metà** delle proposte girano sullo **stesso** substrato (tipico: tutte *documento/evento software* — email/PDF/pagine-portale), segnalalo come le altre monoculture. Regola generale (sotto): **segnala + chiedi conferma, non automatico**, default *tieni così*, **cap 1 giro**. Il floor hardware è un segnale **forte** (l'utente vuole **≥1** proposta a integrazione dati hardware) ma **mai forzare** hardware dove non regge: meglio un ⚠ onesto che un voto gonfiato.
   - **Il ri-dispatch costa un funnel intero (minuti): NON è automatico.** Se resta una collisione **sostanziale** (o una monocultura netta) che vale la pena rompere, **fermati e chiedi** con `AskUserQuestion`, **motivando** (quale collisione, perché indebolisce il set) e dichiarando il **costo**. Offri almeno:
     - **Tieni così** — il set va già bene / le differenze bastano → **niente ri-dispatch**, vai alla classifica. *(Se una proposta ti convince già, è inutile proseguire.)*
     - **Ri-lancia il tema più debole** (spareggio Fattibilità→Impatto per sceglierlo) su un **asse distinto** — di *barriera*, di *modello-soluzione*, o verso una barriera **situazionale** (ruolo/contesto/compito) se la monocultura è di aggancio-persona → paghi il costo per più varietà.
   - **Se ri-lanci ≥2 temi, assegna a ciascuno un asse DIVERSO e specifico** (o ri-lancia in **serie** con lista cumulativa): worker paralleli a cui dici solo *"non X"* **ri-collidono sul successivo** (osservato: esclusa "transizione", due ri-lanci sono ricascati entrambi su "emotiva").
   - **Cap: 1 solo giro** di ri-dispatch; residui → nota di processo.
4. **Trade-off interattivo (inline).** Per i worker con **FLAG-TRADEOFF** — **freno singolo** (≥4 su tutti i KPI tranne uno ≤2, spesso Fattibilità) **oppure Gate a rischio** (tipico Gate 8) — **fermati e chiedi** con `AskUserQuestion`: spiega il trade-off e offri quattro scelte:
   - **Assunzione forte esplicita** → alza il KPI/sblocca il gate con un'ipotesi dichiarata: registrala.
   - **Cambia idea/soluzione** → ri-lancia quel worker sulla fase giusta del funnel.
   - **Ridimensiona a UN flusso e2e** → restringi l'**MVP** a un solo flusso completo (setup→esecuzione) costruibile nel timebox, senza rinunciare a chiudere il loop: registrala. *(La fetta-demo di 90s si ricava dopo da questo flusso.)*
   - **Tieni com'è** → resta col voto onesto (⚠ sotto-soglia se <27).
   Dopo la scelta, se serve ri-valutare, **ri-lancia** quel worker con l'assunzione/fetta decisa. Cap **~1 dialogo per tema** (3-4 per giro): interpella prima i temi a più alto potenziale.
5. **Classifica & indice.** Ordina per totale decrescente; **a parità, spareggia su Fattibilità (MVP e2e), poi Impatto**. Marca **⚠** le sotto-soglia. Scrivi l'**indice** `docs/discovery/discovery.md` (template sotto) **dagli header dei worker** — non ri-leggere i file.
6. **Fermati.** La **scelta del tema/proposta**, la memory e il build li fa l'utente.

## Modi single-unit (TEMA · IDEA-ESTERNA · APPROFONDISCI)
Una sola unità di lavoro, **niente reduce**. Passi comuni:
1. **Precondizione** Opus+max (come FULL).
2. **Prepara l'INPUT** del modo (sotto).
3. **Dispatcha 1 worker** `discovery-theme-explorer` col contratto esteso **MODE / INPUT / DIRECTIVE** (vedi *Ingressi del funnel per MODE*). *(Eccezione ibrida:* `APPROFONDISCI --asse X` *lo esegui **inline**, non col worker — sotto.)*
4. **Al ritorno**, se c'è **FLAG-TRADEOFF** applica §Procedura 4 (interattivo).
5. **Indice:** se `docs/discovery/discovery.md` **esiste già**, aggiornane la riga; se non esiste, **non** crearlo (è un artefatto di FULL).

- **TEMA** — INPUT = l'estratto di **quel** tema (estrai per significato come §Procedura 1, ma per uno solo). `MODE=generate`. Se hai archetipi/idee già presi da un FULL precedente, passali: il worker sceglie un asse diverso. → **1 file idea**.
- **IDEA-ESTERNA** — INPUT = l'**idea che porti tu** (persona/barriera/soluzione, anche abbozzata) + tema di riferimento **se c'è** (senza tema: GATE 6 si limita ai confini generali del `CLAUDE.md` — vedi *Ingressi/formalize*). `MODE=formalize`: il worker **non genera angoli da zero**, prende la tua idea come *l'*idea e la porta nel funnel (community, Gate 8, KPI). **Valutazione onesta**: può fallire un gate o restare <27 → lo dichiara (**mai gonfiare**). Il "repair" verso una versione che passa **solo se lo chiedi** → `DIRECTIVE=repair`. → **1 file idea**.
- **APPROFONDISCI** — INPUT = la **card esistente** (path). `DIRECTIVE`:
  - **`push-score`** (default) → **worker** `MODE=deepen`: ri-gira il funnel sulla stessa proposta per alzare i KPI/gate deboli verso ≥27; resta **una** proposta; aggiorna il file **in place**.
  - **`axis:<nome>`** → **INLINE** (questa sessione): riscrivi **solo** la sezione di quell'asse (substrato dati · community · fetta demo · profondità agentica) applicando le **stesse** definizioni del funnel/rubrica; puoi aggiornare **la cella-KPI direttamente legata a quell'asse** (es. community→Impatto) con mezza riga di motivazione, **senza** ri-derivare gli altri KPI né il totale. **Escalation al worker** (`MODE=deepen`) **solo** quando serve **ri-eseguire il funnel**: (a) l'utente vuole un **re-score olistico** (più KPI / il totale), oppure (b) l'asse impone di **rifare il funnel end-to-end** (recon + Gate 8 + sizing + re-derivazione insieme), non il solo asse. Confine = *«serve l'intero funnel?»*, **non** *«un numero si muove?»* (deepenare un asse muove quasi sempre il suo KPI — è previsto, resta inline).
  - **`variants:<n>`** → **worker** `MODE=deepen`: genera 2-3 angoli/soluzioni alternativi dalla stessa idea e scrivili in **`<card>-varianti.md`** (mini-tabella di confronto), **lasciando l'originale intatto**.

## Funnel del worker (per il singolo tema) — lo esegue `discovery-theme-explorer`
1. **FASE IDEA — una idea vincente.** Genera **internamente** più angoli (persona + barriera + dominio fresco + modello innovativo), poi **tieni solo quello** che massimizza i **KPI-concetto** (Impatto, Originalità, Innovazione; mira 5/5/5) e passa i **GATE**. La persona si costruisce **senza stereotipi** (vedi *Costruire la persona*) e appartiene a una **community reale**. Ancorala a **1 persona + 1 barriera reale**, coerente coi **Vincoli**, fuori da **"Cosa evitare"** e dagli **oggetti-esempio** del brief. Gli altri angoli si scartano: **non** finiscono nell'output. Se l'orchestratore ha passato **archetipi già presi**, scegli un **asse di barriera diverso**. **Recon del substrato dati (in esplorazione, non a Gate 8):** mentre cerchi l'angolo, fai una **recon online** (WebSearch/WebFetch) di *quali dati reali* reggerebbero l'idea sulle **tre famiglie** — **hardware/sensori commerciali** (palette hw) · **API/portali PA e dati pubblici-open** (palette dati pubblici) · **dataset opensource/community** — e **lascia che ciò che le fonti espongono davvero** orienti quale angolo vince sull'**asse accostamento dati↔problema** (spesso un substrato reale non ovvio = più originale *e* più fattibile). **Persona-first:** è recon *al servizio* dell'angolo, **non 'dati in cerca di problema'**; se nessun substrato a dati-reali batte l'alternativa, scegli il migliore e dichiaralo.
2. **FASE SOLUZIONE — la soluzione che chiude il loop MVP e2e.** Esplora internamente più soluzioni e **tieni quella** che chiude **davvero** il **loop end-to-end su un flusso** e massimizza i **KPI-esecuzione** (Fattibilità MVP e2e, Wow demo, Profondità agentica). Il loop, esplicito, è il *recipe* — la soluzione vincente copre **tutti** gli stadi:
   1. **Setup/attivazione (una tantum)** — la persona attiva il servizio una volta (registrazione / collegamento della fonte dati); poi lavora da sé (asse *attrito d'ingaggio*).
   2. **Raccolta dati** — il servizio acquisisce i dati reali dal **substrato** (non li fornisce l'utente ogni volta): scegli il substrato **su cosa le fonti espongono davvero** (recon Fase IDEA) — **hardware/sensori commerciali** · **API/portali PA · dataset pubblici-open** · **opensource/community** — **non ripiegare di default su 'documento/evento software'** (carica PDF → spiega) se un substrato reale regge meglio l'**azione**.
   3. **Analisi (LLM a runtime, offline via CLI `claude`)** — l'operazione strutturata: estrae/classifica/valuta/rileva il blocco; senza LLM il prodotto non esiste.
   4. **Proposta azione** — dall'analisi il servizio propone **l'azione concreta** (non un report).
   5. **Conferma (umana o agentica)** — un passo di conferma **human-in-the-loop** oppure **delegato all'agente**, entro i confini (Gate 5: niente consulenza personalizzata).
   6. **Esecuzione (possibilmente automatica)** — il servizio **esegue** l'azione: produce l'artefatto, opera sul device/sistema, porta a termine il passo. **Profondità agentica** = il loop arriva **fin qui**, non si ferma a proposta/analisi.
   Output: **solo la soluzione vincente** (il loop chiuso su un flusso).
3. **FASE COMMUNITY (perimetro reale = intersezione di community).** La community "anagrafica" della persona **sovrastima** il bacino. Quindi: (a) **inferisci 2-4 community di appartenenza su assi DIVERSI** — *demografico* · *bisogno/condizione* · **adozione tecnologica o comportamentale** (chi *possiede davvero* il device / *usa davvero* quel servizio oggi) · *contesto geo/normativo*; (b) **stima l'INTERSEZIONE** (chi sta in *tutte* le facet rilevanti): il perimetro reale è dominato dal **vincolo più stringente** — spesso l'adozione tech/comportamentale, non la demografia; (c) **esprimi l'ordine di grandezza con la catena di stima esplicita** (pop. base × tasso di adozione × …) e **fonte citata verificata online** (ISTAT/Eurostat/registri/report di settore). **Geografia a livelli:** **Italia** sempre; **se il prodotto può scalare oltre confine**, aggiungi **Europa** e **Mondo** con lo stesso metodo (fonti Eurostat/OCSE/UN o report globali); se è per natura legato all'Italia (es. un servizio della PA italiana), **fermati a Italia**. Conta l'**intersezione**, non la community più larga: è ciò che regge l'*Impatto* onesto ed evita di gonfiare il bacino.
4. **VERIFICA DI REALTÀ (Gate 8) — consolida la recon.** Se la realizzabilità dipende da hardware o da una **fonte dati esterna** (device · **API/portale PA** · dataset pubblico-open · opensource), **consolida la recon della Fase IDEA**: verifica **online** che la fonte **esista** ed **esponga davvero** i dati previsti (endpoint/formato/**licenza**/aggiornamento; per l'hw: device + dato **gratuito/open** + doc), attento a portali che sono *sole pagine* o cataloghi *annunciati ma non operativi*, e **cita la fonte**; se non regge → Gate 8 fallito. La recon **non è solo verifica finale**: ha già **informato** l'angolo e la soluzione (Fase IDEA).
5. **VALUTA.** Gate-check (pass/fail) + **6 KPI (1-5)** → **/30**, ogni voto con **mezza riga**. Itera onestamente verso **≥27**; se non ci arriva, **⚠ sotto-soglia** col voto onesto. Poi **scrivi il file** (template) e **ritorna l'header** di contratto.

### Ingressi del funnel per MODE (single-unit)
Il `MODE` passato dall'orchestratore cambia **solo l'ingresso della FASE IDEA**; **FASE SOLUZIONE / COMMUNITY / Gate 8 / VALUTA e template sono identici** in tutti i modi. Se `MODE` non è indicato → **`generate`** (comportamento storico, quello di FULL).
- **`generate`** (default; è anche il modo di FULL) — genera più angoli internamente e tieni il vincente, come sopra.
- **`formalize`** — **non** generare angoli: prendi l'`INPUT` (idea portata dall'utente) come *l'*idea. Se **non** regge un GATE, **dillo e non forzare** (⚠/FAIL onesto). **Senza tema di riferimento:** applica solo i **confini generali** del `CLAUDE.md` (perimetro/confini non negoziabili); le clausole **tema-specifiche** del GATE 6 (Vincoli · Cosa evitare · Esempi del brief corrente) sono **N/A** finché non indichi un tema (se lo indichi → GATE 6 pieno). Con `DIRECTIVE=repair`: proponi la **minima** modifica che sblocca il gate fallito, dichiarandola.
- **`deepen`** — **leggi la card** in `INPUT`, poi applica la `DIRECTIVE`: `push-score` (ri-gira il funnel per alzare i KPI deboli; **una** proposta; aggiorna in place) · `variants:<n>` (2-3 alternative → scrivile in `<card>-varianti.md`, **originale intatto**). *(`axis:<n>` di norma lo fa l'orchestratore inline; se ti arriva, approfondisci solo quell'asse.)*

## Assi d'innovazione (palette d'ispirazione — non checklist)
Ripensa il **modello concettuale**, non solo il contenuto. Un'idea spinge sugli assi che le servono (anche uno solo); non deve coprirli tutti. Tutto **agnostico dalla forma tecnica**. (Gli assi ricalcano gli stadi del **loop e2e**: *attrito*=setup, *acquisizione*=raccolta dati, *iniziativa*=proattività, *finalità*=esecuzione.)
1. **Attrito d'ingaggio** — da "porti l'artefatto ogni volta" → "si attiva una volta, poi lavora da sé".
2. **Temporalità** — da "one-shot" → "continuo: accompagna nel tempo".
3. **Acquisizione dati** — da "i dati li fornisci tu" → "il servizio rileva da sé i dati utili".
4. **Iniziativa** — da "reattivo: risponde quando lo apri" → "proattivo ma non invasivo: si fa vivo lui quando serve".
5. **Finalità** — da "spiega/calcola e si ferma" → "porta verso un obiettivo con azioni concrete" (dentro i confini: mai consulenza personalizzata).

## Palette hardware (ispirazione — opzionale, non checklist)
Il **substrato dati** di un'idea può essere **hardware commerciale esistente**, non solo un documento o un evento software: indossabili e wearable salute, smart home/domotica, prese e lampadine smart, sensori diffusi (aria/meteo/rumore), tracker, auto connesse, hub vocali… *non limitarti a questi*. È spesso l'hardware a rendere l'**Acquisizione dati** *reale e continua* — così la **raccolta dati** del loop è reale (non finta) e il concetto proattivo alza il Wow **restando** innovativo. Vincolo → **Gate 8**.

## Palette dati pubblici & open (ispirazione — opzionale, non checklist)
Oltre all'hardware, un substrato dati reale può venire da **fonti pubbliche/aperte** che espongono dati *davvero*: **portali open-data** (dati.gov.it, open-data regionali/comunali, geoportali), **statistica ufficiale** (ISTAT — anche SDMX —, Eurostat), **ecosistema servizi pubblici** dove documentato (IO/PagoPA — es. formato avviso/IUV —, ANPR, INPS, Agenzia delle Entrate, FSE), **dataset di dominio** (ARPA/qualità aria, ISPRA, GTFS trasporti), **algoritmi/registri normativi** (checksum IBAN, algoritmo del codice fiscale, tabelle Belfiore/CAP), **dataset opensource/di community** (PhysioNet, Kaggle, GitHub). *Non limitarti a questi.* **Regola d'oro (Gate 8): non assumere — verifica online cosa la fonte espone DAVVERO** — API/dataset queryable vs sola pagina-servizio, formato, **licenza**, aggiornamento — e **cita il puntatore doc**; molti portali PA sono *pagine da leggere*, non *dati queryable*, e alcuni cataloghi sono **annunciati ma non operativi**. **Italia-first** (coerente col perimetro-IT); estendi a EU/open globali solo se il prodotto scala. Come per l'hardware, è spesso ciò che rende la **raccolta dati** del loop reale/continua (e, se documentata e queryable, costruibile nel timebox) e alza il Wow **restando** innovativo.

## Costruire la persona (reale, non caricatura)
La barriera **nasce dalla situazione** (il compito, un servizio mal progettato, un evento di vita, un ruolo nuovo), **non da un tratto protetto** della persona (etnia, genere, età, disabilità usati come *causa-carattere*).
- **Swap-test:** se cambi etnia/genere/età della persona, la barriera **regge ancora**? Se "funziona" solo grazie allo stereotipo → è una persona-caricatura, riprogetta. (Cliché tipici da evitare: *l'immigrato che non parla italiano*, *l'anziana vedova che "non l'ha mai fatto"*, *la donna sola incapace*.)
- **Anziani, stranieri, persone con disabilità sono community reali e legittime:** il punto **non** è evitarle, ma **non dedurre la barriera dal tratto** (swap-test) e **non ripetere lo stesso archetipo** su tutti i temi.
- **Varia l'ARCHETIPO di barriera tra i temi**, non solo età/genere: assi possibili = *sensoriale · cognitiva/apprendimento · linguistica · vincolo-di-contesto (tempo/luogo/device) · emotiva (paura/ansia/vergogna) · transizione/ruolo-nuovo · fisica/motoria*. **Attenzione:** esplorando i temi in isolamento si tende **tutti** a "transizione/ruolo-nuovo" (è l'archetipo swap-test più comodo) → è il caso che la **riconciliazione** dell'orchestratore rompe. **Secondo pozzo di default:** evitando le caricature demografiche si scivola sulla **persona-con-condizione-oggettiva** (una diagnosi — ADHD, discalculia, ipovisione — o una *paura* dell'irreversibile). È **legittima** e passa lo swap-test, ma se tutti i temi vi cadono il set diventa monocorde ("risolvi un deficit interno", mai "un attrito del ruolo/contesto") → la **riconciliazione** lo segnala (non lo vieta).
- **Ancoraggio alla community:** la persona rappresenta una community reale e *sizable*, misurata come **perimetro per intersezione** — non la community più larga, ma l'incrocio col **vincolo più stringente** (spesso l'adozione tech/comportamentale) (Fase Community). Questo alza l'*Impatto* onesto e tiene lontane le macchiette.

Esempi (asse di barriera tra parentesi — **variali tra i temi**). ❌ *"Youssef, immigrato, non parla bene l'italiano"* (barriera = etnia). ❌ *"Anna, 78, vedova, non ha mai usato un PC"* (barriera = età). ✅ *"Marco, 34, primo impiego dopo anni da autonomo: usa la PEC per la prima volta"* (transizione). ✅ *"Sara, 45, neo-caregiver del padre"* (ruolo/evento). ✅ *"Renato, 53, ipovisione sopraggiunta: rilegge le bollette con lo screen reader"* (sensoriale). ✅ *"Luca, 29, dislessia: deve superare un test a tempo per una certificazione"* (cognitiva). ✅ *"Paola, 41, turnista di notte: può usare un servizio solo da telefono, in 5 minuti, a fine turno"* (vincolo-di-contesto).

## GATE (pass/fail — se ne fallisce anche uno, la proposta non si presenta)
1. Il valore passa da un **LLM a runtime nel prodotto** (non solo "costruito con gli agenti").
2. LLM invocato **solo via CLI `claude` locale, offline** — niente API key, servizi esterni o rete **per l'inferenza**. La rete/cloud sono ammessi **per i dati del prodotto reale** (non per l'inferenza); la **demo di 90s** gira **offline su dati locali/registrati**.
3. **1 persona concreta + 1 barriera precisa**, con la **barriera che nasce dalla situazione, non da un tratto protetto** (passa lo *swap-test*). Mai "utente generico"/"un anziano" né persona-caricatura.
4. **Capability concreta che chiude il loop**: il prodotto *fa/esegue* qualcosa fino a **eseguire l'azione** (calcola, valida, estrae, genera, rileva, **e porta a termine il passo**: proposta → conferma umana o agentica → esecuzione, possibilmente automatica), non solo parla/riscrive/analizza.
5. **Semplifica senza tradire**: non altera il significato; niente consulenza professionale personalizzata (finanziaria, medica, legale). Le **azioni proattive verso un obiettivo** (asse *Finalità*) sono ammesse solo dentro questo confine.
6. Rispetta i **Vincoli specifici** del tema **e** non ricade in **"Cosa evitare"**, **e non è la re-implementazione di un "Esempio di soluzione" del brief corrente** (né concetto né oggetto/scenario): resta nel dominio del tema su uno scenario fresco.
7. Dall'MVP e2e è **estraibile** una **fetta fedele** mostrabile in una **demo live di ~90s** (prima → dopo, su dati locali/offline, **mockando il necessario** per stare nei tempi). La demo si costruisce **dopo**: qui basta che la fetta sia estraibile senza tradire il loop reale.
8. **Realizzabile davvero (non demo-fittizia).** Il prodotto può *funzionare per davvero* **chiudendo il loop e2e**: i dati e le integrazioni su cui si regge esistono e sono realmente accessibili seguendo **documentazione esistente** (rete/cloud per i dati OK; inferenza locale; nessun vincolo 90s sul prodotto reale). La demo è una **fetta fedele** di quel prodotto, non un finto flusso. **Se si regge su una fonte dati esterna** (API/portale PA · dataset pubblico-open · opensource): dev'essere **reale e verificata online** — la fonte **esiste** ed **espone davvero** i dati previsti (endpoint/formato/licenza; attento a portali che sono *sole pagine* o cataloghi *non operativi*), con **≥1 subset gratuito/open documentato**. **Se include hardware:** dev'essere **commerciale ed esistente** (mai custom), esporre **davvero** i dati previsti, con **≥1 subset gratuito e open documentato**, integrabile facilmente da doc esistenti.

## Punteggio (6 KPI, 1-5, pesi uguali → /30)
Due gruppi, uno per fase del funnel.

**KPI-concetto (definiscono l'idea vincente — mira a 5):**
| KPI | 5 = | 1 = |
|---|---|---|
| Impatto persona | risolve un blocco quotidiano vero e sentito da una community reale | nice-to-have |
| Originalità | angolo **inatteso su ≥2 assi** (vedi *Assi dell'Originalità* sotto), **fuori dagli oggetti-esempio del brief corrente** | angolo ovvio/inflazionato, o rifà un oggetto/concetto degli "Esempi" del brief corrente |
| Innovazione | ripensa il **modello** (assi: attrito, continuità, acquisizione, proattività, obiettivo) | concetto noto/derivativo ("carica→analizza", comparatore, spiega-e-basta) |

**KPI-esecuzione (scegli la soluzione che chiude il loop e2e e li massimizza):**
| KPI | 5 = | 1 = |
|---|---|---|
| Fattibilità MVP e2e (nel timebox) | il **loop completo** (setup→raccolta→analisi→proposta→conferma→esecuzione) è costruibile e **gira per davvero** su un flusso, con dati/integrazioni realmente accessibili nel tempo (team da 2) | il loop **non si chiude** nel timebox / esiste solo come **fetta-demo mockata**, non e2e |
| Wow demo 90s | il prima→dopo colpisce a colpo d'occhio | si capisce solo spiegando |
| Profondità agentica / LLM | l'agente **chiude il loop fino a eseguire l'azione** (propone→conferma→**esegue**: produce/opera/porta a termine), e senza LLM il prodotto non esiste | si ferma a **report/analisi/proposta**: l'agente non esegue nulla / LLM decorativo |

> Ogni voto va con **mezza riga di motivazione**. **Soglia 27/30**: l'idea mira a 5/5/5 sui KPI-concetto, la soluzione spinge il più in alto i KPI-esecuzione; itera onestamente, **mai gonfiare**; se un tema non arriva a 27, presenta la migliore e marcala **⚠ sotto-soglia**. La **Fattibilità valuta l'MVP e2e**: l'intero loop (setup→esecuzione) costruibile e **funzionante su un flusso** nel timebox (team da 2). Usare **rete/cloud per i dati** è ammesso e **non** abbassa il voto (confine: inferenza offline, dati anche in rete); lo abbassa un loop che **non si chiude nel tempo** o che gira **solo come fetta-demo mockata** invece che e2e. La **demo di 90s non entra** in Fattibilità (è a valle); il **Gate 8** resta la verifica pass/fail che le fonti dati **esistono ed espongono davvero** i dati. **Originalità ≠ Innovazione**: la prima è l'angolo/nicchia, la seconda il paradigma.

**Assi dell'Originalità** — l'"inatteso" si misura **su questi assi, non sull'intensità emotiva o sulla vulnerabilità della persona**: **nicchia/situazione** (un sotto-caso reale che nessuno serve — la *specificità della situazione*, non "quanto è messa male" la persona) · **innesco/momento** (l'occasione reale precisa a cui il servizio si àncora) · **accostamento dati↔problema** (uso non ovvio del substrato dati: un device, un'API, un evento) · **angolo sul dominio** (taglio fresco dentro il tema, lontano dagli oggetti-esempio). **5** = sorprende su **≥2** assi ed è fuori dagli esempi; **3** = una torsione lieve; **1** = ovvia/inflazionata o rebrand di un esempio. **Una condizione oggettiva (una diagnosi) o una paura non è, di per sé, originale**: prende 5 solo se l'*angolo* lo è (es. *Prova Prima* e *Casa in Chiaro* prendono 5 su accostamento/dominio, non perché il protagonista ha paura o una disabilità).

## Template — indice (`docs/discovery/discovery.md`) — lo scrive l'orchestratore
```markdown
# Discovery idee — <data> — brief: <path html>

Metodo: **una proposta per tema** via orchestratore + worker paralleli (funnel IDEA su KPI-concetto → SOLUZIONE = **loop MVP e2e** su KPI-esecuzione). **MVP-first:** si seleziona sul loop reale che si chiude (setup→esecuzione); la demo di 90s è una fetta a valle. Prima i **GATE** (pass/fail), poi **6 KPI** (1-5, /30). Soglia **27/30** (⚠ = sotto soglia; mai gonfiare). Ordine per totale (a parità: **Fattibilità MVP e2e**, poi Impatto).

## Classifica
| # | Tema | Proposta | Persona (perimetro IT) | Archetipo barriera | Gate | Imp | Orig | Inn | Fatt | Wow | Ag | Tot/30 | File |
|---|------|----------|------------------------|--------------------|:----:|:---:|:----:|:---:|:----:|:---:|:--:|:------:|------|
| 1 | 01 | ...  | ... (~X mln) | ... | ✅ | 5 | 5 | 5 | 4 | 5 | 5 | 29 | [apri](<file>) |

## Top pick
<1-2 righe: quale tema/proposta guida e perché, in una frase difendibile a voce.>

## Tutte le proposte
- [<Nome>](<file>) — Tema <NN> — <tot>/30 · substrato: <tipo> <⚠ se sotto soglia>

## Nota di processo
<lean: riconciliazione (barriera + **modello-soluzione** + **aggancio-persona** + **copertura substrato dati** — ≥1 hardware? monocultura di substrato?; monoculture segnalate + eventuali ri-dispatch), trade-off decisi con l'utente, verifiche Gate 8 (fonti dati: cosa espongono davvero), fonti community, eventuali flag ⚠ sotto-soglia.>
```

## Template — file idea (`docs/discovery/<tema-slug>-<idea-slug>.md`) — lo scrive il worker
```markdown
# <Nome proposta>

**Tema:** <NN — Titolo>  ·  **Pitch:** <cosa fa, per chi, in una riga>

<!-- IDEA (concept) -->
## Persona & barriera
- **Chi:** <nome, contesto concreto — la barriera nasce dalla situazione, non dal tratto>
- **Vuole:** <task reale che sta provando a fare>
- **Si blocca perché:** <barriera precisa, qui e ora>  ·  **Archetipo barriera:** <tag> — <meccanismo/esperienza in 3-6 parole>

## Community & perimetro reale (per intersezione)
- **Community (assi diversi):** <2-4 community di appartenenza su assi distinti: demografico · bisogno/condizione · **adozione tech/comportamentale** (chi possiede/usa davvero) · contesto geo/normativo>
- **Vincolo più stringente:** <la facet che restringe di più il bacino — spesso l'adozione tech/comportamentale>
- **Perimetro reale (intersezione) — ordine di grandezza:**
  - **Italia:** ~X — catena: <pop. base × tasso adozione × …> — fonte: <ISTAT/Eurostat/report + anno> (verificata online)
  - **Europa / Mondo:** ~Y / ~Z — *solo se il prodotto può scalare oltre confine* — stesso metodo, fonte: <Eurostat/OCSE/UN/report globale>

## Modello & innovazione
<il paradigma in 1-2 righe: come il servizio si relaziona alla persona/problema — e su quali assi innova (attrito, continuità, acquisizione, proattività, obiettivo). Agnostico sulla forma tecnica.>

<!-- SOLUZIONE (execution) = loop MVP e2e -->
## MVP e2e — il loop (su un flusso)
1. **Setup/attivazione (una tantum):** <come la persona attiva il servizio / collega la fonte dati — poi lavora da sé>
2. **Raccolta dati:** <innesco/artefatto reale su cui si àncora> — **Substrato (recon, verificata online):** <tipo: hardware/sensore · API-PA/portale · open-dataset · opensource · documento/evento-software> — <cosa espone **davvero** (endpoint/formato/licenza) + fonte/doc>
3. **Analisi (LLM a runtime, offline via CLI `claude`):** <operazione strutturata: estrae JSON / classifica / valuta / rileva il blocco>
4. **Proposta azione:** <l'azione concreta che il servizio propone — non un report>
5. **Conferma (umana o agentica):** <chi conferma e come: human-in-the-loop o delegata all'agente entro i confini (Gate 5)>
6. **Esecuzione (possibilmente automatica):** <cosa il prodotto ESEGUE: produce l'artefatto, opera sul device/sistema, porta a termine il passo>

## Fetta demo 90s (a valle — si costruisce dopo, mockando il necessario)
- **Prima:** <cosa NON riesce a fare>
- **Dopo:** <cosa riesce a fare, visibile a schermo: quali stage del loop si mostrano dal vivo, cosa si mocka>
- **MVP reale (oltre la fetta):** <il loop e2e completo + fonte dati reale (device · API/portale PA · dataset open/free + puntatore doc, verificati online). Rete/cloud per i dati OK; inferenza locale; nessun vincolo 90s sul loop.>

## Gate-check
- [ ] LLM a runtime nel prodotto
- [ ] Solo CLI `claude` locale, offline per l'inferenza (rete/cloud solo per i dati; demo offline)
- [ ] 1 persona concreta + barriera dalla situazione (passa lo swap-test, non caricatura)
- [ ] Capability concreta che **chiude il loop** (proposta→conferma→**esecuzione**), non solo riscrittura/report
- [ ] Semplifica senza tradire (no consulenza personalizzata)
- [ ] Rispetta "Vincoli", non ricade in "Cosa evitare", **non** rifà un oggetto/concetto degli "Esempi" del brief corrente
- [ ] Fetta demo ~90s **estraibile** dall'MVP e2e (si costruisce dopo, mockando il necessario)
- [ ] Realizzabile davvero (fonte dati reale **verificata online — espone davvero i dati**; se PA/portale/open: API/dataset reale, non sola pagina; se hw: commerciale + ≥1 dato open documentato)
<!-- se un gate è a rischio: ⚠ + 1 riga su come si mette in sicurezza -->

## Punteggio (pesi uguali, /30 — soglia 27)
| KPI | 1-5 | Perché |
|---|:---:|---|
| Impatto persona | x | … |
| Originalità | x | … |
| Innovazione | x | … |
| Fattibilità MVP e2e (timebox) | x | … |
| Wow demo 90s | x | … |
| Profondità agentica/LLM (l'agente *esegue*, chiude il loop) | x | … |
| **Totale** | **xx/30** | <⚠ sotto-soglia se <27> |

## Assunzione forte / Ridimensionamento a un flusso <!-- solo se emersa dal trade-off (orchestratore) -->
<cosa hai assunto, o a quale singolo flusso e2e hai ridotto l'MVP, per rientrare nel timebox — così resta difendibile a voce>

## Rischio principale → mitigazione
<1 riga>
```

## Errori comuni
- **Concetto derivativo** ("carica → analizza", comparatore, spiega-e-basta): magari originale nella nicchia, ma il *modello* è noto → **Innovazione bassa**. Ripensa attrito / temporalità / iniziativa / obiettivo.
- **Solo report/analisi** invece di **azioni concrete**: l'agente deve *fare* qualcosa **fino a eseguire l'azione** (propone→conferma→**esegue**), non fermarsi a proposta/analisi → altrimenti **Profondità agentica bassa** e loop e2e non chiuso.
- **Selezionare per dimostrabilità invece che per l'MVP e2e**: scegliere l'idea per quanto è facile mostrarla in 90s → si sceglie sul **loop reale che si chiude** (Fattibilità MVP e2e + Profondità agentica). Il **Wow demo è UNO** dei sei KPI, non il driver; la demo è a valle.
- **Persona-caricatura**: barriera dedotta da un tratto protetto (immigrato che non parla italiano, anziana vedova) → **Gate 3** fallito. La barriera nasce dalla **situazione** (swap-test).
- **Collisione di sola etichetta**: due proposte con lo stesso tag ma **meccanismo/esperienza diversi** (es. *cognitiva* = disfunzione esecutiva vs acquisire un'abilità) **NON** sono in collisione → **non** ri-lanciarle. La riconciliazione giudica la **sostanza**, non il tag (Procedura 3).
- **Ri-dispatch non confermato**: il ri-lancio **costa un funnel intero** (minuti). Anche per una collisione vera: **motiva e chiedi conferma**; se l'utente è già soddisfatto di una proposta, **stop** (default "tieni così").
- **Secondo ordine nel ri-lancio**: escludendo un asse, i ri-lanci **paralleli** ri-collidono sul successivo (osservato: tutti su "emotiva") → assegna assi **distinti** o ri-lancia in serie.
- **Saltare il *check* di riconciliazione**: il **check** cross-tema è obbligatorio (l'azione no); senza, il parallelo regredisce sulla varietà (il vantaggio della v3).
- **Guardare solo la barriera in riconciliazione**: il reduce deve confrontare anche il **modello-soluzione** (`MODELLO-INNOVAZIONE`) e l'**aggancio-persona**, non solo l'archetipo di barriera → modelli tutti uguali o persone tutte "con una diagnosi/paura" sono monoculture invisibili se guardi solo il tag-barriera.
- **Aggancio-persona monocorde**: tutte/quasi le persone su una **condizione oggettiva o una paura** (diagnosi, "paura di X") passa lo swap-test ma perde le barriere **situazionali** → **segnala** nel reduce; non vietare l'archetipo, non penalizzare il punteggio.
- **Originalità gonfiata dalla vulnerabilità**: dare Originalità alta perché la persona ha una diagnosi o "fa tenerezza" → l'originalità è sull'**angolo** (nicchia/situazione, innesco, accostamento dati↔problema, dominio), **non** sulla fragilità del protagonista.
- **Worker che decide un trade-off** o interpella l'utente: non può (niente `AskUserQuestion`) → **flagga** e basta; decide l'orchestratore.
- **Riproporre concetto O oggetto degli "Esempi"** del brief corrente: scartati a priori → **Gate 6** + Originalità bassa. Servono solo a calibrare il pattern.
- **Assumere uno schema HTML fisso** (etichette esatte, N temi fisso): il brief cambia struttura → estrai **per significato** (Procedura 1), tollera sezioni assenti/rinominate/asimmetriche e **qualunque numero** di temi.
- **Più proposte per tema** o **saltare un tema**: sempre **una** per tema, tutti i temi.
- **Gonfiare i voti** per arrivare a 27: mai. Se non ci arriva → **⚠ sotto-soglia** col voto onesto.
- **Bacino gonfiato = community più larga invece dell'intersezione**: contare la community anagrafica senza incrociare l'**adozione tech/comportamentale** (chi *ha davvero* il device / *usa davvero* il servizio oggi) gonfia l'Impatto. Stima l'**intersezione** col **vincolo più stringente** e mostra la **catena**; **Italia** sempre, **Europa/Mondo** solo se scala. La sezione Community (con fonte) è **obbligatoria** nel file.
- **Demo-fittizia**: mostrare un flusso che il prodotto reale non potrebbe fare → **Gate 8**. La demo è una *fetta vera* **estratta dall'MVP e2e** su dati locali.
- **Hardware custom o dato non-open/non-documentato** → **Gate 8** fallito. Device **commerciale** + ≥1 subset **gratuito/open** + doc reale (verifica online).
- **Recon dati solo tardiva (a Gate 8) invece che in esplorazione**: verificare le fonti *dopo* aver scelto idea+soluzione spreca il segnale più utile → la recon (hardware · **API/portali PA** · open) va fatta **in Fase IDEA** e deve **informare** l'angolo/soluzione, non solo validarli.
- **Ripiego di default sul substrato 'documento/evento software'** (carica PDF/email/pagina-portale → spiega): senza reconnare le fonti reali il worker sceglie il substrato più comodo → set **0-hardware** e poco vario. Reconna le **tre famiglie** prima di fissare la soluzione.
- **Portale PA scambiato per dato queryable**: usarlo come *pagina da leggere/scrapare* assumendo che esponga i dati → **verifica online cosa espone DAVVERO** (API/dataset vs sola pagina; cataloghi *annunciati ma non operativi*).
- **Set 0-hardware non controllato al reduce**: senza il check di copertura del `SUBSTRATO-DATI`, «almeno una proposta hardware» resta al caso (osservato: 0/3). Il reduce **controlla il substrato** e **offre** il ri-dispatch (floor hardware) — senza però forzare hardware dove non regge.
- **Data-first che sacrifica la persona**: partire dai dati e cercarci un problema → l'accostamento dati↔problema è **al servizio** della persona/barriera (primato persona), non il contrario.
- **Confondere Fattibilità (MVP e2e) e realizzabilità (Gate 8)**: la Fattibilità misura *costruire e far girare il loop e2e nel timebox*; il **Gate 8** è pass/fail — *le fonti dati esistono ed espongono davvero*. La **demo di 90s NON entra** in Fattibilità (è a valle); rete/cloud per i dati non l'abbassa (inferenza offline resta un confine).
- **Confondere Originalità e Innovazione**: la prima è l'angolo/nicchia, la seconda il paradigma — voti separati.
- **Scegliere la forma tecnica in discovery** (app vs estensione vs daemon): fuori perimetro. Il *substrato dati* (hardware/API) sì che va nominato: serve al Gate 8.
- **Punteggi senza motivazione** o **file-essay** lunghi: ogni voto ha la sua mezza riga; template minimale e scannabile.
- **Reduce in un modo single-unit**: riconciliazione, classifica e indice sono **solo** di FULL. In TEMA/IDEA-ESTERNA/APPROFONDISCI non riconciliare, non ordinare, non creare l'indice (aggiornalo solo se già esiste).
- **Formalize gonfiato**: forzare un'idea esterna a passare i GATE o a toccare 27 → viola "mai gonfiare". Onesto di default (può fallire); `repair` **solo** se richiesto e **dichiarato**.
- **Inline `axis`: confine sbagliato**: **non** escalare al worker solo perché il KPI dell'asse si muove (è previsto → aggiorna quella cella inline). Escala **solo** se serve ri-eseguire il **funnel end-to-end** (re-score olistico, oppure rifare recon+Gate 8+sizing insieme).
- **Varianti che sovrascrivono l'originale**: `variants:<n>` scrive `<card>-varianti.md`, **non** tocca la card di partenza.
