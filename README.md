# Tour Weaver v1.5.6

Plataforma profesional para la creación y exhibición de tours virtuales 360°. Unificada con auditoría de seguridad integral, soporte SEO dinámico y compartición inteligente mediante códigos QR.

### Arquitectura del Proyecto:
```text
/ (Raíz)
├── docs/
│   └── backend.json              # Blueprint de datos y Firestore
├── src/
│   ├── ai/                       # IA con Genkit y Gemini
│   ├── app/                      # Rutas de Next.js (Admin, Visor, Auth)
│   ├── components/               # Componentes Shadcn UI y Visor 360°
│   ├── firebase/                 # SDK, Hooks y Persistencia Local
│   ├── lib/                      # Tipos TS y Utilidades
│   └── hooks/                    # Hooks de UI
├── firestore.rules               # Seguridad de Base de Datos
└── next.config.ts                # CSP y Configuración de Red
```

### Características v1.5.6:
- **Seguridad de Scripts**: Ampliada la directiva Content-Security-Policy (CSP) para soportar dominios de Google necesarios para reCAPTCHA y Analytics.
- **Persistencia Mejorada**: Implementada `browserLocalPersistence` para mantener las sesiones administrativas activas.
- **Consistencia de Datos**: Normalización de esquemas en `mock-data.ts` para alineación estricta con TypeScript.

### Características v1.5.5:
- **Estabilidad de Consultas**: Optimización de la carga en el visor público para evitar errores de permisos intermitentes.
- **Corrección de Tipado**: Ajustado el manejo de parámetros de URL en el dashboard de analíticas.
- **Acceso Público Restaurado**: Reglas de seguridad refinadas para permitir búsquedas por slug en modo público.
