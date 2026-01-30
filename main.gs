const key = PropertiesService.getScriptProperties().getProperty("API_SECRET_KEY");

// Sheet ID
const SHEET_IDS = {
  accelerators: 'Accelerators',    // Sheet per dati acceleratori
  startups: 'Startups',             // Sheet per dati startup
};

// =====================================
// FUNZIONE CHE CHIAMA LLM VIA API
// =====================================

function callPerplexityAPI(query) {
  try {
    const url = 'https://api.perplexity.ai/chat/completions';
    
    const payload = {
      model: 'sonar-pro',
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content;
    }
    
    return '';
    
  } catch (error) {
    console.log('ERRORE Perplexity API: ' + error.toString());
    return '';
  }
}

// =====================================
// Creazione schede
// =====================================

function createInitialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Crea Accelerators se manca
  if (!ss.getSheetByName(SHEET_IDS.accelerators)) {
    const acceleratorsSheet = ss.insertSheet(SHEET_IDS.accelerators);
    acceleratorsSheet.appendRow([
      'Website',
      'Name',
      'Country'
    ]);
    console.log('Scheda "Accelerators" creato.');
  }
  
  if (!ss.getSheetByName(SHEET_IDS.startups)) {
    const startupsSheet = ss.insertSheet(SHEET_IDS.startups);
    startupsSheet.appendRow([
      'Website',
      'Name',
      'Country',
      'Accelerator Reference',
      'Value Proposition'
    ]);
    console.log('Scheda "Startups" creato.');
  }
  
  console.log('Tutte le schede create con successo.');
}

// =====================================
// Ricerca Acceleratori Europei
// =====================================

function searchEuropeanAccelerators() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const acceleratorsSheet = ss.getSheetByName(SHEET_IDS.accelerators);
  
  if (!acceleratorsSheet) {
    console.log('ERRORE: scheda "Accelerators" non trovata.');
    return;
  }
  
  try {
    console.log('Inizio ricerca acceleratori europei via Perplexity...');
    
    const query = 'Dammi un elenco di 10 tra i principali acceleratori attivi oggi. ' +
      'Considera solo quelli di nazioni europee. ' +
      'Rispondi SOLO in formato JSON array (senza markdown o spiegazioni): ' +
      '[{website: "dominio.com", name: "Nome Acceleratore", country: "IT"}]. ' +
      'Includi: website normalizzato (senza https:// www.), nome completo, codice paese a 2 lettere. ' +
      'Solo acceleratori europei attivi.';
    
    const response = callPerplexityAPI(query);
    
    if (!response) {
      console.log('ERRORE: nessuna risposta da Perplexity. Verifica API key e connessione.');
      return;
    }
    
    console.log('Risposta ricevuta da Perplexity. Analizzo file JSON...');
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('ERRORE: formato risposta Perplexity non valido. Riprova.');
      return;
    }
    
    const accelerators = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(accelerators) || accelerators.length === 0) {
      console.log('ERRORE: nessun acceleratore trovato da Perplexity');
      return;
    }
    
    console.log('Trovati ' + accelerators.length + ' acceleratori. Scrivendo in sheet...');
    
    const rows = [];
    accelerators.forEach(acc => {
      rows.push([
        acc.website,
        acc.name,
        acc.country
      ]);
    });
    
    if (rows.length > 0) {
      acceleratorsSheet.getRange(2, 1, rows.length, 3).setValues(rows);
    }
    
    console.log(
      'Ricerca completata!\nTrovati e aggiunti alla scheda "Accelerators" ' + accelerators.length + ' acceleratori europei.\nOra esegui "Search Startups by Accelerator" per completare il database.'
    );
    
  } catch (error) {
    console.log('ERRORE: ' + error.toString());
  }
}

// ============================================
// Ricerca Startup associate agli Acceleratori
// ============================================

function searchStartupsByAccelerator() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const acceleratorsSheet = ss.getSheetByName(SHEET_IDS.accelerators);
  const startupsSheet = ss.getSheetByName(SHEET_IDS.startups);
  
  if (!acceleratorsSheet || !startupsSheet) {
    console.log('ERRORE: scheda "Accelerators" o "Startups" non trovata');
    return;
  }
  
  try {

    console.log('Iniziando ricerca startup europee via Perplexity...');
    const acceleratorsData = acceleratorsSheet.getDataRange().getValues();
    
    if (acceleratorsData.length <= 1) {
      console.log('ATTENZIONE: nessun acceleratore trovato.\nEsegui prima "Search European Accelerators" per popolare la lista.');
      return;
    }
    
    const acceleratorsList = [];
    for (let i = 1; i < acceleratorsData.length; i++) {
      const name = acceleratorsData[i][1] ? acceleratorsData[i][1].toString().trim() : '';
      if (name) {
        acceleratorsList.push(name);
      }
    }
    
    if (acceleratorsList.length === 0) {
      console.log('ATTENZIONE: nessun acceleratore valido trovato nel database.');
      return;
    }
    
    console.log('Trovati ' + acceleratorsList.length + ' acceleratori. Ricerca startup via Perplexity...');

    const query = 'Dammi un elenco di startup di nazioni europee attive associate ai seguenti acceleratori: ' +
      acceleratorsList.join(', ') + '. ' +
      'Limita il numero di start-up a due per ciascun acceleratore, ma fai in modo da averne almeno una per ciascuno. ' +
      'Per ogni startup, indica: sito web, nome, paese (codice 2 lettere) ed acceleratore di riferimento, ' +
      'senza specificare nulla dell\'attività di ciascuna startup.' +
      'Rispondi solo in formato JSON array (senza markdown): ' +
      '[{website: "domain.com", name: "Nome", country: "IT", accelerator: "Acceleratore"}]. ' +
      'Verifica che ogni startup sia effettivamente associata all\'acceleratore indicato.';
    
    const response = callPerplexityAPI(query);
    
    if (!response) {
      console.log('ERRORE: nessuna risposta da Perplexity. Verifica API key e connessione.');
      return;
    }
    
    console.log('Risposta ricevuta da Perplexity. Analizzo file JSON...');
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('ERRORE: formato risposta Perplexity non valido. Riprova.');
      return;
    }
    
    const startups = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(startups) || startups.length === 0) {
      console.log('ERRORE: nessuna startup trovata da Perplexity');
      return;
    }
    
    console.log('Trovate ' + startups.length + ' startup. Scrivendo in sheet...');
    
    const rows = [];
    startups.forEach(startup => {
      rows.push([
        startup.website,
        startup.name,
        startup.country,
        startup.accelerator
      ]);
    });

    console.log(rows)
    
    if (rows.length > 0) {
      startupsSheet.getRange(2, 1, rows.length, 4).setValues(rows);
    }
    
    console.log(
      'Ricerca completata!\nTrovate ed aggiunte al database ' + startups.length + ' startup europee.'
    );
    
  } catch (error) {
    console.log('ERRORE: ' + error.toString());
  }
}

function generateStartupDescriptions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const startupsSheet = ss.getSheetByName(SHEET_IDS.startups);

  if (!startupsSheet) {
    console.log('ERRORE: scheda "Startups" non trovata.');
    return;
  }

  try {
    console.log('Inizio generazione descrizioni per le startup...');

    const values = startupsSheet.getDataRange().getValues();

    if (values.length <= 1) {
      console.log('ATTENZIONE: nessuna startup trovata nella scheda.');
      return;
    }

    const output = [];
    output.length = values.length - 1;

    for (let i = 1; i < values.length; i++) {
      const name = values[i][1];

      if (!name) {
        output[i - 1] = '';
        continue;
      }

      console.log('Generazione descrizione per startup ' + name + '.');

      const prompt =
        'Genera una sola frase in inglese, in questa forma esatta: ' +
        'Startup <X> helps <Target Y> do <What W> so that <Benefit Z>. ' +
        'Sostituisci <X> con il nome della startup "' + name + '". ' +
        'Sfrutta il sito internet della startup per estrarre queste informazioni. ' +
        'La frase deve essere auto-consistente e comprensibile, senza altre informazioni. ' + 
        'Non usare parentesi, grassetto, corsivo e underline.';

      const response = callPerplexityAPI(prompt);
      console.log(response)

      if (!response) {
        console.log('ATTENZIONE: nessuna risposta per startup ' + name);
        output[i - 1] = '';
        continue;
      }

      // Qui si assume che LLM ritorni solo la frase, senza file JSON
      const description = response.trim();
      output[i - 1] = [description];
    }

    // Scriviamo le descrizioni in colonna E (Value Proposition), righe dalla 2 in giù
    const startRow = 2;
    const valuePropRange = startupsSheet.getRange(2, 5, output.length, 1);
    valuePropRange.setValues(output);

    console.log('Generazione descrizioni completata per ' + output.length + ' startup.');

  } catch (error) {
    console.log('ERRORE durante generazione descrizioni: ' + error.toString());
  }
}


// =====================================
// MENÙ PERSONALIZZATO GOOGLE SHEETS
// =====================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('Startup Scouting AI')
    .addItem('Creazione schede', 'createInitialSheets')
    .addItem('Ricerca Acceleratori', 'searchEuropeanAccelerators')
    .addItem('Ricerca Startup', 'searchStartupsByAccelerator')
    .addItem('Genera descrizioni', 'generateStartupDescriptions')
    .addToUi();
}
