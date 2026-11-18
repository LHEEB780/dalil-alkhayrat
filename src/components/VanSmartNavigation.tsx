/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Clock,
  LocateFixed,
  TrafficCone,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShoppingCart,
  Route as RouteIcon
} from 'lucide-react';
import { Language, OrderItem } from '../types/index.ts';

interface RouteStopItem {
  id: string;
  storeId: string;
  storeName: string;
  district: string;
  address: string;
  phone: string;
  sequence: number;
  status: 'pending' | 'visited' | 'sold' | 'skipped';
  notes?: string;
}

interface VanSmartNavigationProps {
  routeStops: RouteStopItem[];
  assignedOrders: OrderItem[];
  language?: Language;
  onStartSaleForStore?: (storeId: string) => void;
  onMarkStopVisited?: (stopId: string) => void;
}

interface ComputedRouteSummary {
  distanceMeters: number;
  durationMillis: number;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
  steps: { instruction: string; distanceText: string }[];
}

function TrafficAndRouteController({
  origin,
  destination,
  showTraffic,
  avoidTolls,
  onRouteComputed,
  onRouteError,
  onLoadingChange
}: {
  origin: string | { lat: number; lng: number };
  destination: string;
  showTraffic: boolean;
  avoidTolls: boolean;
  onRouteComputed: (summary: ComputedRouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Manage live TrafficLayer toggle
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.TrafficLayer) return;
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }
    trafficLayerRef.current.setMap(showTraffic ? map : null);
    return () => {
      trafficLayerRef.current?.setMap(null);
    };
  }, [map, showTraffic]);

  // Compute traffic-aware fastest route via modern Routes API (Route.computeRoutes)
  // Ref: https://developers.google.com/maps/documentation/javascript/routes?utm_campaign=gmp_mcp_codeassist_v1_aistudio
  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError(null);
    onLoadingChange(true);

    let cancelled = false;

    const request: Record<string, unknown> = {
      origin,
      destination,
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
      routeModifiers: {
        avoidTolls
      },
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs']
    };

    (routesLib.Route as any)
      .computeRoutes(request)
      .then((response: { routes?: any[] }) => {
        if (cancelled) return;
        onLoadingChange(false);
        const routes = response?.routes;
        if (!routes || routes.length === 0) {
          onRouteComputed(null);
          onRouteError('لم يتم العثور على مسار بين نقطة الانطلاق والوجهة المحددة.');
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines: google.maps.Polyline[] = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#0B5D32',
            strokeWeight: 6,
            strokeOpacity: 0.92
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const firstLeg = primaryRoute.legs?.[0];
        const extractLatLng = (loc: any): { lat: number; lng: number } | undefined => {
          if (!loc) return undefined;
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
          if (typeof lat === 'number' && typeof lng === 'number') {
            return { lat, lng };
          }
          return undefined;
        };

        const rawSteps: any[] = firstLeg?.steps || [];
        const parsedSteps = rawSteps
          .map((st: any) => ({
            instruction:
              st?.navigationInstruction?.instructions ||
              st?.instructions ||
              '',
            distanceText: st?.localizedValues?.distance?.text ||
              (st?.distanceMeters ? `${(st.distanceMeters / 1000).toFixed(1)} كم` : '')
          }))
          .filter((s) => Boolean(s.instruction));

        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          startLocation: extractLatLng(firstLeg?.startLocation),
          endLocation: extractLatLng(firstLeg?.endLocation),
          steps: parsedSteps
        });
      })
      .catch((err: any) => {
        if (cancelled) return;
        onLoadingChange(false);
        const msg = String(err?.message || err || '');
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('Quota') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteComputed(null);
        onRouteError('تعذر احتساب المسار حالياً. تأكد من الاتصال أو جرب وجهة أخرى.');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination, avoidTolls]);

  return null;
}

export const VanSmartNavigation: React.FC<VanSmartNavigationProps> = ({
  routeStops,
  assignedOrders,
  language = 'ar',
  onStartSaleForStore,
  onMarkStopVisited
}) => {
  const isAr = language === 'ar';
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const [originInput, setOriginInput] = useState<string | { lat: number; lng: number }>(
    'Shorja Market, Baghdad, Iraq'
  );
  const [originLabel, setOriginLabel] = useState<string>(
    isAr ? 'مستودع المورد (الشورجة - بغداد)' : 'Supplier Warehouse (Shorja, Baghdad)'
  );
  const [selectedStopId, setSelectedStopId] = useState<string>(routeStops[0]?.id || '');
  const [customDestination, setCustomDestination] = useState<string>('');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [routeSummary, setRouteSummary] = useState<ComputedRouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  const selectedStop = routeStops.find((s) => s.id === selectedStopId) || routeStops[0];

  const activeDestination = customDestination.trim()
    ? customDestination.trim()
    : selectedStop
    ? `${selectedStop.district}, Baghdad, Iraq`
    : 'Al-Mansour, Baghdad, Iraq';

  const handleUseMyGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(isAr ? 'متصفحك لا يدعم تحديد الموقع GPS.' : 'Geolocation not supported.');
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginInput({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginLabel(isAr ? 'موقعي الحالي (GPS مباشر)' : 'My Current GPS Location');
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setGpsError(
          isAr
            ? 'تعذر قراءة GPS؛ تم الإبقاء على نقطة الانطلاق من المستودع.'
            : 'Unable to read GPS; keeping warehouse origin.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const etaMinutes = routeSummary ? Math.max(1, Math.round(routeSummary.durationMillis / 60000)) : null;
  const distanceKm = routeSummary ? (routeSummary.distanceMeters / 1000).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* Top Smart Navigation Controls */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-[#142018] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'الملاحة الذكية وتجنب الازدحام المروري' : 'Smart Traffic-Aware Navigation'}</span>
            </h3>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? 'توجيه فوري عبر أسرع الطرق مع طبقة الازدحام المروري المباشرة.'
                : 'Fastest driving routes with live traffic congestion overlay.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleUseMyGPS}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#0B5D32] hover:bg-[#D1FAE5] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'موقعي GPS' : 'Use GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTraffic((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                showTraffic
                  ? 'bg-[#0B5D32] text-white border-[#0B5D32]'
                  : 'bg-[#F8FAF7] text-[#4B6352] border-[#DCE5DC]'
              }`}
            >
              <TrafficCone className="w-3.5 h-3.5" />
              <span>{isAr ? 'الازدحام المروري' : 'Live Traffic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAvoidTolls((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition ${
                avoidTolls
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-[#F8FAF7] text-[#4B6352] border-[#DCE5DC]'
              }`}
            >
              {isAr ? 'تجنب الرسوم' : 'Avoid Tolls'}
            </button>
          </div>
        </div>

        {/* Origin & Destination Quick Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs">
          <div className="md:col-span-5 bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B5D32] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-[#5F7164] font-bold">{isAr ? 'نقطة الانطلاق' : 'Origin'}</div>
              <div className="font-bold text-[#142018] truncate">{originLabel}</div>
            </div>
          </div>

          <div className="md:col-span-7">
            <input
              type="text"
              value={customDestination}
              onChange={(e) => setCustomDestination(e.target.value)}
              placeholder={
                selectedStop
                  ? isAr
                    ? `الوجهة الحالية: ${selectedStop.storeName} (${selectedStop.district}) — أو اكتب عنواناً آخر...`
                    : `Destination: ${selectedStop.storeName} — or enter another address...`
                  : isAr
                  ? 'اكتب عنوان المتجر أو المنطقة للوصول...'
                  : 'Enter destination address...'
              }
              className="w-full h-full min-h-[44px] bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden"
            />
          </div>
        </div>

        {gpsError && (
          <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-bold">
            {gpsError}
          </div>
        )}

        {/* Live ETA & Distance Banner */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-[#F8FAF7] rounded-xl border border-[#DCE5DC] p-2.5">
            <div className="text-[10px] font-bold text-[#5F7164] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#0B5D32]" />
              <span>{isAr ? 'الوقت المتوقع (مع الزحام)' : 'Traffic ETA'}</span>
            </div>
            <div className="text-sm sm:text-base font-black font-mono tabular-nums text-[#0B5D32] mt-0.5">
              {isComputing
                ? '...'
                : etaMinutes !== null
                ? isAr
                  ? `${etaMinutes} دقيقة`
                  : `${etaMinutes} min`
                : '—'}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-xl border border-[#DCE5DC] p-2.5">
            <div className="text-[10px] font-bold text-[#5F7164] flex items-center gap-1">
              <RouteIcon className="w-3 h-3 text-[#0B5D32]" />
              <span>{isAr ? 'المسافة' : 'Distance'}</span>
            </div>
            <div className="text-sm sm:text-base font-black font-mono tabular-nums text-[#142018] mt-0.5">
              {isComputing
                ? '...'
                : distanceKm !== null
                ? isAr
                  ? `${distanceKm} كم`
                  : `${distanceKm} km`
                : '—'}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-xl border border-[#DCE5DC] p-2.5">
            <div className="text-[10px] font-bold text-[#5F7164]">
              {isAr ? 'المحطات المتبقية' : 'Remaining Stops'}
            </div>
            <div className="text-sm sm:text-base font-black font-mono tabular-nums text-amber-700 mt-0.5">
              {routeStops.filter((s) => s.status === 'pending').length} / {routeStops.length}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Google Map + Route Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden shadow-2xs">
          {!apiKey ? (
            <div className="h-[360px] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <div className="font-black text-sm text-[#142018]">
                {isAr ? 'مفتاح خرائط جوجل قيد التفعيل' : 'Google Maps API Key Initializing'}
              </div>
              <p className="text-xs text-[#5F7164] max-w-sm">
                {isAr
                  ? 'يرجى تحديث الصفحة بعد لحظات لتفعيل الخريطة التفاعلية.'
                  : 'Please refresh the preview shortly to load the interactive map.'}
              </p>
            </div>
          ) : (
            <APIProvider apiKey={apiKey} language={isAr ? 'ar' : 'en'} region="IQ">
              <div className="relative w-full h-[380px] sm:h-[440px]">
                <GoogleMap
                  defaultCenter={{ lat: 33.3152, lng: 44.3661 }}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="greedy"
                  fullscreenControl={true}
                  streetViewControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                >
                  <TrafficAndRouteController
                    origin={originInput}
                    destination={activeDestination}
                    showTraffic={showTraffic}
                    avoidTolls={avoidTolls}
                    onRouteComputed={setRouteSummary}
                    onRouteError={setRouteError}
                    onLoadingChange={setIsComputing}
                  />

                  {routeSummary?.startLocation && (
                    <AdvancedMarker
                      position={routeSummary.startLocation}
                      title={originLabel}
                    >
                      <Pin
                        background="#0B5D32"
                        borderColor="#FFFFFF"
                        glyphColor="#FFE600"
                      />
                    </AdvancedMarker>
                  )}

                  {routeSummary?.endLocation && (
                    <AdvancedMarker
                      position={routeSummary.endLocation}
                      title={selectedStop?.storeName || activeDestination}
                    >
                      <Pin
                        background="#DC2626"
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                      />
                    </AdvancedMarker>
                  )}
                </GoogleMap>

                {routeError && (
                  <div className="absolute bottom-3 inset-x-3 bg-white/95 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-bold shadow-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{routeError}</span>
                  </div>
                )}
              </div>
            </APIProvider>
          )}

          {/* Turn-by-turn steps preview */}
          {routeSummary && routeSummary.steps.length > 0 && (
            <div className="p-3.5 border-t border-[#EAEFEA] bg-[#F8FAF7] space-y-2">
              <div className="text-xs font-black text-[#142018]">
                {isAr ? 'أهم خطوات المسار الأسرع:' : 'Fastest Route Directions:'}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                {routeSummary.steps.slice(0, 6).map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 bg-white border border-[#EAEFEA] rounded-lg px-2.5 py-1.5"
                  >
                    <span className="text-[#142018] font-semibold">
                      {i + 1}. {step.instruction}
                    </span>
                    {step.distanceText && (
                      <span className="font-mono text-[10.5px] font-bold text-[#0B5D32] shrink-0">
                        {step.distanceText}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Selectable Route Stops & Delivery Destinations */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs text-[#142018] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'محطات خط السير اليومي' : 'Daily Route Stops'}</span>
            </h4>
            <span className="text-[10.5px] font-mono font-bold text-[#5F7164]">
              {routeStops.length} {isAr ? 'محل' : 'stops'}
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {routeStops.map((stop) => {
              const isSelected = !customDestination.trim() && selectedStop?.id === stop.id;
              return (
                <div
                  key={stop.id}
                  onClick={() => {
                    setCustomDestination('');
                    setSelectedStopId(stop.id);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-[#0B5D32] bg-[#ECFDF5]/60 ring-1 ring-[#0B5D32]/20'
                      : 'border-[#DCE5DC] bg-[#F8FAF7] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-xs text-[#142018] truncate">
                        {stop.sequence}. {stop.storeName}
                      </div>
                      <div className="text-[10.5px] text-[#5F7164] mt-0.5 truncate">
                        {stop.district} — {stop.address}
                      </div>
                      <div className="text-[10px] font-mono text-[#4B6352] mt-0.5 flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3" />
                        <span>{stop.phone}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        stop.status === 'sold'
                          ? 'bg-[#ECFDF5] text-[#065F46]'
                          : stop.status === 'visited'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {stop.status === 'sold'
                        ? isAr ? 'تم البيع' : 'Sold'
                        : stop.status === 'visited'
                        ? isAr ? 'تمت الزيارة' : 'Visited'
                        : isAr ? 'قادم' : 'Next'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {onStartSaleForStore && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartSaleForStore(stop.storeId);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#0B5D32] hover:bg-[#084725] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{isAr ? 'بدء بيع' : 'Sell'}</span>
                      </button>
                    )}
                    {stop.status === 'pending' && onMarkStopVisited && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkStopVisited(stop.id);
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#4B6352] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isAr ? 'وصلت' : 'Arrived'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {assignedOrders.filter((o) => o.status !== 'delivered').length > 0 && (
              <div className="pt-2 border-t border-[#EAEFEA] space-y-1.5">
                <div className="text-[11px] font-black text-[#4B6352]">
                  {isAr ? 'وجهات طلبات التوريد الجاهزة:' : 'Pending Supply Order Stops:'}
                </div>
                {assignedOrders
                  .filter((o) => o.status !== 'delivered')
                  .map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setCustomDestination(`${ord.storeAddress}, ${ord.storeCity}, Iraq`)}
                      className="w-full p-2.5 rounded-xl border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-start text-xs cursor-pointer transition"
                    >
                      <div className="font-bold text-[#142018] truncate">{ord.storeName}</div>
                      <div className="text-[10.5px] text-[#5F7164] truncate">{ord.storeAddress}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
