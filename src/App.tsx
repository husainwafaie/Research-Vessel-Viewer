import { vessel } from '@data/vessel';
import { getAllComponents } from '@domain/selectors';
import { buildMeshRegistry } from '@domain/registry';

// Verify the data layer compiles and is coherent at module load time
const registry = buildMeshRegistry(vessel);
const components = getAllComponents(vessel);

export default function App() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ocean-950 text-ocean-200">
      <div className="max-w-lg space-y-6 p-8 text-center">
        <div className="text-data text-ocean-400 uppercase tracking-widest text-xs">
          Milestone 1.1 — Scaffold
        </div>
        <h1 className="text-2xl font-light tracking-wide text-white">
          R/V Pelagic Horizon
        </h1>
        <p className="text-sm text-ocean-300 leading-relaxed">
          {vessel.description}
        </p>
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="glass rounded-lg p-3">
            <div className="text-data text-ocean-400 text-xs mb-1">Systems</div>
            <div className="text-white text-lg font-light">{vessel.systems.length}</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="text-data text-ocean-400 text-xs mb-1">Components</div>
            <div className="text-white text-lg font-light">{components.length}</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="text-data text-ocean-400 text-xs mb-1">Mesh Bindings</div>
            <div className="text-white text-lg font-light">{registry.size}</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="text-data text-ocean-400 text-xs mb-1">Data Layer</div>
            <div className="text-green-400 text-sm font-light">Verified ✓</div>
          </div>
        </div>
        <div className="space-y-1 text-left">
          {vessel.systems.map((system) => (
            <div key={system.id} className="flex items-center gap-3 text-xs glass-light rounded px-3 py-2">
              <span className="text-ocean-400 text-data w-24 shrink-0">{system.category}</span>
              <span className="text-ocean-200">{system.name}</span>
              <span className="ml-auto text-ocean-500">{system.components.length} components</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
