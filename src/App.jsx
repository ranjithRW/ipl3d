import React from 'react';
import * as THREE from 'three';

// Create a simpler version using pure Three.js without React Three Fiber
// This avoids the reconciler issues

class ThreeScene extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.setupScene();
    this.startAnimationLoop();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.cancelAnimationFrame(this.requestID);
    this.controls.dispose();
  }

  handleWindowResize = () => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  setupScene = () => {
    this.mount = this.canvasRef.current;
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    // Scene, camera, renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101010);
    this.scene.fog = new THREE.Fog(0x101010, 5, 20);
    
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 2, 5);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.mount.appendChild(this.renderer.domElement);
    
    // OrbitControls
    // Note: We would normally import from 'three/examples/jsm/controls/OrbitControls'
    // but for simplicity we're omitting actual orbit controls in this version
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
    
    // Create the custom model
    this.createCustomModel();
    
    // Add a floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x101018, 
      roughness: 1, 
      metalness: 0 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  };

  createCustomModel = () => {
    // Create a group to hold the model
    this.modelGroup = new THREE.Group();
    
    // Main torus knot
    const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const torusKnotMaterial = new THREE.MeshStandardMaterial({
      color: 0x2194ce,
      metalness: 0.8,
      roughness: 0.2
    });
    const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
    torusKnot.castShadow = true;
    this.modelGroup.add(torusKnot);
    
    // Add orbiting spheres
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 2;
      const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${i * 50}, 100%, 65%)`),
        metalness: 0.5,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * 0.5,
        Math.sin(angle) * radius
      );
      sphere.castShadow = true;
      this.modelGroup.add(sphere);
    }
    
    this.scene.add(this.modelGroup);
  };

  startAnimationLoop = () => {
    // Rotate the model
    if (this.modelGroup) {
      this.modelGroup.rotation.y += 0.005;
    }
    
    this.renderer.render(this.scene, this.camera);
    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  render() {
    return (
      <div className="w-full h-screen bg-gray-900 relative" ref={this.canvasRef}>
        <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
          <p>Scene is rendered using pure Three.js</p>
        </div>
      </div>
    );
  }
}

function App() {
  return <ThreeScene />;
}

export default App;