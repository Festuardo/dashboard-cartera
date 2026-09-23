# Gestión de Cartera · Fgarcia

Aplicación web instalable para seguimiento de cartera, crecimiento y metas por agencia y asesor.

## Funcionamiento

- Agencia: suma únicamente los créditos registrados en ella.
- Asesor: suma todos sus créditos, incluso los de otras agencias.
- Excluye `Fondo CHN` en `Producto Asignado` de base, cierres y actual.
- Metas independientes y detalle mensual. Reporte Excel.
- Guardado automático local con IndexedDB y alternativa localStorage.
- Diseño adaptable a teléfono, tablet y computadora.
- PWA con acceso sin conexión después de la primera carga completa.

## Datos

Los archivos de cartera se procesan en el navegador. No se incluyen ni se envían a GitHub. Los datos no se sincronizan entre dispositivos. Cargar nuevamente al pasar del HTML local a la web publicada. No usar navegación privada si se desea conservar los datos. Borrar datos del navegador elimina el guardado local.

## Instalar

Abrir la página HTTPS y usar “Instalar aplicación” en Chrome/Edge. En iPhone/iPad: Safari → Compartir → Agregar a pantalla de inicio. Al ejecutarse como aplicación se oculta el aviso de instalación.

## Desarrollo

Sitio estático sin compilación. Para probar: `python3 -m http.server 8080`. Abrir `http://localhost:8080/`.
GitHub Pages: rama `main`, carpeta raíz. Incrementar la versión de caché en `sw.js` cuando cambien los archivos de la aplicación.

© 2026 Fgarcia. Todos los derechos reservados. Ver LICENSE.txt.
