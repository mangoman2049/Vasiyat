# App Specification: Sketch → Floor Plan → 3D Model Pipeline

## 1) One-sentence pipeline
Upload a sketch → automatic raster cleanup + OCR + ML parsing → vector floorplan → parametric 3D model → optional photoreal renders.

## 2) Digital Representation
- **Input:** raster image (PNG/JPG).  
- **Internal:** cleaned raster + vector (SVG/DXF).  
- **Canonical JSON model:**  
  - Walls  
  - Openings  
  - Rooms  
  - Annotations  
  - Units & scale  

## 3) Sketch → Vector Pipeline
- Preprocess: deskew, denoise, enhance.  
- Detect structures: lines, walls, doors, windows via segmentation + Hough transform.  
- OCR for dimension numbers → infer scale.  
- Raster-to-vector conversion: polylines, merged corners, topology.  
- User corrections: drag/resize walls with constraints.

## 4) Vector → 3D Generation
- Extrude walls with thickness & height.  
- Insert openings (doors/windows).  
- Generate roof, floors, ceilings.  
- Assign materials.  
- Export to **glTF, OBJ, FBX, IFC**.

## 5) Photorealistic Renders (Post-MVP)
- Use **Blender/Cycles** or a cloud renderer.  
- Use **Gemini Nano Banana Pro** for concept images & marketing visuals.

## 6) Use of Gemini / Nano Banana Pro
- Image cleanup, inpainting.  
- Interior/exterior concept generation.  
- Natural-language editing (“make this room bigger”).  

## 7) File Formats
- **Input:** PNG/JPG.  
- **Export:** SVG, DXF, IFC, glTF, OBJ, FBX, .blend.  
- **Internal:** JSON parametric structure.

## 8) Tech Stack
**Frontend:** React, SVG/Canvas editor, three.js.  
**Backend:** Python/Node ML services.  
**ML:** segmentation model, OCR, vectorization.  
**Storage:** S3 + Postgres.

## 9) MVP Features
- Upload + preprocess sketch.  
- Auto wall/door/window detection.  
- OCR-based dimension reading & scaling.  
- Editable vector canvas.  
- Basic 3D extruder + viewer.  
- Save/load projects.

## 10) Post-MVP Features
- Furniture detection.  
- Parametric roof generator.  
- Multi-floor support.  
- High-quality renders.  
- Collab & sharing.

## 11) API Endpoints
- `POST /upload`  
- `POST /process`  
- `GET /project/{id}/vector`  
- `POST /project/{id}/update`  
- `POST /project/{id}/3d/generate`  
- `POST /render`  

## 12) Training Suggestions
- Use public floorplan datasets.  
- Augment with noisy hand-drawn styles.  
- Train/fine-tune OCR for handwritten numbers.  

## 13) Accuracy Metrics
- Vector IoU.  
- Corner error.  
- Dimension accuracy.  
- User-edit rate.  

## 14) Risks
- Messy sketches limit accuracy.  
- Incorrect OCR scale.  
- Legal non-construction disclaimer required.

## 15) Useful Tool References
- Image trace algorithms.  
- Photogrammetry (optional).  

## 16) Recommended First Sprint
1. Upload + preprocess.  
2. Basic vectorization (Hough).  
3. OCR integration.  
4. Constraint editor.  
5. Simple 3D extruder.  
6. ML segmentation improvements.  

## 17) Gemini Usage Summary
- Image enhancement.  
- Marketing renders.  
- Natural-language CAD edits.  
