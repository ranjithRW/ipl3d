import React, { useRef, useEffect, useState } from "react";
import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  BloomPlugin,
  TemporalAAPlugin,
  AnisotropyPlugin,
  GammaCorrectionPlugin,
  addBasePlugins,
} from "webgi";

export default function WebgiViewer({ modelPath }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const assetManagerRef = useRef(null); // ✅ Fix: store reference here
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupViewer = async () => {
      const viewer = new ViewerApp({
        canvas: canvasRef.current,
        useRgbm: true,
      });

      viewerRef.current = viewer;

      // Add all required plugins
      await addBasePlugins(viewer);

      await viewer.addPlugin(GBufferPlugin);
      await viewer.addPlugin(ProgressivePlugin);
      await viewer.addPlugin(TonemapPlugin);
      await viewer.addPlugin(SSRPlugin);
      await viewer.addPlugin(SSAOPlugin);
      await viewer.addPlugin(BloomPlugin);
      await viewer.addPlugin(TemporalAAPlugin);
      await viewer.addPlugin(AnisotropyPlugin);
      await viewer.addPlugin(GammaCorrectionPlugin);

      // ✅ Get the AssetManagerPlugin after addBasePlugins
      const manager = viewer.getPlugin(AssetManagerPlugin);
      assetManagerRef.current = manager;

      viewer.renderer.refreshPipeline();
      setIsReady(true);
    };

    setupViewer();

    return () => {
      viewerRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      if (!viewerRef.current || !isReady || !modelPath) return;

      try {
        const manager = assetManagerRef.current;
        if (!manager) {
          console.error("AssetManagerPlugin not available.");
          return;
        }

        await manager.clear(); // ✅ Will now work
        await manager.load(modelPath);

        const viewer = viewerRef.current;
        const camera = viewer.scene.activeCamera;
        const box = viewer.scene.aabb;
        const center = box.center;
        const size = box.size;
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;

        camera.position.set(center.x, center.y, center.z + distance);
        camera.lookAt(center);
      } catch (err) {
        console.error(`Error loading model: ${modelPath}`, err);
      }
    };

    loadModel();
  }, [modelPath, isReady]);

  return (
    <canvas
      ref={canvasRef}
      className="webgi-canvas"
      style={{ width: "100%", height: "100vh", display: "block" }}
    />
  );
}
