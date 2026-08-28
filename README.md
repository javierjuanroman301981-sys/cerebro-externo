# Cerebro Externo · MicroApp

Organización y gestión del día a día para madres con múltiples responsabilidades.
La app delega el esfuerzo de **recordar** en un sistema de alertas flexibles, para
organizar el día sin rigidez ni culpa.

**100% del lado del cliente.** Sin backend, sin base de datos. El progreso de cada
usuaria se guarda en `localStorage` del propio dispositivo.

---

## Cómo ejecutarla

Abre `index.html` en un navegador moderno (Chrome, Edge, Firefox o Safari).

- Doble clic sobre el archivo, **o**
- Para desarrollo, sirve la carpeta con cualquier servidor estático:
  ```
  npx serve .
  # o
  python -m http.server
  ```

No requiere instalación ni conexión (salvo la fuente de Google Fonts, que tiene
alternativa del sistema si no hay red).

---

## Estructura

```
cerebro-externo-mamas/
├── index.html          Estructura y arranque (anti-parpadeo de tema)
├── assets/
│   ├── styles.css      Diseño: tokens de tema, componentes, responsive, animaciones
│   └── app.js          Lógica: estado, router, vistas, alertas, temporizador
└── README.md
```

`app.js` está dividido en secciones numeradas y comentadas (utilidades, estado,
plantillas, notificaciones, motor de alertas, temporizador, vistas, wiring, tema,
sidebar, campana, onboarding y arranque) para que sea fácil de modificar.

---

## Flujo de la usuaria

1. **Pantalla 1 – Nombre.** Pide el nombre con validación. Al entrar saluda:
   *"Bienvenida, Andrea"*.
2. **Pantalla 2 – App con menú lateral izquierdo:**
   - **Inicio** – saludo por hora, KPIs, activación en 3 pasos, resumen del día.
   - **Volcado mental** – suelta todos los pendientes; conviértelos en micro-bloques.
   - **Plantillas** (Paso 1) – importa en 1 clic: *Con bebé*, *Home office*, *Varios hijos*.
   - **Alertas** (Paso 2) – tareas invisibles (agua, medicinas, orden, tiempo propio),
     con frecuencia ajustable y notificaciones del navegador opcionales.
   - **Micro-bloques** (Paso 3) – lista del día + temporizador de 5 min con anillo de progreso.
   - **Progreso** – gráfico de barras de 7 días, dona del día, racha y totales.
   - **Fundamento** – el ebook resumido en 5 capítulos.
   - **Ajustes** – tema, exportar copia de seguridad, reiniciar día, borrar todo.

---

## Funciones incluidas

| Pedido | Estado |
|---|---|
| Menú de navegación lateral izquierdo | ✔ (cajón deslizante en móvil) |
| Información en varias pantallas | ✔ 8 vistas |
| Barra de progreso | ✔ barra del día + anillo + dona + barras |
| Animaciones y transiciones | ✔ (respeta `prefers-reduced-motion`) |
| Gráficos | ✔ SVG (barras 7 días, dona de constancia) |
| Iconos | ✔ set SVG propio de trazo |
| Copiar resultados | ✔ resumen al portapapeles |
| Compartir | ✔ Web Share API con *fallback* a copiar |
| Modo oscuro | ✔ automático / claro / oscuro, sin parpadeo |
| Campana de notificaciones | ✔ con contador y panel |
| Reset | ✔ reiniciar día y borrar todos los datos |
| Guardar respuestas | ✔ `localStorage` (persiste entre sesiones) |
| Validaciones | ✔ nombre, campos de texto, rangos de frecuencia |
| Responsive escritorio/móvil | ✔ 1 columna en móvil, sidebar fijo en escritorio |

---

## Personalización rápida

- **Colores:** variables en `:root` de `styles.css`
  (`--brand`, `--brand-2`, `--cta`, `--coral`, `--bg`…).
- **Plantillas y sus micro-bloques:** objeto `TEMPLATES` en `app.js`.
- **Alertas por defecto:** función `seedAlerts()` en `app.js`.
- **Contenido del ebook:** array `EBOOK` en `app.js`.
- **Menú / vistas:** objeto `ROUTES` y `NAV_ORDER` en `app.js`.

---

## Nota sobre las alertas

Las alertas se disparan **mientras la app está abierta** (no hay backend ni service
worker). Si la usuaria concede permiso, además se muestran como notificaciones del
sistema operativo mientras la pestaña siga viva.

## Requisitos del navegador

Navegador con `structuredClone` y CSS `color-mix` (Chrome/Edge 105+, Firefox 88+,
Safari 15.4+). Todos los navegadores de 2022 en adelante.
