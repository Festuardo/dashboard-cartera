# Gestión de Cartera · Fgarcia

Aplicación web instalable para seguimiento de cartera, crecimiento y metas por agencia y asesor.

## Funcionamiento

- Agencia: suma únicamente los créditos registrados en ella.
- Asesor: suma todos sus créditos, incluso los de otras agencias.
- Excluye `Fondo CHN` en `Producto Asignado` de base, cierres y actual.
- Ignora saldos negativos en las sumas de base, cierres y actual. Conserva los desembolsos.
- Filtra asesores por Cod Agencia (1106 → TO06); otros usuarios con desembolsos del mes aparecen al final.
- El total de la tabla corresponde a toda la agencia, independientemente de los asesores visibles.
- Encabezados y primera columna fijos en la tabla de escritorio; tarjetas en móvil.
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

## Actualización de metas e informes (septiembre 2026)

- La base anual sigue siendo 31/12/2025. Un asesor o agencia sin cartera en esa base usa su primer registro con saldo positivo entre los cierres cargados y el corte actual. El primer mes es «Mes base» y se evalúa desde el mes siguiente.
- Para conservar una base histórica definitiva deben cargarse los cierres mensuales, incluido el primer mes del asesor o de la agencia. La cartera actual se identifica como provisional cuando aún no existe su cierre.
- Los asesores ausentes conservan su historial. La agencia se calcula directamente desde su cartera en cada fecha: no se suman bases individuales ni carteras de distintos meses.
- Los nuevos cierres guardan mora real: saldo positivo de créditos con más de 30 días, excluyendo Fondo CHN. Un resumen antiguo sin ese dato muestra un aviso para recargar el cierre, no un cero.
- Excel y PDF respetan agencia, asesor y rango de meses del detalle. El resumen corresponde al corte actual. Las gráficas se incluyen en pantalla y PDF; Excel incluye los datos para graficar.
- Los importes de meta configurados actualmente se aplican al historial; no se mantiene un historial de cambios de meta.

Pruebas de regresión de bases, transferencias, mora y exportación Excel:

```sh
node tests/regression.cjs
```

Las metas del total general suman la meta de cada agencia según sus propios meses evaluados. Las agencias en mes base aportan su cartera al total, sin evaluación de cumplimiento.
