# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

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
