import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import type { FloorPlan, Corner, Wall } from '../types';
import type { EditorMode } from './Toolbar';
import Konva from 'konva';

interface EditorCanvasProps {
    plan: FloorPlan;
    onPlanChange: (newPlan: FloorPlan) => void;
    mode: EditorMode;
}

export interface EditorCanvasHandle {
    getStage: () => Konva.Stage | null;
}

const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(({ plan, onPlanChange, mode }, ref) => {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [drawingStartCornerId, setDrawingStartCornerId] = useState<string | null>(null);
    const [previewPos, setPreviewPos] = useState<{ x: number, y: number } | null>(null);
    const stageRef = useRef<Konva.Stage>(null);

    useImperativeHandle(ref, () => ({
        getStage: () => stageRef.current
    }));

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset drawing state when mode changes
    useEffect(() => {
        setDrawingStartCornerId(null);
        setPreviewPos(null);
    }, [mode]);

    useGesture({
        onDrag: ({ offset: [x, y] }) => {
            if (mode === 'select') {
                setStagePos({ x, y });
            }
        },
        onPinch: ({ offset: [d] }) => {
            setStageScale(d);
        },
    }, {
        target: stageRef as any,
        drag: { from: () => [stagePos.x, stagePos.y], enabled: mode === 'select' },
        pinch: { scaleBounds: { min: 0.5, max: 5 }, modifierKey: null }
    });

    const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const getRelativePointerPosition = () => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;
        const scale = stageScale;
        return {
            x: (pointer.x - stagePos.x) / scale,
            y: (pointer.y - stagePos.y) / scale,
        };
    };

    const handleMouseMove = () => {
        if (mode === 'draw') {
            const pos = getRelativePointerPosition();
            if (pos) setPreviewPos(pos);
        }
    };

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (mode !== 'draw') return;

        // If clicked on an existing shape (handled by its own onClick), ignore
        if (e.target !== stageRef.current) return;

        const pos = getRelativePointerPosition();
        if (!pos) return;

        // Check for snapping to existing corners (within 20px)
        let clickedCornerId: string | null = null;
        const SNAP_DISTANCE = 20 / stageScale;

        for (const corner of Object.values(plan.corners)) {
            if (getDistance(pos, corner) < SNAP_DISTANCE) {
                clickedCornerId = corner.id;
                break;
            }
        }

        if (!clickedCornerId) {
            // Create new corner
            const newCornerId = crypto.randomUUID();
            const newCorner: Corner = {
                id: newCornerId,
                x: pos.x,
                y: pos.y,
                wallIds: []
            };

            const newPlan = {
                ...plan,
                corners: { ...plan.corners, [newCornerId]: newCorner }
            };

            clickedCornerId = newCornerId;
            onPlanChange(newPlan);
        }

        if (drawingStartCornerId) {
            // Finish wall
            if (drawingStartCornerId !== clickedCornerId) {
                const newWallId = crypto.randomUUID();
                const newWall: Wall = {
                    id: newWallId,
                    startCornerId: drawingStartCornerId,
                    endCornerId: clickedCornerId,
                    thickness: 20, // Default 20cm
                    height: 240,
                    type: 'interior'
                };

                // Re-construct the state we want to save
                let nextPlan = { ...plan };

                // If we created a new corner (clickedCornerId was null initially), add it to nextPlan
                if (!plan.corners[clickedCornerId]) {
                    const newCorner: Corner = {
                        id: clickedCornerId,
                        x: pos.x,
                        y: pos.y,
                        wallIds: []
                    };
                    nextPlan.corners[clickedCornerId] = newCorner;
                }

                // Add wall
                nextPlan.walls[newWallId] = newWall;

                // Link wall to corners
                if (nextPlan.corners[drawingStartCornerId]) {
                    nextPlan.corners[drawingStartCornerId] = {
                        ...nextPlan.corners[drawingStartCornerId],
                        wallIds: [...nextPlan.corners[drawingStartCornerId].wallIds, newWallId]
                    };
                }

                if (nextPlan.corners[clickedCornerId]) {
                    nextPlan.corners[clickedCornerId] = {
                        ...nextPlan.corners[clickedCornerId],
                        wallIds: [...nextPlan.corners[clickedCornerId].wallIds, newWallId]
                    };
                }

                onPlanChange(nextPlan);
                setDrawingStartCornerId(clickedCornerId); // Continue drawing from end
            }
        } else {
            // Start drawing
            setDrawingStartCornerId(clickedCornerId);
        }
    };

    const handleCornerClick = (cornerId: string) => {
        if (mode === 'draw') {
            if (drawingStartCornerId) {
                // Finish wall to this existing corner
                if (drawingStartCornerId !== cornerId) {
                    const newWallId = crypto.randomUUID();
                    const newWall: Wall = {
                        id: newWallId,
                        startCornerId: drawingStartCornerId,
                        endCornerId: cornerId,
                        thickness: 20,
                        height: 240,
                        type: 'interior'
                    };

                    const nextPlan = { ...plan };
                    nextPlan.walls[newWallId] = newWall;

                    nextPlan.corners[drawingStartCornerId] = {
                        ...nextPlan.corners[drawingStartCornerId],
                        wallIds: [...nextPlan.corners[drawingStartCornerId].wallIds, newWallId]
                    };
                    nextPlan.corners[cornerId] = {
                        ...nextPlan.corners[cornerId],
                        wallIds: [...nextPlan.corners[cornerId].wallIds, newWallId]
                    };

                    onPlanChange(nextPlan);
                    setDrawingStartCornerId(cornerId);
                }
            } else {
                setDrawingStartCornerId(cornerId);
            }
        } else if (mode === 'delete') {
            // Delete corner and connected walls
            const nextPlan = { ...plan };
            const corner = nextPlan.corners[cornerId];

            if (corner) {
                // Remove connected walls
                corner.wallIds.forEach(wallId => {
                    delete nextPlan.walls[wallId];
                });

                delete nextPlan.corners[cornerId];

                // Cleanup: Remove deleted wall IDs from all other corners
                Object.keys(nextPlan.corners).forEach(cId => {
                    nextPlan.corners[cId].wallIds = nextPlan.corners[cId].wallIds.filter(wId => nextPlan.walls[wId]);
                });

                onPlanChange(nextPlan);
            }
        }
    };

    const handleWallClick = (wallId: string) => {
        if (mode === 'delete') {
            const nextPlan = { ...plan };
            delete nextPlan.walls[wallId];

            // Cleanup: Remove wall ID from corners
            Object.keys(nextPlan.corners).forEach(cId => {
                nextPlan.corners[cId].wallIds = nextPlan.corners[cId].wallIds.filter(wId => wId !== wallId);
            });

            onPlanChange(nextPlan);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', touchAction: 'none', background: '#1a1a1a' }}>
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                draggable={mode === 'select'} // Only pan in select mode
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                ref={stageRef}
                onClick={handleStageClick}
                onTap={handleStageClick}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onWheel={(e) => {
                    e.evt.preventDefault();
                    const scaleBy = 1.1;
                    const oldScale = stageScale;
                    const pointer = stageRef.current?.getPointerPosition();
                    if (!pointer) return;

                    const mousePointTo = {
                        x: (pointer.x - stagePos.x) / oldScale,
                        y: (pointer.y - stagePos.y) / oldScale,
                    };

                    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
                    setStageScale(newScale);

                    const newPos = {
                        x: pointer.x - mousePointTo.x * newScale,
                        y: pointer.y - mousePointTo.y * newScale,
                    };
                    setStagePos(newPos);
                }}
            >
                <Layer>
                    {/* Instruction Text */}
                    {mode === 'draw' && (
                        <Text
                            x={20}
                            y={20}
                            text="Click to add corners. Press ESC to stop."
                            fontSize={16}
                            fill="white"
                            padding={10}
                            listening={false}
                        />
                    )}

                    {/* Render Walls */}
                    {Object.values(plan.walls).map((wall) => {
                        const start = plan.corners[wall.startCornerId];
                        const end = plan.corners[wall.endCornerId];
                        if (!start || !end) return null;

                        const lengthPx = getDistance(start, end);
                        const lengthM = lengthPx / plan.scale.pixelsPerMeter;
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;

                        const strokeWidth = Math.max(
                            (wall.thickness / 100) * plan.scale.pixelsPerMeter,
                            2
                        );

                        return (
                            <Group
                                key={wall.id}
                                onClick={() => handleWallClick(wall.id)}
                                onTap={() => handleWallClick(wall.id)}
                            >
                                <Line
                                    points={[start.x, start.y, end.x, end.y]}
                                    stroke={mode === 'delete' ? '#ff4444' : "white"}
                                    strokeWidth={strokeWidth}
                                    lineCap="round"
                                    lineJoin="round"
                                    hitStrokeWidth={20} // Easier to click
                                />
                                <Text
                                    x={midX}
                                    y={midY}
                                    text={`${lengthM.toFixed(2)} ${plan.scale.unit}`}
                                    fontSize={12}
                                    fill="#aaa"
                                    offsetX={20}
                                    offsetY={10}
                                />
                            </Group>
                        );
                    })}

                    {/* Render Rooms */}
                    {Object.values(plan.rooms).map((room) => (
                        <Text
                            key={room.id}
                            x={room.labelPosition.x}
                            y={room.labelPosition.y}
                            text={room.name}
                            fontSize={16}
                            fill="white"
                            fontStyle="bold"
                            offsetX={room.name.length * 4}
                            offsetY={8}
                        />
                    ))}

                    {/* Draw Preview Line */}
                    {mode === 'draw' && drawingStartCornerId && plan.corners[drawingStartCornerId] && previewPos && (() => {
                        const start = plan.corners[drawingStartCornerId];
                        return (
                            <Line
                                points={[start.x, start.y, previewPos.x, previewPos.y]}
                                stroke="#00ff00"
                                strokeWidth={2}
                                dash={[10, 5]}
                            />
                        );
                    })()}

                    {/* Render Corners */}
                    {Object.values(plan.corners).map((corner) => (
                        <Circle
                            key={corner.id}
                            x={corner.x}
                            y={corner.y}
                            radius={mode === 'draw' && drawingStartCornerId === corner.id ? 10 : 6}
                            fill={mode === 'delete' ? '#ff4444' : (mode === 'draw' && drawingStartCornerId === corner.id ? '#00ff00' : "#007bff")}
                            stroke="white"
                            strokeWidth={2}
                            draggable={mode === 'select'}
                            onClick={() => handleCornerClick(corner.id)}
                            onTap={() => handleCornerClick(corner.id)}
                            onDragMove={(e) => {
                                if (mode !== 'select') return;
                                const newX = e.target.x();
                                const newY = e.target.y();
                                onPlanChange({
                                    ...plan,
                                    corners: {
                                        ...plan.corners,
                                        [corner.id]: { ...corner, x: newX, y: newY }
                                    }
                                });
                            }}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
});

export default EditorCanvas;
