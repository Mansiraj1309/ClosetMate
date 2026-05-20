import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Zap, CheckCircle, Loader, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import API_BASE from '../api';
import './ScanTagModal.css';

// ✅ REMOVED: jsQR and hardcoded MAPPED_ITEMS — not needed, AI handles everything

const ScanTagModal = ({ isOpen, onClose, onScanned, token }) => {
    // ✅ FIXED: accept token as prop (was reading from localStorage directly which is unreliable)
    const [step, setStep] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
    const [scannedItem, setScannedItem] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null); // ✅ FIXED: track stream separately for reliable cleanup

    useEffect(() => {
        if (isOpen) {
            setStep('idle');
            setScannedItem(null);
            setErrorMsg('');
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', true);
                await videoRef.current.play();
            }
        } catch (err) {
            console.error('Camera access denied', err);
            setErrorMsg('Camera access denied. Please allow camera permission in your browser settings and try again.');
            setStep('error');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // ✅ FIXED: captureAndScan now properly captures from video and sends to API
    const captureAndScan = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // ✅ FIXED: must check video is actually playing
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
            setErrorMsg('Camera not ready yet. Please wait a moment and try again.');
            setStep('error');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // ✅ FIXED: use better quality for AI reading
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];

        stopCamera();
        processTagImage(imageBase64);
    };

    const processTagImage = async (imageBase64) => {
        setStep('scanning');

        // ✅ FIXED: use token prop, not localStorage (more reliable + works with auth context)
        const authToken = token || localStorage.getItem('closetmate_token');

        if (!authToken) {
            setErrorMsg('Authentication error. Please log in again.');
            setStep('error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/wardrobe/analyze-tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    imageBase64,
                    mimeType: 'image/jpeg',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setScannedItem(data);
                setStep('success');
            } else {
                const err = await res.json();
                setErrorMsg(err.message || 'Could not read tag. Try a clearer, well-lit photo.');
                setStep('error');
            }
        } catch (err) {
            console.error('Tag scan error:', err);
            setErrorMsg('Network error. Please check your connection and try again.');
            setStep('error');
        }
    };

    const handleRetry = () => {
        setStep('idle');
        setScannedItem(null);
        setErrorMsg('');
        startCamera();
    };

    // ✅ FIXED: onScanned passes all fields correctly so AddItemModal can pre-fill them
    const handleSaveToCloset = () => {
        if (!scannedItem) return;
        onScanned({
            name: scannedItem.name || '',
            brand: scannedItem.brand || '',
            size: scannedItem.size || '',
            price: scannedItem.price || '',
            color: scannedItem.color || '',
            category: scannedItem.category || 'Tops',
            type: scannedItem.type || '',
            style: scannedItem.style || '',
            season: scannedItem.season || 'All Season',
            formality: scannedItem.formality || 'Casual',
            occasions: scannedItem.occasions || [],
            fabric: scannedItem.fabric || '',
            articleId: scannedItem.articleId || '',
        });
        onClose();
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
                    {/* ✅ Canvas always in DOM for capture, hidden */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Camera feed — shown when idle */}
                    {(step === 'idle') && (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
                            <div className="scan-overlay">
                                <div className="scan-target-box">
                                    <div className="scan-line"></div>
                                </div>
                                <p className="scan-hint">Point camera at any garment tag, then tap Capture</p>
                                <button className="capture-btn" onClick={captureAndScan}>
                                    <Camera size={20} /> Capture Tag
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'scanning' && (
                        <div className="scan-processing">
                            <div className="ai-loader">
                                <Loader className="spin" size={40} />
                                <Sparkles className="sparkle-overlay" size={20} />
                            </div>
                            <p>AI is reading your tag…</p>
                            <p className="scan-hint-small">This takes 3–5 seconds</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="scan-error">
                            <AlertCircle size={48} color="#ef4444" />
                            <p>{errorMsg}</p>
                            <button className="cta-button" onClick={handleRetry}>
                                <RefreshCw size={16} /> Try Again
                            </button>
                        </div>
                    )}
                </div>

                {step === 'success' && scannedItem && (
                    <div className="smart-preview-card animation-fade-in">
                        <div className="preview-header">
                            <div className="detected-badge">✨ Detected Automatically</div>
                            <h3 className="brand-name">{scannedItem.brand || 'Unknown Brand'}</h3>
                            <p className="item-name">{scannedItem.name || 'Clothing Item'}</p>
                            {scannedItem.articleId && (
                                <p className="article-id">Article: {scannedItem.articleId}</p>
                            )}
                        </div>

                        <div className="preview-grid">
                            <div className="preview-item">
                                <span className="label">Price</span>
                                <span className="value">
                                    {scannedItem.price
                                        ? `${scannedItem.currency === 'USD' ? '$' : '₹'}${scannedItem.price}`
                                        : '--'}
                                </span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Size</span>
                                <span className="value">{scannedItem.size || '--'}</span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Color</span>
                                <span className="value">{scannedItem.color || '--'}</span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Category</span>
                                <span className="value">{scannedItem.category || '--'}</span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Style</span>
                                <span className="value">{scannedItem.style || '--'}</span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Season</span>
                                <span className="value">{scannedItem.season || '--'}</span>
                            </div>
                        </div>

                        {scannedItem.fabric && (
                            <p className="fabric-info">🧵 {scannedItem.fabric}</p>
                        )}

                        <div className="preview-actions">
                            <button className="action-btn outline" onClick={handleRetry}>
                                <RefreshCw size={14} /> Scan Again
                            </button>
                        </div>

                        <button className="cta-button full-width" onClick={handleSaveToCloset}>
                            ✅ Save to Closet
                        </button>
                    </div>
                )}

                {step !== 'success' && (
                    <div className="scan-footer">
                        <p>Point camera at any garment tag to instantly digitize it.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanTagModal;
