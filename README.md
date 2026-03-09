# Tour Weaver v1.5.6

Plataforma profesional para la creación y exhibición de tours virtuales 360°. Unificada con auditoría de seguridad integral, soporte SEO dinámico y compartición inteligente mediante códigos QR.

### Características v1.5.6:
- **Seguridad de Scripts**: Ampliada la directiva Content-Security-Policy (CSP) para soportar integraciones de Google adicionales requeridas por servicios de análisis y mapas.
- **Consistencia de Datos**: Normalización de esquemas de datos en el entorno de desarrollo para alineación estricta con TypeScript.

### Características v1.5.5:
- **Estabilidad de Consultas**: Optimización de la lógica de carga en el visor público para evitar errores de permisos intermitentes durante la hidratación de la sesión de Firebase.
- **Corrección de Tipado**: Ajustado el manejo de parámetros de URL en el dashboard de analíticas específicas para prevenir fallos de renderizado en producción.
- **Acceso Público Restaurado**: Reglas de seguridad de Firestore refinadas para permitir la búsqueda de tours por slug manteniendo la privacidad absoluta de borradores.
- **Mantenimiento Preventivo (v1.5.4)**: Resuelto error tipográfico en la definición de gradientes de gráficos de área en el dashboard.
- **Blindaje de Credenciales (v1.5.3)**: Eliminación total de claves de API hardcodeadas. Uso exclusivo de variables de entorno para máxima seguridad.
- **Resiliencia Gráfica**: Manejo de errores de inicialización de WebGL con fallback informativo para dispositivos no compatibles.
- **Seguridad Auditada**: Implementación de cabeceras CSP estrictas, HSTS y protección contra clickjacking.
- **SEO Inmobiliario Avanzado**: Estructura dinámica de metadatos para previsualizaciones de alta fidelidad.
