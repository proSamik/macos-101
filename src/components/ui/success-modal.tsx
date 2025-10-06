"use client"

import React from 'react';
import { Button } from './button';
import { CheckIcon, FolderIcon } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowInFinder: () => void;
  fileName?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  onShowInFinder, 
  fileName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 max-w-sm w-full mx-4"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
            }}
          >
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          Export Complete
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 text-center mb-8">
          {fileName ? `"${fileName}" has been saved successfully.` : 'Your image has been saved successfully.'}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 bg-white/50 border-gray-300/50 hover:bg-white/70"
          >
            Done
          </Button>
          <Button 
            onClick={onShowInFinder}
            className="flex-1 bg-blue-500/90 hover:bg-blue-600/90 text-white flex items-center gap-2"
          >
            <FolderIcon className="w-4 h-4" />
            Show in Finder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;