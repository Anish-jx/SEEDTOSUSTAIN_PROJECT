import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Leaf,
    Cpu,
    Droplets,
    BarChart3,
    Zap,
    Shield,
    ArrowRight,
    CheckCircle2,
    Globe,
    Smartphone,
    Cloud,
    ChevronRight
} from 'lucide-react';
import logo from '@/assets/images/logo.png';

declare global {
    interface Window {
        VANTA: any;
        THREE: any;
    }
}

export function Landing() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);
    const wavesRef = useRef<HTMLDivElement>(null);
    const wavesEffect = useRef<any>(null);
    const topologyRef = useRef<HTMLDivElement>(null);
    const topologyEffect = useRef<any>(null);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initVanta = () => {
            if (vantaEffect.current) return;

            if (window.VANTA && window.THREE && vantaRef.current) {
                try {
                    vantaEffect.current = window.VANTA.RINGS({
                        el: vantaRef.current,
                        THREE: window.THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        backgroundColor: 0x0a0a0a,
                        color: 0x10b981
                    });
                } catch (error) {
                    console.error('Failed to initialize Vanta:', error);
                }
            } else {
                retryCount++;
                if (retryCount < maxRetries) setTimeout(initVanta, 200);
            }
        };

        const initWaves = () => {
            if (wavesEffect.current) return;

            if (window.VANTA && window.THREE && wavesRef.current) {
                try {
                    wavesEffect.current = window.VANTA.WAVES({
                        el: wavesRef.current,
                        THREE: window.THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        color: 0x064e3b,
                        shininess: 30,
                        waveHeight: 12,
                        waveSpeed: 0.8,
                        zoom: 0.75
                    });
                } catch (error) {
                    console.error('Failed to initialize Waves:', error);
                }
            }
        };

        const initTopology = () => {
            if (topologyEffect.current) return;

            if (window.VANTA && topologyRef.current) {
                try {
                    topologyEffect.current = window.VANTA.TOPOLOGY({
                        el: topologyRef.current,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        color: 0x10b981,
                        backgroundColor: 0x0a0a0a
                    });
                } catch (error) {
                    console.error('Failed to initialize Topology:', error);
                }
            }
        };

        setTimeout(initVanta, 100);
        setTimeout(initWaves, 400);
        setTimeout(initTopology, 300);

        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
            if (wavesEffect.current) {
                wavesEffect.current.destroy();
                wavesEffect.current = null;
            }
            if (topologyEffect.current) {
                topologyEffect.current.destroy();
                topologyEffect.current = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={logo} alt="Seed2Sustain" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
                        <span className="text-xl font-bold text-white">Seed2Sustain</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-white/70 hover:text-white font-medium transition-colors">Features</a>
                        <a href="#how-it-works" className="text-white/70 hover:text-white font-medium transition-colors">How It Works</a>
                        <a href="#about" className="text-white/70 hover:text-white font-medium transition-colors">About</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/auth" className="px-5 py-2.5 text-white/80 font-semibold hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/auth" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Vanta Rings */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div ref={vantaRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
                {/* Smooth Fade to Middle Section */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" style={{ zIndex: 2 }} />
                <div className="absolute inset-0 bg-black/20" style={{ zIndex: 1 }} />

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-emerald-400 rounded-full text-sm font-semibold mb-8 border border-emerald-500/30">
                        <Zap size={16} />
                        Smart Home-Grown Sustainability
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                        Greener Balconies,
                        <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                            Better Planet
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto mb-10">
                        Transform your terrace into a high-yield organic garden. Effortless, natural, and climate-positive.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link to="/auth" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all">
                            Start Growing at Home
                            <ArrowRight size={20} />
                        </Link>
                        <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                            Explore Features
                        </a>
                    </div>

                    <div className="flex items-center justify-center gap-8 md:gap-12">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-white">0%</p>
                            <p className="text-sm text-white/60">Pesticides Used</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                            <p className="text-4xl font-bold text-white">100%</p>
                            <p className="text-sm text-white/60">Organic Home-Grown</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                            <p className="text-4xl font-bold text-white">Net-0</p>
                            <p className="text-sm text-white/60">Carbon Impact</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                        <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
                    </div>
                </div>
            </section>

            {/* Middle Sections with Topology Background */}
            <div className="relative">
                <div ref={topologyRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />

                {/* Fade from Hero Section */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none" style={{ zIndex: 2 }} />

                {/* Fade to Waves Section */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" style={{ zIndex: 2 }} />

                {/* Features Section */}
                <section id="features" className="relative py-24 px-6" style={{ zIndex: 10 }}>
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">
                                Every Home is a Green Revolution
                            </h2>
                            <p className="text-xl text-white/60">
                                Effortless terrace farming for a sustainable household and a healthier planet.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: Cpu, title: 'Terrace Optimization', description: 'Maximum yield in minimal space. Perfect for balconies and rooftops.', color: 'from-blue-500 to-blue-600' },
                                { icon: Zap, title: 'Zero-Knowledge Setup', description: 'No green thumb? No problem. Our AI guides you from seed to harvest.', color: 'from-amber-500 to-orange-600' },
                                { icon: BarChart3, title: 'Climate Hero Stats', description: 'See your real impact: CO2 saved, water preserved, and plastic reduced.', color: 'from-purple-500 to-pink-600' },
                                { icon: Shield, title: 'Purely Organic', description: 'Grow without chemicals. Natural, fresh produce right outside your door.', color: 'from-rose-500 to-red-600' },
                                { icon: Cloud, title: 'Family Collaborative', description: 'Connect the whole family to your home garden through our mobile app.', color: 'from-sky-500 to-cyan-600' },
                                { icon: Droplets, title: 'Sustainable Resource Use', description: 'Monitor water and nutrient consumption to ensure zero waste.', color: 'from-emerald-500 to-green-600' },
                            ].map((feature, index) => (
                                <div key={index} className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <feature.icon className="text-white" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="relative py-24 px-6" style={{ zIndex: 10 }}>
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">Get Started in Minutes</h2>
                            <p className="text-xl text-white/60">Simple setup, powerful results.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: '01', title: 'Set Up Your Space', description: 'Place your smart pod on your terrace or balcony. It fits anywhere.' },
                                { step: '02', title: 'Connect to App', description: 'Link your device to see your garden come alive with real-time health data.' },
                                { step: '03', title: 'Harvest & Impact', description: 'Enjoy fresh produce and track the carbon footprint you are offsetting.' }
                            ].map((item, index) => (
                                <div key={index} className="relative">
                                    <div className="text-7xl font-black text-emerald-500/10 absolute -top-2 -left-2">{item.step}</div>
                                    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all">
                                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="relative py-24 px-6" style={{ zIndex: 10 }}>
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-6">
                                    From Terraces to Cities: A Greener Future
                                </h2>
                                <p className="text-lg text-white/60 leading-relaxed mb-6">
                                    Seed2Sustain is on a mission to turn every urban space into a carbon-sequestering garden. By enabling households to grow their own food, we reduce transport emissions and urban heat.
                                </p>

                                <div className="space-y-3">
                                    {[
                                        'Reduce household food footprint by 60%',
                                        'Improve local air quality with urban greenery',
                                        'Educational tool for the next generation',
                                        'Fresh, pesticide-free harvest all year'
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                                            <span className="text-white/80 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                                    <Globe size={32} className="mb-3 text-emerald-400" />
                                    <p className="text-3xl font-bold text-white mb-1">50+</p>
                                    <p className="text-white/60 text-sm">Countries</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                                    <Smartphone size={32} className="mb-3 text-blue-400" />
                                    <p className="text-3xl font-bold text-white mb-1">10K+</p>
                                    <p className="text-white/60 text-sm">Users</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                                    <Cpu size={32} className="mb-3 text-amber-400" />
                                    <p className="text-3xl font-bold text-white mb-1">100K+</p>
                                    <p className="text-white/60 text-sm">Devices</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                                    <Leaf size={32} className="mb-3 text-purple-400" />
                                    <p className="text-3xl font-bold text-white mb-1">1M+</p>
                                    <p className="text-white/60 text-sm">Plants</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* CTA Section with Waves */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div ref={wavesRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
                {/* Fade from Topology Section */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none" style={{ zIndex: 2 }} />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to Be a Home-Grown Hero?
                        </h2>
                        <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                            Join the growing movement of climate-conscious households with Seed2Sustain.
                        </p>
                        <Link to="/auth" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all">
                            Get Started Free
                            <ChevronRight size={24} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer - Dark */}
            <footer className="bg-black/50 backdrop-blur-sm text-white py-16 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <img src={logo} alt="Seed2Sustain" className="w-11 h-11 rounded-xl object-cover" />
                                <span className="text-xl font-bold">Seed2Sustain</span>
                            </div>
                            <p className="text-white/50 text-sm">Empowering households to grow a sustainable future, one balcony at a time.</p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 text-white/90">Product</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                                <li><Link to="/auth" className="hover:text-white transition-colors">Pricing</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 text-white/90">Company</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 text-white/90">Legal</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-12 pt-8">
                        <p className="text-white/40 text-sm">© 2026 Seed2Sustain. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
