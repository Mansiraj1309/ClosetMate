import React, { useState } from 'react';
import { Plus, Camera, Shirt, ScanLine, X } from 'lucide-react';
import './FloatingAddButton.css';
import AddItemModal from './AddItemModal';
import ScanTagModal from './ScanTagModal';

const FloatingAddButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showScanTag, setShowScanTag] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
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
                    <button className="fab-option" onClick={() => { setShowAddItem(true); setIsOpen(false); }}>
                        <span className="fab-label">Quick Log</span>
                        <div className="fab-icon-inner"><Camera size={20} /></div>
                    </button>
                </div>
                <button className="fab-main" onClick={toggleMenu}>
                    {isOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            {showAddItem && <AddItemModal isOpen={showAddItem} onClose={() => setShowAddItem(false)} />}
            {showScanTag && <ScanTagModal isOpen={showScanTag} onClose={() => setShowScanTag(false)} />}
        </>
    );
};

export default FloatingAddButton;
