# README: Startup Scouting AI

Sistema di ricerca acceleratori europei e startup tramite LLM via API, con compilazione automatica in Google Sheets.

Link al Google Sheet generato: https://docs.google.com/spreadsheets/d/1spD0c5def9gJloQFbYQ_VwmZW97MPv1N8xRa_gopYZk/edit?usp=sharing

## Funzionalità

### Ricerca Acceleratori Europei
- Ricerca automatica via web tramite LLM di 10 acceleratori europei attivi nel 2026
- Output: Scheda "Accelerators" contenente tre colonne:
  - Sito internet
  - Nome
  - Sigla paese

### Ricerca Startup Europee
- Ricerca automatica via web tramite LLM di due startup per ciascun acceleratore trovato in precedenza
- Output: Scheda "Accelerators" contenente cinque colonne:
  - Sito internet
  - Nome
  - Sigla paese
  - Acceleratore di riferimento
  - Breve descrizione (value proposition)

---

## Prima parte: setup Google Sheets e Google Apps Script

1. Crea nuovo foglio Google
2. Dalla barra degli strumenti in alto: Estensioni → Apps Script
3. Copiare il file main.gs (caricato nella cartella GitHub) e salvare
4. Necessario dare le autorizzazioni: Esegui → Concedi autorizzazioni Google
5. Tornare al foglio Google e aggiornarlo

## Seconda parte: setup chiave API

1. Creare account Perplexity
2. Accedere all'account
3. 

## Terza parte: esecuzione comandi

1. Creazione delle schede nel foglio Google. Dalla barra degli strumenti in alto: Startup Scouting AI → Creazione schede
2. Ricerca acceleratori: Startup Scouting AI → Ricerca Acceleratori
3. Ricerca startup: Startup Scouting AI → Ricerca Startup
4. Creazione descrizioni startup: Startup Scouting AI → Genera descrizioni

---

## Troubleshooting

### "Rate limit exceeded (429)"
Provare con meno acceleratori

### "Sheet not found"
Foglio Google → Barra degli strumenti in alto → Startup Scouting AI → Creazione schede

---

## Configurazione Tecnica

| Parametro | Valore |
|-----------|--------|
| Data Source | Perplexity LLM |
| Model | sonar-pro |
| Endpoint | https://api.perplexity.ai/chat/completions |
| API Key | Già configurata (non modificare) |
