# Vistar v1.6.0

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

### Características v1.6.0:
- **Personalización de Interfaz**: Opciones para ocultar cabeceras, selectores de estancias y créditos de plataforma desde el editor.
- **Contacto Inteligente**: El botón de solicitud de información adapta su contenido según las preferencias de visibilidad del tour.
- **Navegación Dinámica**: El selector inferior refleja el nombre real de la estancia actual.
- **Robustez WebGL**: Sistema de detección y manejo de errores gráficos mejorado en el visor 360°.
- **Branding Vistar**: Transición completa de la marca en todas las interfaces públicas y privadas.

### Características v1.5.7:
- **Inmersión Ultra-Wide**: Campo de visión (FOV) ampliado a 120° para una experiencia más inmersiva.
- **CSP Adaptativo**: Políticas de seguridad condicionales para soportar el entorno de desarrollo de Firebase Studio.
- **Estabilidad de Workstations**: Ajuste de puerto 9000 y host 0.0.0.0 para compatibilidad total con contenedores.
- **Corrección de Hidratación**: Cálculo de fechas de analíticas movido al cliente para evitar errores de renderizado.
