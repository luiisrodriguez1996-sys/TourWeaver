
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Genera metadatos dinámicos basados en el slug de la URL.
 * Permite que cada tour tenga una vista previa personalizada en redes sociales.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Transformamos el slug en un título legible (ej: apto-lujo -> Apto Lujo)
  const displayTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: displayTitle,
    description: `Explora esta propiedad en detalle con nuestro tour virtual 360°. Una experiencia inmersiva exclusiva en Tour Weaver.`,
    openGraph: {
      title: `${displayTitle} | Tour Virtual 360°`,
      description: `Visita esta propiedad desde cualquier lugar del mundo. Haz clic para comenzar la experiencia interactiva.`,
      type: 'website',
      images: [
        {
          // Usamos una imagen de stock inmobiliaria profesional para evitar imágenes aleatorias
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&h=630&auto=format&fit=crop",
          width: 1200,
          height: 630,
          alt: displayTitle,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} | Tour Inmersivo`,
      description: "Explora cada rincón de esta propiedad en 360°.",
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&h=630&auto=format&fit=crop"],
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
