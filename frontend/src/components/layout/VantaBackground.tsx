import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        VANTA: any;
        THREE: any;
    }
}

export function VantaBackground() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const dark = document.documentElement.classList.contains('dark');
                    if (dark !== isDark) {
                        setIsDark(dark);
                    }
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    }, [isDark]);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initVanta = () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }

            if (window.VANTA && window.THREE && vantaRef.current) {
                try {
                    vantaEffect.current = window.VANTA.NET({
                        el: vantaRef.current,
                        THREE: window.THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        color: isDark ? 0x10b981 : 0x059669,
                        backgroundColor: isDark ? 0x011915 : 0xf9fffe,
                        points: 12.00,
                        maxDistance: 22.00,
                        spacing: 15.00
                    });
                } catch (error) {
                    console.error('Failed to initialize Vanta NET:', error);
                }
            } else {
                retryCount++;
                if (retryCount < maxRetries) setTimeout(initVanta, 200);
            }
        };

        const timeoutId = setTimeout(initVanta, 100);

        return () => {
            clearTimeout(timeoutId);
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, [isDark]);

    return (
        <div
            ref={vantaRef}
            className="fixed inset-0 w-full h-full -z-10 transition-colors duration-500"
            style={{ pointerEvents: 'none' }}
        />
    );
}
