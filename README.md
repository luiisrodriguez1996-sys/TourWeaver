
# Tour Weaver v1.4.1

Plataforma profesional para la creación y exhibición de tours virtuales 360°. Unificada con auditoría de seguridad integral, soporte SEO dinámico y compartición inteligente mediante códigos QR.

### Características v1.4.1:
- **Seguridad Auditada (OWASP ZAP)**: Implementación de cabeceras de seguridad avanzadas (`Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy`) para protección contra inyección y clickjacking.
- **Optimización de Despliegue**: Configuración nativa de infraestructura mediante `render.yaml` para despliegues atómicos y seguros.
- **SEO Inmobiliario Avanzado**: Los enlaces compartidos muestran la estructura `Nombre de la propiedad | Tour Virtual 360°` con previsualización de imagen real mediante SSR.
- **Personalización de URL**: Capacidad de editar el Slug (identificador) de cada tour directamente desde el panel de detalles con validación automática de unicidad.
- **Integridad Referencial**: Limpieza automática de hotspots huérfanos al eliminar estancias en el editor.
- **Motor de Compresión Adaptativa**: Calidad visual maximizada (hasta 3072px) ajustada automáticamente al límite de 1MB de Firestore.
- **Telemetría de Precisión**: Medición de tiempo de visualización real basada en el estado de visibilidad de la pestaña.
