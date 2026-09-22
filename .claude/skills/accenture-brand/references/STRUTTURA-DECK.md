# Struttura di un deck

Le guidelines coprono colore, tipografia, logo e voce. **Non dicono quante slide
fare né in che ordine.** Questa pagina colma il buco, e non viene dal PDF: viene
dagli errori che si fanno quando un deck conforme resta comunque illeggibile.

Tienilo presente quando leggi: queste sono regole di mestiere, non prescrizioni
del brand. Se il committente ha un formato proprio, vince il suo.

## La regola che vale più di tutte: dimezza

Un primo deck ha quasi sempre **il doppio delle slide che servono**. Non perché
chi lo scrive esagera: perché ogni argomento sembra meritare la sua schermata.

Il criterio per fondere due slide è uno: **se la seconda non cambia la decisione
di chi guarda, va dentro la prima o non va.**

| Sintomo | Cosa fare |
|---|---|
| Due slide consecutive con lo stesso soggetto da angoli diversi | fonderle: due colonne |
| Una slide che spiega a parole quello che la slide accanto mostra con una tabella | tenere la tabella, togliere le parole |
| Una citazione o un principio che arriva quarto dopo diagramma, schede e tabella | tagliarlo: nessuno lo legge |
| Un dato ripetuto su due slide | lasciarlo dove **dimostra** qualcosa, togliere l'altro |

Dimezzare non è togliere sostanza: nella pratica il testo che sparisce è quello
che ripeteva.

## Densità: una slide, una schermata

Una slide più alta della finestra costringe chi presenta a scorrere **dentro**
una slide, e chi guarda perde il filo.

Misuralo invece di stimarlo, alla dimensione a cui verrà proiettato:

```js
// Rapporto fra altezza della slide e altezza della finestra.
[...document.querySelectorAll('.slide')].map((s, i) =>
  `${i + 1}: ${(s.offsetHeight / window.innerHeight).toFixed(2)}`)
```

- **≤ 1,00** — sta in una schermata. È l'obiettivo.
- **fino a 1,10** — accettabile in un deck a scorrimento.
- **oltre 1,20** — la slide porta due argomenti. Tagliane uno, o dividila.

⚠️ Se la misura restituisce numeri assurdi, controlla `window.innerHeight`:
in un pannello di anteprima non impaginato vale `0` e tutti i rapporti sono
privi di senso. Forza una dimensione reale prima di misurare.

## L'arco: cinque momenti

Non cinque slide — cinque **momenti**, che possono stare in quattro slide o in
otto. L'ordine invece conta, e un deck che salta un momento lo fa notare.

| # | Momento | La domanda a cui risponde |
|---|---|---|
| 1 | **Il problema** | chi ha questo problema, e in che istante preciso si blocca? |
| 2 | **La prova** | qual è la cifra, o il confronto, che rende il problema innegabile? |
| 3 | **Come funziona** | qual è l'idea che lo risolve, e perché regge? |
| 4 | **Come è stato costruito** | quali vincoli garantiscono che non sia una demo fortunata? |
| 5 | **Dove siamo e dove andiamo** | cos'è finito, cosa è aperto, cosa viene dopo |

Il momento 1 va reso **concreto**: una persona, un luogo, un istante. «Gli utenti
hanno difficoltà con X» non è il momento 1, è la sua astrazione.

Il momento 4 è quello che si salta più spesso, ed è quello che distingue un
prototipo raccontato bene da un lavoro di cui fidarsi.

## Momento 5 — «Dove siamo e dove andiamo»

La sezione che manca quasi sempre, e che cambia come viene letto tutto il resto.
Un deck che mostra **solo** cosa è stato fatto invita la domanda «e adesso?»
senza governarla: chi guarda se la fa comunque, e se la risposta non c'è la
riempie da sé, spesso al ribasso.

### Tre colonne, non due

| Colonna | Cosa contiene | Cosa NON contiene |
|---|---|---|
| **Fatto** | ciò che funziona adesso, con la prova accanto | aspirazioni al presente |
| **Aperto** | ciò che manca e **perché** manca | scuse |
| **Prossimi passi** | la direzione, in ordine di dipendenza | date, stime, promesse |

Separare **Aperto** da **Prossimi passi** è la parte che si sbaglia. Sono cose
diverse: «aperto» è un debito che conosci; «prossimo passo» è una scelta che
farai. Metterli insieme fa sembrare debito ciò che è ambizione, o viceversa.

### Le regole di scrittura di questa sezione

1. **Il tempo verbale separa i mondi.** Ciò che esiste va al **presente
   indicativo**; ciò che verrà va al **futuro** o a una forma esplicitamente
   ipotetica. Una funzionalità futura scritta al presente diventa una
   dichiarazione falsa, e in un deck letto da un committente è la deviazione
   più grave di questa pagina.
2. **Ogni voce di «fatto» porta la sua prova.** Un numero, un comando che si può
   rilanciare, un artefatto che si può aprire. Senza prova è un'affermazione.
3. **Ogni voce di «aperto» porta il suo perché.** «Non verificato perché la
   fonte non era raggiungibile» si può valutare; «non verificato» no.
4. **Nessuna data.** Una roadmap con date in un deck di presentazione viene
   letta come impegno. Usa l'ordine di dipendenza: «prima A, perché B ne
   dipende».
5. **Un passo per riga, con il suo motivo.** «Poi faremo X» non dice niente.
   «Poi X, perché oggi Y si fa a mano» dice cosa cambia e per chi.
6. **Niente superlativi.** La sezione è credibile in proporzione a quanto è
   asciutta. Se una voce ha bisogno di un aggettivo per sembrare importante, non
   lo è.

### Il tono: dichiarare non è scusarsi

Le due formulazioni sbagliate stanno agli estremi opposti, e le vedi entrambe.

| ✕ Si scusa | ✕ Promette | ✓ Dichiara |
|---|---|---|
| «Purtroppo non abbiamo ancora…» | «Il prodotto supporta anche…» *(non è vero oggi)* | «Oggi si fa a mano. Il passo successivo è automatizzarlo.» |
| «Abbiamo avuto poco tempo per…» | «Sarà pronto a breve» | «Questa parte è aperta: dipende da <vincolo>.» |
| «Ci scusiamo per la mancanza di…» | «Basterà aggiungere…» | «È la direzione naturale, e questo è il motivo.» |

La forma che funziona è **constatativa**: dice dove sta la linea, da quale lato
si trova ogni cosa, e cosa la sposterebbe. Chi guarda ricava da sé che il lavoro
è serio, senza che il deck lo affermi.

### Un modo di formulare un prossimo passo

Tre elementi, in quest'ordine: **cosa si fa oggi → cosa cambierebbe → perché
adesso non c'è.**

> Oggi i dati si inseriscono a mano, campo per campo. Il passo successivo è
> leggerli dal documento, così al posto di dieci inserimenti resta una conferma.
> Non c'è ancora perché la conferma umana va progettata prima
> dell'automatismo, non dopo.

Notare cosa fa quel paragrafo: non promette, non si scusa, e l'ultima frase
trasforma un'assenza in una **decisione**. È la differenza fra una lacuna e un
ordine di lavoro.

## Cosa mettere su una slide di diagramma

Un diagramma merita la slide solo se sostituisce prosa che sarebbe più lunga.
Due tipi si ripagano quasi sempre:

- **Il confine** — cosa sta da una parte e cosa dall'altra, con la linea che
  qualcosa non attraversa. Rende visibile una garanzia.
- **Il ciclo** — i passi in fila e la freccia di ritorno. Rende visibile che il
  processo si chiude su se stesso invece di finire.

In entrambi i casi: `<title>` e `<desc>` sempre, e nessun testo che esca dalla
sua scatola. Si verifica a macchina, vedi [CHECKLISTS.md](CHECKLISTS.md)
§ Verifica meccanica.

## Vedi anche

- [CHECKLISTS.md](CHECKLISTS.md) — il cancello prima della consegna
- [CORE-PRINCIPLES.md](CORE-PRINCIPLES.md) § Voce — il registro da tenere
- [../examples/html-css.md](../examples/html-css.md) § Stato e prossimi passi —
  il pattern di markup
