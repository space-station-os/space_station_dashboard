import React, { useState, useEffect } from "react";
import "./index.css";
import EarthOrbitView from "./components/EarthOrbitView";
import SpaceStationView from "./components/SpaceStationView";
import { callService, subscribeTopic, connectToRosBridge } from "./utils/rosbridge";

function App() {
  const [activeView, setActiveView] = useState("earth");
  const [mode, setMode] = useState("CMG");
  const [attitudeStatus, setAttitudeStatus] = useState("Stable");
  const [connected, setConnected] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // ROSBridge setup
  useEffect(() => {
    const ros = connectToRosBridge();

    ros.on("connection", () => {
        console.log("[ROSBridge] Connected");
        setConnected(true);
      });

      ros.on("error", (err) => {
        console.warn("[ROSBridge] Error:", err);
        setConnected(false);
      });

      ros.on("close", () => {
        console.warn("[ROSBridge] Connection closed");
        setConnected(false);
      });

      // Periodic heartbeat check
      const interval = setInterval(() => {
        if (!ros.isConnected) {
          console.warn("[ROSBridge] Lost connection, retrying...");
          try {
            ros.connect("ws://localhost:9090"); // or your configured ROSBridge URL
          } catch (e) {
            console.error("[ROSBridge] Reconnect failed:", e);
          }
        }
      }, 3000);
    
      
    const controlSub = subscribeTopic("/gnc/control_mode", "std_msgs/String", (msg) =>
      setMode(msg.data)
    );
    const attitudeSub = subscribeTopic(
      "/gnc/attitude_LVLH",
      "geometry_msgs/Quaternion",
      () => setAttitudeStatus("Stable")
    );

    return () => {
          controlSub.unsubscribe();
          attitudeSub.unsubscribe();
          clearInterval(interval);
          ros.close();
        };
      }, []);

  // Action button toggle
  const handleToggleView = () => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveView((prev) => (prev === "earth" ? "station" : "earth"));
      setTimeout(() => setTransitioning(false), 500);
    }, 300);
  };

  // Keyboard shortcuts: E = Earth, S = Station
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === "e" && activeView !== "earth") {
        setTransitioning(true);
        setTimeout(() => {
          setActiveView("earth");
          setTimeout(() => setTransitioning(false), 500);
        }, 300);
      } else if (key === "s" && activeView !== "station") {
        setTransitioning(true);
        setTimeout(() => {
          setActiveView("station");
          setTimeout(() => setTransitioning(false), 500);
        }, 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView]);

  const handleModeToggle = async () => {
    const newMode = mode === "CMG" ? "Torque" : "CMG";
    const res = await callService("/gnc/set_mode", { mode: newMode });
    if (res.success) setMode(newMode);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0c10] text-white overflow-hidden relative">
      {/* ================= HEADER ================= */}
      <header className="flex justify-between items-center px-6 py-3 bg-[#0d0f12] border-b border-gray-800 shadow-sm z-50">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img
            src="/SSOSlogo.jpg"
            alt="SSOS Logo"
            className="w-auto h-[26px] object-contain opacity-90"
          />
          <h1 className="text-xl font-semibold tracking-tight">
            GNC <span className="text-blue-400 font-bold">Dashboard</span>
          </h1>
        </div>

        {/* Center: System Status */}
        <div className="flex items-center gap-8 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="material-icons text-green-400 text-base">check_circle</span>
            <span>Attitude:</span>
            <span className="text-green-400 font-medium">{attitudeStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-400 text-base">settings</span>
            <span>Control Mode:</span>
            <span
              className={`font-semibold ${
                mode === "CMG" ? "text-blue-400" : "text-orange-400"
              }`}
            >
              {mode === "CMG" ? "CMG Control" : "Thruster Control"}
            </span>
          </div>
        </div>

        {/* Right: Control Mode Toggle */}
        <button
          onClick={async () => {
            const newMode = mode === "CMG" ? "Thruster" : "CMG";
            const res = await callService("/gnc/set_mode", { mode: newMode });
            if (res.success) setMode(newMode);
          }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-sm 
                    transition-all shadow-sm ${
                      mode === "CMG"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
          title="Toggle between CMG and Thruster Control"
        >
          <span className="material-icons text-white text-base">
            {mode === "CMG" ? "rocket_launch" : "engineering"}
          </span>
          {mode === "CMG" ? "Switch to Thrusters" : "Switch to CMG"}
        </button>
      </header>


      {/* ================= MAIN CONTENT ================= */}
      <main className="relative flex-1 overflow-hidden bg-black">
        {/* Active View */}
        <div
          key={activeView} // key ensures smooth re-render on switch
          className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
            transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {activeView === "earth" ? <EarthOrbitView /> : <SpaceStationView />}
        </div>

        {/* Fade overlay during cinematic switch */}
        {transitioning && (
          <div className="absolute inset-0 bg-black/70 animate-fade z-30" />
        )}
      </main>


      {/* ================= FOOTER ================= */}
      <footer className="p-1.5 text-center text-gray-400 text-[11px] border-t border-gray-800 bg-[#0b0c10] tracking-wide flex justify-center items-center gap-2">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
            connected ? "bg-green-400 shadow-green-400/50 shadow-sm" : "bg-red-500 shadow-red-400/40 shadow-sm"
          }`}
        ></span>
        <span className={`transition-colors ${connected ? "text-green-300" : "text-red-400"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
        <span className="text-gray-500">via</span>
        <span className="text-blue-400 font-medium">ROSBridge WebSocket</span>
      </footer>
    </div>
  );
}

export default App;
