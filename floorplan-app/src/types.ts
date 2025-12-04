export interface Corner {
    id: string;
    x: number;
    y: number;
    wallIds: string[];
}

export interface Wall {
    id: string;
    startCornerId: string;
    endCornerId: string;
    thickness: number; // in cm
    height: number;    // in cm (default 240)
    type: 'interior' | 'exterior';
}

export interface Opening {
    id: string;
    wallId: string;
    type: 'door' | 'window' | 'opening';
    distanceFromStart: number;
    width: number;  // in cm
    height: number; // in cm
    properties?: Record<string, any>;
}

export interface Room {
    id: string;
    name: string;
    type: string;
    labelPosition: { x: number, y: number };
}

export interface FloorPlan {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    scale: {
        pixelsPerMeter: number;
        unit: 'm' | 'ft' | 'cm';
    };
    corners: Record<string, Corner>;
    walls: Record<string, Wall>;
    openings: Record<string, Opening>;
    rooms: Record<string, Room>;
}
