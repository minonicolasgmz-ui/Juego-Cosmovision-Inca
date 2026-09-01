/**
 * ============================================================================
 * JUEGO: CAMINO A CORICANCHA - SISTEMA DE PUNTAJES EN GOOGLE SHEETS
 * Google Apps Script Web App (Backend API)
 * ============================================================================
 * Este script actúa como API web para:
 * 1. Guardar los puntajes enviados por el juego (doPost y doGet fallback).
 * 2. Entregar los puntajes en formato JSON ordenados por ranking para el
 *    tablero en tiempo real en cualquier página web (doGet).
 */

const SHEET_NAME = 'Puntajes';

/**
 * Configura la hoja con cabeceras y estilos automáticamente.
 * Ejecuta esta función una vez en el editor de Apps Script si deseas formatear la hoja.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Cabeceras
  const headers = [
    'ID',
    'Fecha / Hora',
    'Curaca / Jugador',
    'Colegio',
    'Puntaje',
    'Resultado',
    'Meses',
    'Población',
    'Alimento',
    'Fe'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Estilo de cabecera
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#b8860b'); // Oro inca
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Autoajuste de columnas
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Obtiene o crea la hoja de cálculo de puntajes.
 */
function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  return sheet;
}

/**
 * Maneja peticiones GET.
 * Permite leer el ranking en formato JSON desde cualquier página web.
 * También soporta guardado por GET como fallback.
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getScores';

    // Acción para guardar vía GET (fallback para evitar problemas de CORS o proxies estrictos)
    if (action === 'addScore' || (params.jugador && params.puntaje)) {
      return handleAddScore(params);
    }

    // Acción por defecto: Obtener los puntajes para el tablero en tiempo real
    const scores = getScoresFromSheet(params.colegio, params.limit);
    return createJsonResponse({
      success: true,
      total: scores.length,
      timestamp: new Date().toISOString(),
      data: scores
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Maneja peticiones POST enviadas desde el juego para registrar un puntaje.
 */
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    return handleAddScore(data);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Inserta un nuevo registro en la hoja de cálculo.
 */
function handleAddScore(data) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  const id = lastRow; // Número secuencial
  const fecha = data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd HH:mm:ss');
  const jugador = (data.jugador || 'Anónimo').toString().trim();
  const colegio = (data.colegio || 'S/D').toString().trim().toUpperCase();
  const puntaje = parseInt(data.puntaje, 10) || 0;
  const resultado = (data.resultado || 'Fin de Partida').toString().trim();
  const meses = parseInt(data.meses, 10) || 0;
  const poblacion = parseInt(data.poblacion, 10) || 0;
  const alimento = parseInt(data.alimento, 10) || 0;
  const fe = parseInt(data.fe, 10) || 0;

  // Insertar fila
  sheet.appendRow([
    id,
    fecha,
    jugador,
    colegio,
    puntaje,
    resultado,
    meses,
    poblacion,
    alimento,
    fe
  ]);

  // Formato centrado para columnas de números
  const newRowIndex = sheet.getLastRow();
  sheet.getRange(newRowIndex, 1).setHorizontalAlignment('center');
  sheet.getRange(newRowIndex, 4).setHorizontalAlignment('center');
  sheet.getRange(newRowIndex, 5).setHorizontalAlignment('right').setNumberFormat('#,##0');
  sheet.getRange(newRowIndex, 7, 1, 4).setHorizontalAlignment('center');

  return createJsonResponse({
    success: true,
    message: 'Puntaje registrado exitosamente',
    record: {
      id: id,
      fecha: fecha,
      jugador: jugador,
      colegio: colegio,
      puntaje: puntaje,
      resultado: resultado
    }
  });
}

/**
 * Lee los puntajes de la hoja y los ordena de mayor a menor puntaje.
 */
function getScoresFromSheet(filterColegio, limit) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  // Leer todos los datos excepto la cabecera
  const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

  let list = values.map(function(row) {
    return {
      id: row[0],
      fecha: (row[1] instanceof Date) ? Utilities.formatDate(row[1], Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd HH:mm:ss') : row[1],
      jugador: row[2],
      colegio: row[3],
      puntaje: parseInt(row[4], 10) || 0,
      resultado: row[5],
      meses: row[6],
      poblacion: row[7],
      alimento: row[8],
      fe: row[9]
    };
  });

  // Filtrar si se solicitó un colegio específico
  if (filterColegio && filterColegio.trim() !== '') {
    const colFilter = filterColegio.trim().toUpperCase();
    list = list.filter(function(item) {
      return item.colegio === colFilter;
    });
  }

  // Ordenar descendentemente por puntaje (y como desempate, por fecha más reciente)
  list.sort(function(a, b) {
    if (b.puntaje !== a.puntaje) {
      return b.puntaje - a.puntaje;
    }
    return new Date(b.fecha) - new Date(a.fecha);
  });

  // Asignar posición en el ranking (1, 2, 3...)
  list = list.map(function(item, index) {
    item.ranking = index + 1;
    return item;
  });

  // Limitar resultados si se indicó
  const maxLimit = parseInt(limit, 10);
  if (maxLimit && maxLimit > 0) {
    list = list.slice(0, maxLimit);
  }

  return list;
}

/**
 * Crea una salida JSON compatible con CORS para que cualquier página web pueda leer los datos.
 */
function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
