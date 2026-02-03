# **App Name**: Tour Weaver

## Core Features:

- Secure Admin Login: Firebase Authentication (email/password) for admin login.
- Tour Management: Create, edit, publish/unpublish, and delete tours via the admin dashboard. Secure access based on Firebase Authentication.
- 360° Image Upload: Upload 360° equirectangular images (JPG, 2:1 aspect ratio, 6000x3000 recommended) to Firebase Storage. The system will derive the storage URL.
- Hotspot Editor: Visually define and edit hotspots (yaw/pitch, targetSceneId, label) within the admin interface. Hotspots must be positioned visually over the corresponding location. Hotspots use yaw and pitch values that match the real orientation. Hotspots clearly indicate direction of movement (forward navigation).
- Floor Plan Integration: Optionally upload a 2D floor plan image (JPG or PNG) to Firebase Storage and associate it with a tour. Display floorplan on tour page.
- Tour Publishing & Sharing: Publish tours to make them publicly accessible via a unique URL (/tour/{slug}). Only published tours are visible to the public. Admins will generate and display public URL based on slug.
- AI-Powered Suggestion Tool for Scene Linking: The tour editing interface will feature a tool, which suggests optimal connections between the scene, simplifying and speeding up tour creation.
- Spatial Navigation: Navigation between scenes must be performed using contextual hotspots placed on real-world elements. Hotspots must be clearly visible and easily detectable on both desktop and mobile devices. Touch-friendly hotspot size on mobile. Visual feedback on hover/tap (animation or highlight). Smooth scene transitions (fade or subtle zoom). No abrupt scene cuts.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2), evocative of clear skies and open spaces, suitable for virtual tours.
- Background color: Light gray (#F0F4F7), a desaturated tone of the primary blue, providing a neutral backdrop for immersive content.
- Accent color: A complementary orange (#F2994A), for call-to-action elements and interactive components, ensuring prominence against the primary color.
- Body and headline font: 'Inter', a sans-serif typeface providing a clean, modern appearance, ideal for UI elements and longer text blocks alike.
- Use clean, simple icons to represent navigation and interactive elements.
- Responsive, mobile-first layout ensuring a seamless experience across devices.
- Subtle transitions and animations for scene navigation and hotspot interactions.