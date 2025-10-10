import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import URDFLoader from "urdf-loader";

export default function SpaceStationView() {
  const mountRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.01,
      100000
    );
    camera.position.set(0, 200, 400);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    if ("outputColorSpace" in renderer)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(200, 400, 200);
    scene.add(dir);

    // Stars
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          Array.from({ length: 3000 }, () => THREE.MathUtils.randFloatSpread(6000)),
          3
        )
      ),
      new THREE.PointsMaterial({ color: 0xffffff, size: 2 })
    );
    scene.add(stars);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 20000;

    // URDF loader
    const loader = new URDFLoader();
    loader.packages = { iss: "/models/iss/" };
    const urdfUrl = "/models/iss/space_data.urdf";

    const addRobot = (robot) => {
      // Debug traversal
      let meshCount = 0;
      robot.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          if (!child.material || child.material.transparent) {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(Math.random(), Math.random(), Math.random()),
              metalness: 0.3,
              roughness: 0.8,
            });
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      console.log(`🛰️ ${meshCount} meshes found in URDF`);
      scene.add(robot);

      // Compute bounding box only if meshes exist
      const box = new THREE.Box3().setFromObject(robot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      console.log("Bounding box:", size, "center:", center);

      // If size is invalid, abort auto-scale
      if (!isFinite(size.length()) || size.length() < 0.001) {
        console.warn("⚠️ Model has no visible geometry or wrong paths.");
        return;
      }

      // Scale to reasonable range
      const scale = 500 / size.length();
      robot.scale.setScalar(scale);
      robot.position.sub(center.multiplyScalar(scale));

      // Position camera to see full object
      const distance = size.length() * scale * 1.2;
      camera.position.set(distance, distance * 0.6, distance);
      controls.target.set(0, 0, 0);
      controls.update();

      console.log("✅ Visible model added, scale:", scale);
    };

    loader.load(
      urdfUrl,
      (robot) => addRobot(robot),
      undefined,
      (err) => console.error("❌ URDF load error:", err)
    );

    // Animate
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#1a1a1f",
      }}
    />
  );
}
