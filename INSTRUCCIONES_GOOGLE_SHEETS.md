# 📜 Guía de Integración: Google Sheets, Apps Script y Tablero en Tiempo Real

Esta guía explica cómo vincular el juego **Camino a Coricancha** con una hoja de cálculo de Google Sheets para que los puntajes de los alumnos se guarden automáticamente y se sincronicen en vivo con el tablero web y cualquier otra página web.

---

## 🚀 Paso 1: Crear la Hoja de Google Sheets

1. Ve a [Google Sheets](https://sheets.new) y crea una nueva hoja en blanco.
2. Nómbrala, por ejemplo: `Torneo Inca - Puntajes`.

---

## ⚡ Paso 2: Pegar el Código de Apps Script

1. En el menú superior de Google Sheets, ve a: **Extensiones** > **Apps Script**.
2. Borra todo el código que aparezca en el editor (`function myFunction() {...}`).
3. Abre el archivo [`google_apps_script.gs`](google_apps_script.gs) de este proyecto, copia todo su contenido y pégalo en el editor de Apps Script.
4. *(Opcional)* Arriba en la barra de herramientas, selecciona la función `setupSheet` en el desplegable y haz clic en **Ejecutar**. Esto creará automáticamente las columnas formateadas en dorado y negrita (`ID`, `Fecha/Hora`, `Curaca/Jugador`, `Colegio`, `Puntaje`, `Resultado`, etc.).

---

## 🌐 Paso 3: Publicar como Aplicación Web (Web App)

1. En la esquina superior derecha de Apps Script, haz clic en el botón azul **Implementar** (Deploy) > **Nueva implementación**.
2. En la ventana emergente, haz clic en el ícono de engranaje ⚙️ (al lado de *Seleccionar tipo*) y elige **Aplicación web**.
3. Configura exactamente estas opciones:
   - **Descripción**: `API Puntajes Inca`
   - **Ejecutar como**: `Yo (tu correo de Google)`
   - **Quién tiene acceso**: `Cualquier persona` (*Anyone* — ¡muy importante para que los jugadores puedan enviar y leer puntajes sin iniciar sesión!).
4. Haz clic en **Implementar**.
5. Si te pide autorizar permisos, haz clic en *Revisar permisos* > selecciona tu cuenta > *Configuración avanzada* > *Ir a API Puntajes Inca (no seguro)* > *Permitir*.
6. Copia la **URL de la aplicación web** generada (termina en `/exec`).
   - Ejemplo: `https://script.google.com/macros/s/AKfycbz_XXXXX.../exec`

---

## 🔗 Paso 4: Vincular con el Juego y el Tablero

### Opción A: Desde la interfaz web (Rápido y sin tocar código)
1. Abre [`tablero.html`](tablero.html) o el botón 🏆 **Tablero** dentro del juego [`index.html`](index.html).
2. Haz clic en el botón **⚙️ Configurar URL**.
3. Pega la URL de tu Web App y haz clic en **Guardar**. Se recordará automáticamente en tu navegador.

### Opción B: Dejarla fija en el código
En [`index.html`](index.html) y [`tablero.html`](tablero.html), busca la constante:
```javascript
const GOOGLE_SCRIPT_URL = "PEGA_TU_URL_AQUI";
```
Reemplaza el texto con tu URL de Apps Script.

---

## 🖥️ Paso 5: ¿Cómo mostrar el Tablero en Otra Página Web?

Tienes 3 formas sencillas de integrarlo en cualquier sitio web externo:

### 1. Mediante `<iframe>` (Incrustado directo)
Agrega esta línea en el HTML de tu otra página web:
```html
<iframe 
    src="tablero.html" 
    width="100%" 
    height="750px" 
    style="border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</iframe>
```

### 2. Consumiendo los datos en tiempo real con JavaScript (API JSON)
Cualquier página web externa puede consultar los datos en tiempo real mediante `fetch`:
```javascript
// Obtener ranking en tiempo real en formato JSON
fetch('TU_URL_DE_APPS_SCRIPT?action=getScores')
  .then(res => res.json())
  .then(data => {
      console.log("Puntajes en vivo:", data.data);
      // data.data contiene: [{ ranking: 1, jugador: 'Nico', colegio: 'CNB', puntaje: 5400, ... }]
  });
```

### 3. Filtrar por Colegio desde la URL
Puedes consultar el ranking de un colegio específico:
```javascript
fetch('TU_URL_DE_APPS_SCRIPT?action=getScores&colegio=CNB')
```

---

## 🎮 Sistema de Puntuación del Juego
El puntaje final se calcula de forma automática al ganar o perder:
- ⏳ **Supervivencia**: $+50$ puntos por mes gobernado.
- 👥 **Población**: $+100$ puntos por cada habitante vivo al final.
- 🌽 **Alimento**: $+1$ punto por maíz acumulado.
- ☀️ **Fe / Bendición**: $+2$ puntos por bendición solar.
- 🔢 **Sistema de Quipus**: $+300$ puntos de bonificación.
- 💧 **Canales de Riego**: $+300$ puntos de bonificación.
- 🏛️ **Gran Coricancha (Victoria)**: $+2.500$ puntos de bonificación imperial.
