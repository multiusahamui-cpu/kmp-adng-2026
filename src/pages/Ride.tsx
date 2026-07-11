
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Bike, Car, Box, Clock, ChevronRight, Loader2, X, Crosshair, Info, Flag } from 'lucide-react';
import { RidePricingConfig, Transaction } from '../types';
import L from 'leaflet';
import { useToast } from '../components/Toast';
import { ReceiptModal } from '../components/ReceiptModal';

const ICON_URLS = {
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
};

const DefaultIcon = L.icon({
    iconRetinaUrl: ICON_URLS.iconRetinaUrl,
    iconUrl: ICON_URLS.iconUrl,
    shadowUrl: ICON_URLS.shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RideProps {
  pricingConfig: RidePricingConfig;
  onTransaction: (type: 'ride', amount: number, description: string) => void;
}

interface PlaceResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export const Ride: React.FC<RideProps> = ({ pricingConfig, onTransaction }) => {
  const [pickupAddr, setPickupAddr] = useState('');
  const [dropoffAddr, setDropoffAddr] = useState('');
  
  const [pickupCoords, setPickupCoords] = useState<L.LatLng | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<L.LatLng | null>(null);

  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'dropoff' | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const { showToast } = useToast();
  
  const [selectedType, setSelectedType] = useState<'motor' | 'mobil' | 'box'>('motor');
  const [rideStatus, setRideStatus] = useState<'idle' | 'searching' | 'driver_found' | 'in_trip' | 'completed'>('idle');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{start?: L.Marker, end?: L.Marker, routeLine?: L.Polyline}>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const timer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([-6.2088, 106.8456], 13); 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        mapRef.current = map;
        
        map.invalidateSize();

        handleUseCurrentLocation();
    }, 100);

    return () => {
        clearTimeout(timer);
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []);

  const handleUseCurrentLocation = () => {
      if ('geolocation' in navigator) {
          setIsSearchingLocation(true);
          navigator.geolocation.getCurrentPosition(
              async (position) => {
                  const latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
                  
                  if (mapRef.current) {
                      mapRef.current.setView(latlng, 16);
                      mapRef.current.invalidateSize();
                  }

                  setPickupCoords(latlng);
                  
                  try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`);
                      const data = await res.json();
                      const addr = formatAddress(data);
                      setPickupAddr(addr);
                  } catch (e) {
                      setPickupAddr("Lokasi Saya Saat Ini");
                  }
                  
                  updateMarkers(latlng, dropoffCoords);
                  setIsSearchingLocation(false);
              },
              (error) => {
                  console.error("GPS Error", error);
                  setIsSearchingLocation(false);
                  showToast("Gagal mendeteksi lokasi. Pastikan GPS aktif.", "error");
              }
          );
      }
  };

  useEffect(() => {
      const timer = setTimeout(async () => {
          const query = activeSearch === 'pickup' ? pickupAddr : dropoffAddr;
          
          if (activeSearch && query.length > 2) {
              try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=id&limit=5`);
                  const data = await res.json();
                  setSuggestions(data);
              } catch (e) {
                  setSuggestions([]);
              }
          } else {
              setSuggestions([]);
          }
      }, 500); 

      return () => clearTimeout(timer);
  }, [pickupAddr, dropoffAddr, activeSearch]);

  const handleSelectSuggestion = (place: PlaceResult) => {
      const latlng = new L.LatLng(parseFloat(place.lat), parseFloat(place.lon));
      const formattedAddr = place.display_name.split(',').slice(0, 3).join(','); 

      if (activeSearch === 'pickup') {
          setPickupCoords(latlng);
          setPickupAddr(formattedAddr);
      } else {
          setDropoffCoords(latlng);
          setDropoffAddr(formattedAddr);
      }
      
      setSuggestions([]);
      setActiveSearch(null);
      updateMarkers(activeSearch === 'pickup' ? latlng : pickupCoords, activeSearch === 'dropoff' ? latlng : dropoffCoords);
  };

  const formatAddress = (data: any) => {
      const a = data.address || {};
      const road = a.road || a.pedestrian || '';
      const suburb = a.suburb || a.village || a.city_district || '';
      const city = a.city || a.town || a.county || '';
      return [road, suburb, city].filter(Boolean).join(', ');
  };

  const updateMarkers = async (start: L.LatLng | null, end: L.LatLng | null) => {
      if (!mapRef.current) return;

      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.routeLine) markersRef.current.routeLine.remove();

      const bounds = L.latLngBounds([]);

      if (start) {
          markersRef.current.start = L.marker(start, {
              icon: L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-md"></div>`
              })
          }).addTo(mapRef.current);
          bounds.extend(start);
      }

      if (end) {
          markersRef.current.end = L.marker(end, {
               icon: L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="w-4 h-4 bg-orange-600 rounded-full border-2 border-white shadow-md"></div>`
              })
          }).addTo(mapRef.current);
          bounds.extend(end);
      }

      if (start && end) {
          setIsCalculatingRoute(true);
          try {
              const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
              const data = await response.json();

              if (data.routes && data.routes.length > 0) {
                  const route = data.routes[0];
                  
                  const distKm = route.distance / 1000;
                  setDistance(parseFloat(distKm.toFixed(1)));
                  setDuration(Math.ceil(route.duration / 60));

                  const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]); 
                  const polyline = L.polyline(coordinates, {
                      color: '#10b981', 
                      weight: 5,
                      opacity: 0.8,
                      lineCap: 'round'
                  }).addTo(mapRef.current);
                  
                  markersRef.current.routeLine = polyline;
                  mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 200] }); 
              }
          } catch (error) {
              console.error("Routing Error", error);
              const polyline = L.polyline([start, end], {color: 'gray', weight: 2, dashArray: '5, 10'}).addTo(mapRef.current);
              markersRef.current.routeLine = polyline;
              mapRef.current.fitBounds(bounds, { padding: [50, 200] });
              setDistance(parseFloat((start.distanceTo(end) / 1000).toFixed(1)));
          } finally {
              setIsCalculatingRoute(false);
          }
      } else if (start) {
          mapRef.current.setView(start, 16);
      }
  };

  const getPrice = () => {
    if (!distance) return { ride: 0, app: 0, tax: 0, total: 0 };
    
    let baseFare = 0;
    let pricePerKm = 0;

    if (selectedType === 'motor') {
        baseFare = pricingConfig.baseFareMotor;
        pricePerKm = pricingConfig.pricePerKmMotor;
    } else {
        baseFare = pricingConfig.baseFareMobil;
        pricePerKm = pricingConfig.pricePerKmMobil;
    }

    const rideFare = baseFare + (pricePerKm * distance);
    const appFee = 2000;
    const tax = Math.ceil(appFee * 0.11);
    
    const total = rideFare + appFee + tax;
    
    return { 
        ride: Math.ceil(rideFare / 100) * 100, 
        app: appFee, 
        tax: tax, 
        total: Math.ceil(total / 100) * 100 
    };
  };

  const costBreakdown = getPrice();

  const handleOrder = () => {
      setRideStatus('searching');
      setTimeout(() => {
          setRideStatus('driver_found');
          showToast("Driver ditemukan! Menuju lokasi Anda.", "success");
      }, 3000);
  };

  const handleStartTrip = () => {
      setRideStatus('in_trip');
      showToast("Perjalanan dimulai. Selamat menikmati perjalanan!", "info");
  };

  const handleFinishTrip = () => {
      const desc = `K-Ride ${distance}km (${pickupAddr.split(',')[0]} -> ${dropoffAddr.split(',')[0]})`;
      onTransaction('ride', costBreakdown.total, desc);
      
      const mockTx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'ride',
          amount: costBreakdown.total,
          date: new Date().toLocaleDateString('id-ID'),
          status: 'success',
          description: desc,
          refId: `RIDE-${Date.now().toString().slice(-6)}`
      };
      
      setLastTransaction(mockTx);
      setRideStatus('completed');
  };

  const resetRide = () => {
      setRideStatus('idle');
      setPickupCoords(null);
      setDropoffCoords(null);
      setDistance(0);
      setPickupAddr('');
      setDropoffAddr('');
      setLastTransaction(null);
      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.routeLine) markersRef.current.routeLine.remove();
  };

  return (
    <div className="relative h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      
      <div className="absolute inset-0 z-0">
          <div ref={mapContainerRef} className="h-full w-full bg-slate-200" style={{ minHeight: '100%' }} />
      </div>

      <div className="absolute top-4 left-4 right-4 z-[500] max-w-md mx-auto">
          {rideStatus === 'idle' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 space-y-4">
                <div className="relative">
                    <div className="absolute left-3 top-8 bottom-8 w-0.5 bg-gray-200 border-l border-dashed border-gray-300 pointer-events-none"></div>

                    <div className="flex items-center mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 shrink-0 z-10">
                            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div>
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Lokasi Jemput"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-3 pr-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                                value={pickupAddr}
                                onFocus={() => setActiveSearch('pickup')}
                                onChange={(e) => setPickupAddr(e.target.value)}
                            />
                            {pickupAddr && <button onClick={() => {setPickupAddr(''); setPickupCoords(null);}} className="absolute right-2 top-2.5 text-gray-400"><X size={16}/></button>}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-3 shrink-0 z-10">
                            <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Cari Tujuan (Misal: Monas)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-3 pr-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all shadow-sm"
                                value={dropoffAddr}
                                onFocus={() => setActiveSearch('dropoff')}
                                onChange={(e) => setDropoffAddr(e.target.value)}
                            />
                             {dropoffAddr && <button onClick={() => {setDropoffAddr(''); setDropoffCoords(null);}} className="absolute right-2 top-2.5 text-gray-400"><X size={16}/></button>}
                        </div>
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto z-[600]">
                        {suggestions.map((place) => (
                            <div 
                                key={place.place_id}
                                onClick={() => handleSelectSuggestion(place)}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center"
                            >
                                <div className="bg-gray-100 p-2 rounded-full mr-3 text-gray-500">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 line-clamp-1">{place.display_name.split(',')[0]}</p>
                                    <p className="text-xs text-gray-500 line-clamp-1">{place.display_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
      </div>

      {rideStatus === 'idle' && (
          <button 
            onClick={handleUseCurrentLocation}
            className="absolute bottom-64 right-4 z-[400] bg-white p-3 rounded-full shadow-lg text-slate-700 hover:text-emerald-600 transition"
          >
              <Crosshair size={24} />
          </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[500] p-6 pb-8 transition-transform duration-300">
          
          {rideStatus === 'searching' && (
             <div className="text-center animate-fade-in py-4">
                 <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-slate-800">Mencari Driver...</h3>
                 <p className="text-gray-500">Mohon tunggu sebentar, kami sedang menghubungkan Anda.</p>
             </div>
          )}

          {(rideStatus === 'driver_found' || rideStatus === 'in_trip') && (
             <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className={`w-3 h-3 rounded-full animate-pulse ${rideStatus === 'in_trip' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                    <span className={`font-bold uppercase tracking-wider text-sm ${rideStatus === 'in_trip' ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {rideStatus === 'in_trip' ? 'Dalam Perjalanan' : 'Driver Menuju Lokasi'}
                    </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-left">
                            <div className="w-12 h-12 bg-slate-200 rounded-full mr-3"></div>
                            <div>
                                <h4 className="font-bold text-slate-800">Budi Santoso</h4>
                                <p className="text-xs text-gray-500">Honda Beat • B 1234 KOD</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">4.9 ⭐</p>
                        </div>
                    </div>
                </div>
                
                {rideStatus === 'driver_found' && (
                    <div className="flex space-x-3">
                        <button 
                            onClick={handleStartTrip}
                            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"
                        >
                            Naik ke Kendaraan
                        </button>
                        <button 
                            onClick={resetRide}
                            className="w-1/3 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                        >
                            Batal
                        </button>
                    </div>
                )}

                {rideStatus === 'in_trip' && (
                    <button 
                        onClick={handleFinishTrip}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg flex items-center justify-center"
                    >
                        <Flag className="w-5 h-5 mr-2" /> Selesai & Bayar
                    </button>
                )}
             </div>
          )}

          {rideStatus === 'idle' && (
             <>
                <div className="flex space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                    onClick={() => setSelectedType('motor')}
                    className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 flex flex-col items-center transition ${selectedType === 'motor' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                    <Bike className={`w-8 h-8 mb-1 ${selectedType === 'motor' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold text-slate-700">K-Ride</span>
                    </button>
                    <button 
                    onClick={() => setSelectedType('mobil')}
                    className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 flex flex-col items-center transition ${selectedType === 'mobil' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                    <Car className={`w-8 h-8 mb-1 ${selectedType === 'mobil' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold text-slate-700">K-Car</span>
                    </button>
                    <button 
                    onClick={() => setSelectedType('box')}
                    className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 flex flex-col items-center transition ${selectedType === 'box' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                    <Box className={`w-8 h-8 mb-1 ${selectedType === 'box' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold text-slate-700">K-Send</span>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-sm text-gray-500">
                            {distance > 0 ? (
                                <>
                                    <Navigation className="w-4 h-4 mr-1 text-emerald-600" />
                                    <span className="font-bold mr-3 text-slate-700">{distance} km</span>
                                    <Clock className="w-4 h-4 mr-1 text-orange-500" />
                                    <span>~{duration} min</span>
                                </>
                            ) : (
                                <span>Pilih tujuan untuk melihat harga</span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {distance > 0 ? `Rp ${costBreakdown.total.toLocaleString('id-ID')}` : '-'}
                        </div>
                    </div>
                    {distance > 0 && (
                        <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded flex justify-between items-center">
                            <span className="flex items-center"><Info className="w-3 h-3 mr-1" /> Termasuk: Tarif {costBreakdown.ride.toLocaleString('id-ID')} + App {costBreakdown.app.toLocaleString('id-ID')} + PPN 11% (App) {costBreakdown.tax.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleOrder}
                    disabled={!distance || isCalculatingRoute}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition flex items-center justify-center shadow-lg shadow-emerald-600/20 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isCalculatingRoute ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Menghitung Rute...</>
                    ) : (
                        <>Pesan Sekarang <ChevronRight className="w-5 h-5 ml-2" /></>
                    )}
                </button>
             </>
          )}
      </div>

      {rideStatus === 'completed' && lastTransaction && (
          <ReceiptModal 
            transaction={lastTransaction}
            onClose={resetRide}
          />
      )}

    </div>
  );
};
