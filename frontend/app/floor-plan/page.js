/**
 * /floor-plan — Server Component (layout wrapper only)
 *
 * Rules followed:
 *  - No 'use client' (this is a Server Component)
 *  - No hooks of any kind
 *  - Exports Next.js metadata for SEO
 *  - All interactivity delegated to FloorPlanPage (client component)
 *    which wires together the AI Generator Panel + the canvas FloorPlanDesigner.
 */

import FloorPlanPage from '@/components/FloorPlan/FloorPlanPage';

export const metadata = {
  title: 'Floor Plan Designer | BuildCost',
  description:
    'Design your floor plan visually or generate one instantly with AI. ' +
    'Draw rooms, walls, doors and windows — free online construction planning tool by BuildCost.',
};

export default function FloorPlanRoute() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <FloorPlanPage projectName="My Floor Plan" />
    </div>
  );
}
