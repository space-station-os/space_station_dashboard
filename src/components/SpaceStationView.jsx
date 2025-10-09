import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LoaderUtils } from "three";
import { XacroLoader } from "xacro-parser";
import URDFLoader from "urdf-loader";

export default function SpaceStationView() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.01,
      100
    );
    camera.position.set(0, 0.5, 1.2);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 2, 2);
    scene.add(ambientLight, dirLight);

    // --- Grid ---
    const grid = new THREE.GridHelper(2, 20, 0x444444, 0x222222);
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    scene.add(grid);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 5;
    controls.target.set(0, 0, 0);

    // --- Load from Xacro ---
    const xacroUrl = "/models/iss/spacedata_ss.URDF"; // <- your xacro file
    const xacroLoader = new XacroLoader();

    const loadFallbackURDF = () => {
    const urdfLoader = new URDFLoader();
    urdfLoader.packages = { iss: "/models/iss/" };
    urdfLoader.load("/models/iss/spacedata_ss.urdf", (robot) => {
        robot.scale.set(0.001, 0.001, 0.001);
        scene.add(robot);
        console.log("✅ Fallback URDF loaded!");
    });
    };

    xacroLoader.load(
    xacroUrl,
    (xml) => {
        const urdfLoader = new URDFLoader();
        urdfLoader.workingPath = LoaderUtils.extractUrlBase(xacroUrl);
        urdfLoader.packages = { iss: "/models/iss/" };
        const robot = urdfLoader.parse(xml);
        robot.scale.set(0.001, 0.001, 0.001);
        scene.add(robot);
        console.log("✅ ISS XACRO parsed and URDF loaded!");
    },
    undefined,
    (err) => {
        console.error("❌ Failed to load XACRO, trying URDF...", err);
        loadFallbackURDF();
    }
    );

    // --- Animate loop ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Handle resize ---
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#1e1e1e",
      }}
    />
  );
}
