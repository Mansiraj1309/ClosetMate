import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Zap, CheckCircle, Loader, AlertCircle, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';
import API_BASE from '../api';
import './ScanTagModal.css';

const MAPPED_ITEMS = {
    "443111731012": { name: "Lt. Pink Azorte Shirt", brand: "Azorte", color: "Pink", category: "Tops" },
    "AZORTE": { name: "Azorte Fashion Item", brand: "Azorte", color: "Unknown", category: "Tops" }
};

const ScanTagModal = ({ isOpen, onClose, onScanned }) => {
    const [step, setStep] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
    const [scannedItem, setScannedItem] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    useEffect(() => {
        if (isOpen && step === 'idle') {
            startCamera();
        }
        return () => stopCamera();
    }, [isOpen, step]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", true); // Required for iOS
                videoRef.current.play();
                requestRef.current = requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error("Camera access denied", err);
            setErrorMsg("Camera access denied. Please check your settings.");
            setStep('error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                handleCodeFound(code.data);
                return; // Stop loop on success
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    };

    const handleCodeFound = async (data) => {
        setStep('scanning');
        stopCamera();

        // If it's a raw QR/Barcode, we still try to hit the AI for context
        // But the user can also manually trigger a 'Photo Scan' if no QR is found
        processTagImage(null, data);
    };

    const captureAndScan = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            ctx.drawImage(videoRef.current, 0, 0);
            
            const imageBase64 = canvas.toDataURL("image/jpeg", 0.8).split(',')[1];
            processTagImage(imageBase64);
        }
    };

    const processTagImage = async (imageBase64, rawData = null) => {
        setStep('scanning');
        stopCamera();

        try {
            const res = await fetch(`${API_BASE}/api/wardrobe/analyze-tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('closetmate_token')}`,
                },
                body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg', rawData }),
            });

            if (res.ok) {
                const data = await res.json();
                setScannedItem(data);
                setStep('success');
            } else {
                setErrorMsg("Could not read tag. Try a clearer photo.");
                setStep('error');
            }
        } catch (err) {
            setErrorMsg("Network error. Please try again.");
            setStep('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="scan-modal-overlay">
            <div className="scan-modal-content glass-card fadeIn mobile-optimized">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                
                <div className="scan-header">
                    <Zap className="highlight" size={24} />
                    <h2>Smart Tag Scanner</h2>
                </div>

                <div className="camera-viewport">
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {step !== 'success' && step !== 'error' && (
                        <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
                    )}
                    
                    {step === 'idle' && (
                        <div className="scan-overlay">
                            <div className="scan-target-box">
                                <div className="scan-line"></div>
                            </div>
                            <p className="scan-hint">Align QR or any price tag</p>
                            <button className="capture-btn" onClick={captureAndScan}>
                                <Camera size={20} /> Capture Tag
                            </button>
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="scan-processing">
                            <div className="ai-loader">
                                <Loader className="spin" size={40} />
                                <Sparkles className="sparkle-overlay" size={20} />
                            </div>
                            <p>AI is reading your tag...</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="scan-error">
                            <AlertCircle size={48} color="#ef4444" />
                            <p>{errorMsg}</p>
                            <button className="cta-button secondary-btn" onClick={() => setStep('idle')}>Try Again</button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="smart-preview-card animation-fade-in">
                            <div className="preview-header">
                                <div className="detected-badge">✨ Detected Automatically</div>
                                <h3 className="brand-name">{scannedItem.brand || 'New Item'}</h3>
                                <p className="item-name">{scannedItem.name || 'Clothing Item'}</p>
                            </div>

                            <div className="preview-grid">
                                <div className="preview-item">
                                    <span className="label">Price</span>
                                    <span className="value">₹{scannedItem.price || '--'}</span>
                                </div>
                                <div className="preview-item">
                                    <span className="label">Size</span>
                                    <span className="value">{scannedItem.size || '--'}</span>
                                </div>
                                <div className="preview-item">
                                    <span className="label">Style</span>
                                    <span className="value">{scannedItem.style || 'Casual'}</span>
                                </div>
                                <div className="preview-item">
                                    <span className="label">Season</span>
                                    <span className="value">{scannedItem.season || 'Summer'}</span>
                                </div>
                            </div>

                            <div className="preview-actions">
                                <button className="action-btn outline">
                                    Edit Details
                                </button>
                                <button className="action-btn outline">
                                    <Camera size={16} /> Add Photo
                                </button>
                            </div>

                            <button className="cta-button full-width" onClick={() => onScanned(scannedItem)}>
                                Save to Closet
                            </button>
                        </div>
                    )}
                </div>

                <div className="scan-footer">
                    <p>Point at any garment tag to instantly digitize it.</p>
                </div>
            </div>
        </div>
    );
};

export default ScanTagModal;
