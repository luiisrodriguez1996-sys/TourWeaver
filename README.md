# Tour Weaver v1.5.4

Plataforma profesional para la creación y exhibición de tours virtuales 360°. Unificada con auditoría de seguridad integral, soporte SEO dinámico y compartición inteligente mediante códigos QR.

### Características v1.5.4:
- **Corrección de Gráficos**: Resuelto error tipográfico en la definición de gradientes del dashboard de analíticas que podía causar inconsistencias visuales en el renderizado de gráficos de área.
- **Blindaje de Credenciales (v1.5.3)**: Eliminación total de claves de API hardcodeadas. Uso exclusivo de variables de entorno para máxima seguridad en repositorios públicos.
- **Resiliencia Gráfica**: Manejo de errores de inicialización de WebGL con fallback informativo para dispositivos no compatibles.
- **Optimización de Consultas**: Reglas de Firestore ajustadas para permitir listado de tours públicos (Portfolio) manteniendo el bloqueo de enumeración.
- **Blindaje CSP Estricto**: Eliminación total de `'unsafe-eval'` y endurecimiento de políticas de ejecución de scripts para máxima protección contra XSS.
- **Seguridad Auditada (OWASP ZAP)**: Implementación de cabeceras de seguridad avanzadas (`Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy`, `HSTS`) para protección contra inyección y clickjacking.
- **Privacidad Administrativa**: Ofuscación de errores de autenticación y persistencia de sesión volátil (`browserSessionPersistence`).
- **SEO Inmobiliario Avanzado**: Estructura dinámica de metadatos para previsualizaciones de alta fidelidad en redes sociales.
