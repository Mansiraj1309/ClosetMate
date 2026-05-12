import React, { useState, useRef } from 'react';
import { Plus, Camera, Shirt, ScanLine, X } from 'lucide-react';
import './FloatingAddButton.css';
import AddItemModal from './AddItemModal';
import ScanTagModal from './ScanTagModal';

const FloatingAddButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showScanTag, setShowScanTag] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const quickCamRef = useRef(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleQuickLog = () => {
        setIsOpen(false);
        // Directly trigger the camera
        if (quickCamRef.current) {
            quickCamRef.current.click();
        }
    };

    const handleQuickFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Open Add Item modal pre-loaded with the captured photo
            setShowAddItem(true);
        }
    };

    const handleScanned = (data) => {
        setScannedData(data);
        setShowScanTag(false);
        setShowAddItem(true);
    };

    const handleCloseAddItem = () => {
        setShowAddItem(false);
        setScannedData(null);
    };

    return (
        <>
            {/* Hidden camera input for Quick Log */}
            <input
                ref={quickCamRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleQuickFile}
                style={{ display: 'none' }}
            />

            <div className={`fab-container ${isOpen ? 'open' : ''}`}>
                <div className="fab-options">
                    <button className="fab-option" onClick={() => { setShowAddItem(true); setIsOpen(false); }}>
                        <span className="fab-label">Add Clothing</span>
                        <div className="fab-icon-inner"><Shirt size={20} /></div>
                    </button>
                    <button className="fab-option" onClick={() => { setShowScanTag(true); setIsOpen(false); }}>
                        <span className="fab-label">Scan Tag</span>
                        <div className="fab-icon-inner"><ScanLine size={20} /></div>
                    </button>
                    <button className="fab-option" onClick={handleQuickLog}>
                        <span className="fab-label">Quick Log</span>
                        <div className="fab-icon-inner"><Camera size={20} /></div>
                    </button>
                </div>
                <button className="fab-main" onClick={toggleMenu}>
                    {isOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            {showAddItem && (
                <AddItemModal 
                    isOpen={showAddItem} 
                    onClose={handleCloseAddItem} 
                    initialData={scannedData}
                />
            )}
            {showScanTag && (
                <ScanTagModal 
                    isOpen={showScanTag} 
                    onClose={() => setShowScanTag(false)} 
                    onScanned={handleScanned}
                />
            )}
        </>
    );
};

export default FloatingAddButton;
