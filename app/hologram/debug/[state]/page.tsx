import { HologramShell } from "@/components/hologram/HologramShell";
import { getHologramDebugRoute, hologramDebugRoutes } from "@/components/hologram/debugStateRoutes";
import { hologramStates } from "@/components/hologram/mockData";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return hologramDebugRoutes.map((route) => ({ state: route.slug }));
}

export default function HologramDebugStatePage({ params }: { params: { state: string } }) {
  const route = getHologramDebugRoute(params.state);
  const state = route
    ? hologramStates.find((candidate) => candidate.agentState === route.state)
    : undefined;

  if (!route || !state) notFound();

  return (
    <main className="hologram-root hologram-live-page hologram-state-route-page">
      <div className="hologram-fullscreen">
        <HologramShell
          state={state}
          layout="landscape"
        />
      </div>
    </main>
  );
}
