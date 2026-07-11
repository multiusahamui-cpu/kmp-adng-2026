
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { User, AppRoute } from '../types';
import { MapPin, Navigation, ArrowLeft, RefreshCw, ShoppingBag, Loader2 } from 'lucide-react';
import api from '../services/api';

// --- Custom Icons ---
const UserIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md animate-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const TraderIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="relative"><div class="w-8 h-8 bg-white rounded-full border-2 border-red-600 shadow-lg flex items-center justify-center text-xs font-bold text-red-600">🏪</div><div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600"></div></div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
});

interface FoodStreetTrackerProps {
    user: User;
    allUsers: User[]; // Legacy prop, unused now as we fetch live
    onNavigate: (route: AppRoute) => void;
}

export const FoodStreetTracker: React.FC<FoodStreetTrackerProps> = ({ onNavigate }) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    
    const [activeTraders, setActiveTraders] = useState<any[]>([]);
    const [selectedTrader, setSelectedTrader] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([-6.2088, 106.8456], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Layer Group for easy clear
        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // Initial Location
        locateUser();
        
        // Initial Fetch
        fetchNearbyTraders();

        // Polling setiap 30 detik
        const interval = setInterval(fetchNearbyTraders, 30000);
        return () => clearInterval(interval);
    }, []);

    const locateUser = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
                    if (mapRef.current) {
                        mapRef.current.flyTo(latlng, 15);
                        if (userMarkerRef.current) userMarkerRef.current.remove();
                        userMarkerRef.current = L.marker(latlng, { icon: UserIcon }).addTo(mapRef.current).bindPopup("Lokasi Anda");
                    }
                },
                (err) => console.warn("GPS Error", err)
            );
        }
    };

    const fetchNearbyTraders = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/trader/nearby');
            const traders = res.data.data;
            setActiveTraders(traders);
            updateMapMarkers(traders);
        } catch (error) {
            console.error("Failed to fetch traders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateMapMarkers = (traders: any[]) => {
        if (!mapRef.current || !markersLayerRef.current) return;
        
        markersLayerRef.current.clearLayers(); // Clear old markers

        traders.forEach(trader => {
            if (trader.latitude && trader.longitude) {
                const latlng = new L.LatLng(parseFloat(trader.latitude), parseFloat(trader.longitude));
                
                const marker = L.marker(latlng, { icon: TraderIcon })
                    .bindPopup(`
                        <div class="text-center">
                            <h3 class="font-bold text-sm">${trader.tradeName}</h3>
                            <p class="text-xs text-gray-500">${trader.category}</p>
                        </div>
                    `)
                    .on('click', () => {
                        setSelectedTrader(trader);
                        mapRef.current?.flyTo(latlng, 17);
                    });
                
                markersLayerRef.current?.addLayer(marker);
            }
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] relative bg-slate-100">
            {/* Map Container */}
            <div className="flex-1 relative z-0">
                <div ref={mapContainerRef} className="h-full w-full" />
                
                {/* Controls Overlay */}
                <div className="absolute top-4 left-4 right-4 z-[500] flex justify-between items-start pointer-events-none">
                    <button 
                        onClick={() => onNavigate(AppRoute.DASHBOARD)}
                        className="bg-white p-3 rounded-full shadow-lg text-slate-700 hover:text-emerald-600 pointer-events-auto"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <button 
                        onClick={() => { locateUser(); fetchNearbyTraders(); }}
                        className="bg-white p-3 rounded-full shadow-lg text-blue-600 pointer-events-auto hover:bg-blue-50"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                    </button>
                </div>

                {/* Legend Overlay */}
                <div className="absolute top-20 right-4 z-[500] bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-100 text-xs pointer-events-auto">
                    <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                        <span className="font-bold text-slate-700">Lokasi Anda</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                        <span className="font-bold text-slate-700">Pedagang Aktif ({activeTraders.length})</span>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet List */}
            <div className="h-1/3 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[500] flex flex-col overflow-hidden relative transition-all duration-300">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
                
                <div className="px-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-red-600" />
                        Pedagang Sekitar
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {activeTraders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Belum ada pedagang online di area ini.</p>
                        </div>
                    ) : (
                        activeTraders.map(trader => (
                            <div 
                                key={trader.id}
                                onClick={() => {
                                    setSelectedTrader(trader);
                                    if(trader.latitude) {
                                        mapRef.current?.flyTo([parseFloat(trader.latitude), parseFloat(trader.longitude)], 17);
                                    }
                                }}
                                className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center bg-white hover:shadow-md
                                    ${selectedTrader?.id === trader.id ? 'border-red-500 ring-1 ring-red-500 shadow-md' : 'border-gray-200'}
                                `}
                            >
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4 border border-red-200 text-2xl">
                                        🏪
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{trader.tradeName}</h4>
                                        <p className="text-xs text-gray-500">{trader.category} • {trader.vehicleType}</p>
                                    </div>
                                </div>
                                <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 transition">
                                    <Navigation className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
