import React, { useState } from 'react';
import { initializeGemini, processFloorplanImage } from '../services/gemini';
import type { FloorPlan } from '../types';

interface ImageUploadProps {
    onPlanLoaded: (plan: FloorPlan) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onPlanLoaded }) => {
    const [apiKey, setApiKey] = useState('');
    const [width, setWidth] = useState('');
    const [unit, setUnit] = useState<'m' | 'ft'>('m');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!apiKey) {
            setError("Please enter a Gemini API Key first.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            initializeGemini(apiKey);
            const realWidth = width ? parseFloat(width) : undefined;
            const plan = await processFloorplanImage(file, realWidth, unit);
            onPlanLoaded(plan);
        } catch (err: any) {
            setError(err.message || "Failed to process image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container" style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h3>New Project</h3>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>API Key:</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                        setApiKey(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="Enter Gemini API Key"
                    style={{ width: '100%', padding: '0.5rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Width:</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="e.g. 10"
                        id="width-input"
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>
                <div style={{ width: '80px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Unit:</label>
                    <select
                        id="unit-input"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as 'm' | 'ft')}
                        style={{ width: '100%', padding: '0.5rem' }}
                    >
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                    </select>
                </div>
            </div>

            <div>
                <label
                    htmlFor="file-upload"
                    style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: '#007bff',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Processing...' : 'Upload / Camera'}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                />
            </div>

            {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        </div>
    );
};

export default ImageUpload;
