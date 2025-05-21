import React, { useEffect, useState } from "react";
import WebgiViewer from "./WebgiViewer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const sections = [
  { id: 0, text: "This is the first model paragraph", model: "/model1.glb" },
  { id: 1, text: "This is the second model paragraph", model: "/model2.glb" },
  { id: 2, text: "This is the third model paragraph", model: "/model3.glb" },
];

function App() {
  const [modelPath, setModelPath] = useState("/model1.glb");

  useEffect(() => {
    sections.forEach((section, i) => {
      ScrollTrigger.create({
        trigger: `.section-${i}`,
        start: "top center",
        end: "bottom center",
        onEnter: () => setModelPath(section.model),
        onEnterBack: () => setModelPath(section.model),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="main-container">
      <div className="left">
        {sections.map((section, i) => (
          <p key={section.id} className={`section-${i} para`}>
            {section.text}
          </p>
        ))}
      </div>
      <div className="right">
        <WebgiViewer modelPath={modelPath} />
      </div>
    </div>
  );
}

export default App;
