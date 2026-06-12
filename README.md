# PCUrandomizer

Generador de **tripletas aleatorias** tipo ruleta/tragamonedas. Ingresa conceptos en tres
columnas — **Personaje**, **Características** y **Universo** — y la app combina uno de cada
una al azar, con animación de giro vertical.

## Uso

1. En cada columna, escribe un concepto y presiona **Enter** para agregarlo. Puedes agregar
   cantidad ilimitada. Los nombres de varias palabras (ej. *Iron Man*) funcionan.
2. Para quitar un concepto, haz clic en la **×** del chip.
3. **Limpiar listas** borra todos los conceptos de las tres columnas (pide confirmación).
4. Cuando las tres columnas tengan al menos un concepto, se habilita **GO!**.
5. En la vista de ruleta:
   - La flecha **→** genera otra tripleta aleatoria.
   - **Animación: ON/OFF** activa o desactiva el giro vertical.
   - **← Volver** regresa a la entrada sin perder tus listas.

Las listas y la preferencia de animación se guardan en el navegador (localStorage),
así que persisten al recargar.

## Stack

HTML, CSS y JavaScript puro. Sin build, sin dependencias.

## Probar en local

Abre `index.html` directamente en el navegador, o sírvelo con:

```bash
python3 -m http.server
```

y entra a http://localhost:8000.

## Deploy en GitHub Pages

Como son archivos estáticos en la raíz del repo:

1. Sube los cambios a la rama `main`.
2. En GitHub: **Settings → Pages**.
3. En **Source**, elige **Deploy from a branch**.
4. Branch: **`main`**, carpeta **`/ (root)`**. Guarda.
5. A los minutos la app queda publicada en
   `https://<tu-usuario>.github.io/PCUrandomizer/`.
