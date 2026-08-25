# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [1.2.1] — 2026-08-25

Auditoría del código reorganizado. Seis defectos encontrados y corregidos; ninguno
afecta al formato de `peliculas.json`.

### Corregido

- Al abrir «Añadir» o «Editar», el foco aterrizaba en el aspa de cerrar en lugar de en el campo de título. En orden de documento el botón de cerrar va antes que el formulario, y el modal enfocaba el primer elemento enfocable sin distinguir.
- Una valoración que no fuera múltiplo de 0.5 en el JSON (un `3.7` escrito a mano) bloqueaba el guardado al editar esa obra: el `step="0.5"` del formulario la rechazaba con un aviso del navegador fácil de pasar por alto. Ahora se ajusta a la rejilla al cargar.
- Dos obras con el mismo `id` en el JSON hacían que editar una reescribiera ambas y que borrar una borrara las dos. Los ids duplicados se reasignan al cargar.
- El recorte de la review a 140 caracteres partía por la mitad los emojis que cayeran justo en el corte y dejaba un símbolo roto. Se recorta por caracteres reales en lugar de por unidades UTF-16.
- La copia local se guardaba solo bajo el nombre del repositorio: cambiar de rama mostraba el catálogo de la rama anterior hasta que respondía la red. La rama pasa a formar parte de la clave.
- Recargar y guardar podían solaparse y dejar el estado a merced de cuál respondiera antes. Ahora solo hay una operación de red en vuelo y el botón de recargar se desactiva mientras dura.
- `og:image` era una ruta relativa a un SVG, así que ningún scraper la resolvía ni la renderizaba. Se añade `assets/brand/social-preview.png` (1200×630) y la etiqueta pasa a URL absoluta, con `og:url` y `twitter:card` de imagen grande.

### Añadido

- Encabezado del README centrado, con el logotipo y el título.

## [1.2.0] — 2026-08-25

### Añadido

- Identidad de marca en `assets/brand/`: isotipo de fotograma y estrella, y logotipo horizontal en variantes para fondo oscuro, fondo claro y una tinta. Las letras son trazados, así que los archivos no dependen de tener Bebas Neue instalada.
- Sección «Marca» en el README con la paleta, las tipografías y el uso de cada archivo.
- Roadmap dividido en v2 y v3. La v2 incorpora la traducción al inglés; la v3 recoge el ejecutable de escritorio y la app móvil.

### Cambiado

- El favicon pasa a ser una versión simplificada del isotipo, sin perforaciones ni borde interior y con la estrella más grande: a 16 píxeles el detalle se dentaba. El isotipo completo queda para 32 píxeles en adelante.
- El icono maskable y `og:image` adoptan la marca nueva.

## [1.1.0] — 2026-08-25

Reorganización del proyecto y corrección de los defectos detectados en la v1.
Sin cambios en el modelo de datos: los `peliculas.json` existentes siguen siendo válidos.

### Añadido

- README con la arquitectura, la guía para forkear y conectar la app, el modelo de datos y el roadmap.
- `LICENSE` (MIT), `CHANGELOG.md`, `.gitignore` y `.nojekyll`.
- Copia local del catálogo en `localStorage`: la app abre con contenido aunque no haya red.
- `site.webmanifest`, favicon e icono maskable: la app se puede instalar en la pantalla de inicio.
- Rama configurable desde Configuración (antes estaba fijada a `main`).
- Metadatos Open Graph, `theme-color` y aviso `<noscript>`.
- Devolución del foco al cerrar un modal y cierre en pila, para que Escape cierre solo el de arriba.
- Soporte de `prefers-reduced-motion`.

### Cambiado

- El código monolítico de `index.html` se reparte en ocho módulos ES bajo `assets/js/`, sin paso de compilación. `github.js`, `catalog.js` y `views.js` ya no tocan el DOM.
- Los estilos propios salen a `assets/css/styles.css`.
- Las opciones del selector de tipo se generan desde `TIPOS` en `config.js`, que pasa a ser la única fuente de verdad.
- Los filtros de valoración pasan de agrupar por parte entera a filtrar por mínimo (`4★+`), con un filtro aparte para el `0★` exacto. Agrupar por parte entera no era un fallo, pero dejaba una consulta natural sin cubrir: "enséñame todo lo que puntué 4 o más".
- Los errores de red devuelven un motivo tipado y el banner explica qué ha pasado: token caducado, repositorio sin acceso, JSON inválido o límite de peticiones.
- El contador de la cabecera refleja el resultado filtrado (`3 de 12 obras`) cuando hay filtros activos.
- Las respuestas 422 de la API se tratan como conflicto, igual que las 409: cubren el caso de escribir sin `sha` sobre un archivo que ya existe.
- Dependencias externas ancladas a una versión concreta; Lucide además con verificación SRI.

### Corregido

- Un fallo de carga ya no muestra el catálogo de demostración como si fueran tus obras. Ahora se muestra la copia local fechada o, si no la hay, un estado vacío explícito.
- El botón de guardar recupera su etiqueta correcta: tras la primera alta, editar una obra ya no dejaba el botón en "Guardar" en vez de "Guardar cambios".
- Un registro sin `titulo` en el JSON ya no rompe el renderizado: todos los campos se normalizan al cargar.
- Un 404 de la API distingue entre archivo inexistente y repositorio sin acceso; antes un token sin permisos parecía un catálogo vacío.
- Se detecta que el archivo supera 1 MB en lugar de fallar al interpretar una respuesta sin contenido.

## [1.0.0] — 2026-08

- Primera versión: catálogo en un único `index.html`, con alta, edición, borrado, filtros por tipo y valoración, búsqueda, y sincronización con GitHub mediante la API de Contents.
