import React from 'react';

export type EditorMode = 'select' | 'draw' | 'delete';

interface ToolbarProps {
    onExportImage: () => void;
    onExportPDF: () => void;
    onShare: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    editorMode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onExportImage,
    onExportPDF,
    onShare,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    editorMode,
    onModeChange
}) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            zIndex: 100
        }}>
            {/* Mode Switcher */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'white',
                padding: '0.5rem',
                borderRadius: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
                <button
                    onClick={() => onModeChange('select')}
                    style={{ ...buttonStyle, background: editorMode === 'select' ? '#e0e0e0' : 'transparent' }}
                >
                    Select
                </button>
                <button
                    onClick={() => onModeChange('draw')}
                    style={{ ...buttonStyle, background: editorMode === 'draw' ? '#e0e0e0' : 'transparent' }}
                >
                    Draw Wall
                </button>
                <button
                    onClick={() => onModeChange('delete')}
                    style={{ ...buttonStyle, background: editorMode === 'delete' ? '#ffebee' : 'transparent', color: editorMode === 'delete' ? 'red' : '#333' }}
                >
                    Delete
                </button>
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                background: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
                <button onClick={onUndo} disabled={!canUndo} style={{ ...buttonStyle, opacity: canUndo ? 1 : 0.5 }}>
                    Undo
                </button>
                <button onClick={onRedo} disabled={!canRedo} style={{ ...buttonStyle, opacity: canRedo ? 1 : 0.5 }}>
                    Redo
                </button>
                <div style={{ width: 1, background: '#ddd', margin: '0 0.5rem' }} />
                <button onClick={onExportImage} style={buttonStyle}>
                    Save Image
                </button>
                <button onClick={onExportPDF} style={buttonStyle}>
                    Save PDF
                </button>
                <button onClick={onShare} style={{ ...buttonStyle, background: '#007bff', color: 'white' }}>
                    Share
                </button>
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: '0.5rem 1rem',
    borderRadius: '16px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'background 0.2s',
    color: '#333' // Ensure text is visible
};

export default Toolbar;
