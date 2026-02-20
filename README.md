
# Tour Weaver v1.4.0

Plataforma profesional para la creación y exhibición de tours virtuales 360°. Unificada con auditoría de seguridad integral, soporte SEO dinámico y compartición inteligente mediante códigos QR.

### Características v1.4.0:
- **SEO Inmobiliario Avanzado**: Los enlaces compartidos ahora muestran la estructura `Nombre de la propiedad | Tour Virtual 360°` con previsualización de imagen real mediante SSR.
- **Personalización de URL**: Capacidad de editar el Slug (identificador) de cada tour directamente desde el panel de detalles con validación automática de unicidad y actualización atómica del registro.
- **Integridad Referencial**: Limpieza automática de hotspots huérfanos al eliminar estancias en el editor, evitando navegación a pantallas inexistentes.
- **Estado de Guardado Sincronizado**: Activación inmediata del botón de guardado tras operaciones de borrado o cambios de metadatos críticos.
- **Motor de Compresión Adaptativa**: Calidad visual maximizada (hasta 3072px) ajustada automáticamente al límite de 1MB de Firestore mediante reducción incremental de calidad.
- **Telemetría de Precisión**: Medición de tiempo de visualización real basada en el estado de visibilidad de la pestaña (Page Visibility API).
- **Seguridad Auditada**: Registro de unicidad de URLs (Slug Registry) y blindaje de telemetría para evitar manipulaciones de conversión.
- **Herramientas de Venta**: Generación automática de QR para impresión y contacto directo por WhatsApp con mensajes predefinidos.
