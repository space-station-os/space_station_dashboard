import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import URDFLoader from "urdf-loader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export default function EarthWithStationView() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      20000
    );
    camera.position.set(0, 3000, 8000);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if ("outputColorSpace" in renderer)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sunlight = new THREE.DirectionalLight(0xffffff, 2);
    sunlight.position.set(5000, 2000, 5000);
    scene.add(sunlight);

    // --- Starfield background ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 4000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 20000;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- Earth (GLTF model) ---
    const gltfLoader = new GLTFLoader();
    let earth = null;
    gltfLoader.load(
      "/models/earth.glb",
      (gltf) => {
        earth = gltf.scene;
        earth.scale.set(1000, 1000, 1000); // make it planet-sized
        scene.add(earth);
        console.log("✅ Earth loaded");
      },
      undefined,
      (err) => console.error("❌ Earth load error:", err)
    );

    // --- Space Station (URDF model) ---
    const urdfLoader = new URDFLoader();
    urdfLoader.workingPath = "/models/iss/";

    // Register OBJ loader support for meshes
    urdfLoader.loadMeshFunc = (path, manager, onComplete) => {
      const objLoader = new OBJLoader(manager);
      objLoader.load(
        path,
        (obj) => onComplete(obj),
        undefined,
        (err) => {
          console.error("OBJ load error:", err);
          onComplete(null);
        }
      );
    };

    const urdfUrl = "/models/iss/space_data.urdf";
    let station = null;

    urdfLoader.load(
      urdfUrl,
      (robot) => {
        station = robot;
        let meshCount = 0;
        robot.traverse((child) => {
          if (child.isMesh) {
            meshCount++;
            if (!child.material || child.material.transparent) {
              child.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                metalness: 0.3,
                roughness: 0.7,
              });
            }
          }
        });

        console.log(`🛰️ ${meshCount} station meshes found`);
        robot.scale.setScalar(5); // scale up for visibility
        robot.position.set(0, 1500, 3000); // place near Earth
        scene.add(robot);
        console.log("✅ Station loaded and placed in orbit");
      },
      undefined,
      (err) => console.error("❌ URDF load error:", err)
    );

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.minDistance = 1000;
    controls.maxDistance = 15000;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.dampingFactor = 0.04;

    // --- Animation loop ---
    const animate = () => {
      requestAnimationFrame(animate);

      // Earth rotation
      if (earth) earth.rotation.y += 0.0003;

      // Optional small station spin for visual realism
      if (station) station.rotation.y += 0.0005;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize handler ---
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
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
        cursor: "grab",
        backgroundColor: "#000",
      }}
    />
  );
}
