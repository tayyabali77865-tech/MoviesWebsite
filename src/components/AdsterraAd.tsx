'use client';

import { useEffect } from 'react';

interface AdsterraAdProps {
    /**
     * Position identifier for the ad (e.g., 'header', 'sidebar', 'footer')
     * Used for debugging and tracking
     */
    position?: string;
    /**
     * Additional CSS classes for styling
     */
    className?: string;
}

/**
 * Adsterra Ad Component
 * Loads the Adsterra ad script dynamically
 */
export function AdsterraAd({ position = 'default', className = '' }: AdsterraAdProps) {
    useEffect(() => {
        // Check if script is already loaded
        const scriptId = 'adsterra-script-b170dc07f684b5306b2c5dd4987f6c32';

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://pl28660749.effectivegatecpm.com/b1/70/dc/b170dc07f684b5306b2c5dd4987f6c32.js';
            script.async = true;

            // Optional: Add error handling
            script.onerror = () => {
                console.error('Failed to load Adsterra ad script');
            };

            document.body.appendChild(script);
        }

        // Cleanup: Remove the script when the component unmounts to avoid leakage in SPA navigation
        return () => {
            const script = document.getElementById(scriptId);
            if (script) {
                script.remove();
            }
        };
    }, []);

    return (
        <div
            className={`adsterra-ad-container ${className}`}
            data-ad-position={position}
            style={{ minHeight: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
            {/* Ad will be injected here by Adsterra script */}
        </div>
    );
}
