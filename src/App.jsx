import React, { useState } from "react";
import "./index.css";
import EarthOrbitView from "./components/EarthOrbitView";
import SpaceStationView from "./components/SpaceStationView";

function App() {
  const [view, setView] = useState("earth");

  return (
    <div className="flex flex-col h-screen bg-[#0b0c10] text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-3 bg-[#14161a] border-b border-gray-700">
        <div className="text-2xl font-semibold">GNC Dashboard</div>
        <div className="text-sm text-gray-300">
          Attitude: <span className="text-green-400">Stable</span> | Mode:
          <span className="text-blue-400"> CMG</span>
        </div>
      </header>

      {/* View toggle */}
      <div className="flex justify-center gap-4 py-3 bg-[#14161a] border-b border-gray-700">
        <button
          className={`px-4 py-2 rounded ${
            view === "station"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setView("station")}
        >
          Space Station View
        </button>
        <button
          className={`px-4 py-2 rounded ${
            view === "earth"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setView("earth")}
        >
          Earth Orbit View
        </button>
      </div>

      {/* Main content */}
      <main className="grid grid-cols-[1fr_16rem] flex-1 h-full overflow-hidden">
        {/* Visualization area */}
        <div className="relative h-full w-full">
          {view === "station" ? <SpaceStationView /> : <EarthOrbitView />}
        </div>

        {/* Subsystem panel */}
        <aside className="bg-[#14161a] border-l border-gray-700 p-4 text-sm overflow-y-auto">
          <h3 className="text-lg mb-3">Subsystem Status</h3>
          <ul className="space-y-2">
            <li>
              Attitude Control:{" "}
              <span className="text-green-400">Nominal</span>
            </li>
            <li>
              Power System: <span className="text-green-400">Nominal</span>
            </li>
            <li>
              Thermal: <span className="text-green-400">Nominal</span>
            </li>
          </ul>
        </aside>
      </main>

      {/* Footer */}
      <footer className="p-2 text-center text-gray-400 text-xs border-t border-gray-700">
        Connected via ROSBridge WebSocket
      </footer>
    </div>
  );
}

export default App;
