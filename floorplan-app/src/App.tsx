import { useState, useRef, useEffect } from 'react';
import EditorCanvas from './components/EditorCanvas';
import type { EditorCanvasHandle } from './components/EditorCanvas';
import ImageUpload from './components/ImageUpload';
import Toolbar, { type EditorMode } from './components/Toolbar';
import { exportToImage, exportToPDF, shareImage } from './services/export';
import { useHistory } from './hooks/useHistory';
import type { FloorPlan } from './types';
import './App.css';

const INITIAL_PLAN: FloorPlan = {
  id: '1',
  name: 'New Floorplan',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  scale: { pixelsPerMeter: 50, unit: 'm' },
  corners: {
    'c1': { id: 'c1', x: 100, y: 100, wallIds: ['w1', 'w4'] },
    'c2': { id: 'c2', x: 400, y: 100, wallIds: ['w1', 'w2'] },
    'c3': { id: 'c3', x: 400, y: 400, wallIds: ['w2', 'w3'] },
    'c4': { id: 'c4', x: 100, y: 400, wallIds: ['w3', 'w4'] },
  },
  walls: {
    'w1': { id: 'w1', startCornerId: 'c1', endCornerId: 'c2', thickness: 10, height: 240, type: 'interior' },
    'w2': { id: 'w2', startCornerId: 'c2', endCornerId: 'c3', thickness: 10, height: 240, type: 'interior' },
    'w3': { id: 'w3', startCornerId: 'c3', endCornerId: 'c4', thickness: 10, height: 240, type: 'interior' },
    'w4': { id: 'w4', startCornerId: 'c4', endCornerId: 'c1', thickness: 10, height: 240, type: 'interior' },
  },
  openings: {},
  rooms: {}
};

function App() {
  const { state: plan, set: setPlan, undo, redo, canUndo, canRedo, reset } = useHistory<FloorPlan>(INITIAL_PLAN);
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const canvasRef = useRef<EditorCanvasHandle>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Redo: Ctrl+Y or Cmd+Shift+Z or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Escape: Switch to select mode
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditorMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const handleExportImage = () => {
    const stage = canvasRef.current?.getStage();
    if (stage) exportToImage(stage);
  };

  const handleExportPDF = () => {
    const stage = canvasRef.current?.getStage();
    if (stage) exportToPDF(stage);
  };

  const handleShare = () => {
    const stage = canvasRef.current?.getStage();
    if (stage) shareImage(stage);
  };

  return (
    <div className="app-container">
      <ImageUpload onPlanLoaded={reset} />
      <EditorCanvas
        ref={canvasRef}
        plan={plan}
        onPlanChange={setPlan}
        mode={editorMode}
      />
      <Toolbar
        onExportImage={handleExportImage}
        onExportPDF={handleExportPDF}
        onShare={handleShare}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        editorMode={editorMode}
        onModeChange={setEditorMode}
      />
    </div>
  );
}

export default App;
