import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Obtiene los datos de la propiedad directamente de la API REST de Firestore.
 * Esto es necesario porque generateMetadata se ejecuta en el servidor y no podemos 
 * usar el SDK de cliente de Firebase aquí de forma sencilla.
 */
async function getTourData(slug: string) {
  const projectId = "studio-9776081687-fec5d";
  try {
    // 1. Consultar el tourId asociado al slug en el registro de seguridad
    const registryRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/slug_registry/${slug}`,
      { next: { revalidate: 3600 } } // Caché de 1 hora para optimizar rendimiento
    );
    
    if (!registryRes.ok) return null;
    const registryData = await registryRes.json();
    const tourId = registryData.fields?.tourId?.stringValue;
    
    if (!tourId) return null;

    // 2. Obtener los detalles públicos de la propiedad
    const tourRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/tours/${tourId}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!tourRes.ok) return null;
    const tourData = await tourRes.json();
    
    // Verificamos si la propiedad está publicada antes de devolver los datos para SEO
    if (tourData.fields?.published?.booleanValue === false) return null;

    return {
      name: tourData.fields?.name?.stringValue,
      thumbnailUrl: tourData.fields?.thumbnailUrl?.stringValue,
      description: tourData.fields?.description?.stringValue,
    };
  } catch (error) {
    console.error("Error obteniendo metadatos:", error);
    return null;
  }
}

/**
 * Genera metadatos dinámicos basados en la información real de la base de datos.
 * Esto asegura que al compartir en WhatsApp/Twitter se vea el Nombre Real de la casa.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourData(slug);
  
  // Si se encuentra el tour, usamos el formato solicitado. Si no, el texto fijo de fallback.
  const displayTitle = tour?.name 
    ? `${tour.name} | Tour Virtual 360°` 
    : "Propiedad Exclusiva | Experiencia Inmersiva";
  
  const description = tour?.description || "Explora esta propiedad en detalle con nuestro tour virtual 360°. Una experiencia exclusiva en la plataforma Tour Weaver.";
  const image = tour?.thumbnailUrl || `https://placehold.co/1200x630/29ABE2/white?text=Tour+Virtual+360`;

  return {
    title: displayTitle,
    description: description,
    openGraph: {
      title: displayTitle,
      description: description,
      url: `https://tour-weaver.com/tour/${slug}`,
      siteName: "Tour Weaver",
      locale: "es_ES",
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: tour?.name || "Tour Virtual",
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description: description,
      images: [image],
    }
  };
}

export default function TourPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
