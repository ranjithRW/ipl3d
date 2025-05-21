import React from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class ThreeScene extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      loading: true,
      modelLoaded: false,
      error: null
    };
  }

  componentDidMount() {
    this.setupScene();
    this.startAnimationLoop();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.cancelAnimationFrame(this.requestID);
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      this.renderer.dispose();
    }
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

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.mount.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Lights
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Directional main light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-10, 8, -10);
    this.scene.add(fillLight);

    // Rim light for highlighting edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -5, 0);
    this.scene.add(rimLight);

    // Grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
    this.scene.add(gridHelper);

    // Load GLB Model
    this.loadGLBModel();
  };

  loadGLBModel = () => {
    this.setState({ loading: true });
    const loader = new GLTFLoader();

    // Create a loading box as placeholder
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
    this.loadingBox = new THREE.Mesh(geometry, material);
    this.scene.add(this.loadingBox);

    loader.load(
      '/model3.glb', // Model path - ensure it's in the public folder
      (gltf) => {
        this.scene.remove(this.loadingBox);
        
        this.model = gltf.scene;
        
        // Apply shadows and materials to all meshes
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Improve material if needed
            if (child.material) {
              child.material.metalness = 0.4;
              child.material.roughness = 0.6;
            }
          }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Reset the model position to the center
        this.model.position.x = -center.x;
        this.model.position.y = -center.y;
        this.model.position.z = -center.z;

        // Scale the model to fit within a standard size if it's too big or small
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 5) {
          const scale = 5 / maxDim;
          this.model.scale.set(scale, scale, scale);
        } else if (maxDim < 1) {
          const scale = 3 / maxDim;
          this.model.scale.set(scale, scale, scale);
        }

        // Add the model to the scene
        this.scene.add(this.model);
        
        // Adjust camera and controls to focus on the model
        const boundingBox = new THREE.Box3().setFromObject(this.model);
      
        
        // Update controls target to center of model
        this.controls.target.copy(center);
        
        // Position camera to see the whole model
        const maxDimension = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraDistance = maxDimension / (2 * Math.tan(fov / 2));
        
        // Add some extra distance for comfort
        cameraDistance *= 1.5;
        
        // Set camera position
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.multiplyScalar(-1);
        
        const position = center.clone().add(
          direction.multiplyScalar(cameraDistance)
        );
        
        this.camera.position.copy(position);
        this.camera.lookAt(center);
        
        this.setState({ loading: false, modelLoaded: true });
      },
      // Progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(`Loading model: ${Math.round(percentComplete)}% complete`);
        
        // Make the loading box pulse to indicate loading progress
        if (this.loadingBox) {
          const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
          this.loadingBox.scale.set(scale, scale, scale);
        }
      },
      // Error callback
      (error) => {
        console.error('Error loading model:', error);
        this.setState({ loading: false, error: 'Failed to load model' });
      }
    );
  };

  startAnimationLoop = () => {
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Make loading box rotate if it exists
    if (this.loadingBox) {
      this.loadingBox.rotation.x += 0.01;
      this.loadingBox.rotation.y += 0.02;
    }

    this.renderer.render(this.scene, this.camera);
    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  render() {
    return (
      <div className="w-full h-screen bg-gray-900 relative" ref={this.canvasRef}>
        {this.state.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg">
              Loading model...
            </div>
          </div>
        )}
        
        {this.state.error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-900 bg-opacity-90 text-white px-6 py-3 rounded-lg">
              {this.state.error}
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-70 p-3 rounded">
          <p>Drag to rotate | Scroll to zoom | Right-drag to pan</p>
        </div>
      </div>
    );
  }
}

function App() {
  return <ThreeScene />;
}

export default App;