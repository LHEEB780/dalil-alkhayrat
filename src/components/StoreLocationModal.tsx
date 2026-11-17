import React, { useState } from 'react';
import { 
  MapPin, 
  X, 
  Navigation, 
  LocateFixed, 
  Building2, 
  Check, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StoreDistrict, BAGHDAD_DISTRICTS } from '../data/nearbySuppliers.ts';
import { Language } from '../types/index.ts';

interface StoreLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDistrict: StoreDistrict;
  onSelectDistrict: (district: StoreDistrict) => void;
  language?: Language;
}

export const StoreLocationModal: React.FC<StoreLocationModalProps> = ({
  isOpen,
  onClose,
  currentDistrict,
  onSelectDistrict,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDistricts = BAGHDAD_DISTRICTS.filter(d => 
    d.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.cityAr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDetectGPS = () => {
    setIsDetectingGPS(true);
    setGpsMessage(null);

    if (!navigator.geolocation) {
      setGpsMessage(isAr ? 'متصفحك لا يدعم خاصية تحديد الموقع الجغرافي GPS' : 'Geolocation is not supported by your browser');
      setIsDetectingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGPS(false);
        // Find closest district in Baghdad
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        let closest = BAGHDAD_DISTRICTS[0];
        let minDiff = 999999;

        BAGHDAD_DISTRICTS.forEach(dist => {
          const diff = Math.hypot(dist.lat - userLat, dist.lng - userLng);
          if (diff < minDiff) {
            minDiff = diff;
            closest = dist;
          }
        });

        onSelectDistrict(closest);
        setGpsMessage(isAr ? `تم تحديد موقع متجرك بنجاح: ${closest.nameAr}` : `Location detected: ${closest.nameEn}`);
        setTimeout(() => {
          onClose();
        }, 1200);
      },
      (error) => {
        setIsDetectingGPS(false);
        // Graceful fallback to default Mansoor district if denied
        setGpsMessage(isAr ? 'تم استخدام موقع متجرك الافتراضي في المنصور، بغداد' : 'Used default store location in Mansoor, Baghdad');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-brand">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#E5E7EB]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#F7F8FA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A046] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1F2328]">
                {isAr ? 'تحديد الموقع الجغرافي لمتجرك' : 'Set Your Store Location'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {isAr 
                  ? 'لحساب المسافة الدقيقة وأسرع فانات التوزيع من كبار الموردين' 
                  : 'To calculate exact delivery distance & fastest wholesale vans'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Auto-detect Button */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#00A046] font-bold">
            <LocateFixed className={`w-4 h-4 ${isDetectingGPS ? 'animate-spin' : ''}`} />
            <span>
              {isAr ? 'تحديد فوري عبر نظام GPS للهاتف أو الكمبيوتر:' : 'Instant GPS auto-detection:'}
            </span>
          </div>

          <button
            onClick={handleDetectGPS}
            disabled={isDetectingGPS}
            className="px-4 py-2 bg-[#00A046] hover:bg-[#008a3c] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isDetectingGPS ? (isAr ? 'جاري التحديد...' : 'Detecting...') : (isAr ? 'تحديد موقعي الآن' : 'Locate Me Now')}</span>
          </button>
        </div>

        {gpsMessage && (
          <div className="px-5 py-2.5 bg-green-50 text-[#15803D] text-xs font-semibold flex items-center gap-2 border-b border-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{gpsMessage}</span>
          </div>
        )}

        {/* District Search & Selection */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="relative">
            <input
              type="text"
              placeholder={isAr ? 'ابحث عن منطقتك: المنصور، الكرادة، الشورجة، جميلة...' : 'Search district: Mansoor, Karrada, Shorja...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl py-2.5 ${
                isAr ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } text-xs text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
            />
            <Search className={`w-4 h-4 text-[#6B7280] absolute ${isAr ? 'right-3' : 'left-3'} top-3`} />
          </div>
        </div>

        {/* Districts List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-72">
          {filteredDistricts.map((district) => {
            const isSelected = district.id === currentDistrict.id;

            return (
              <div
                key={district.id}
                onClick={() => {
                  onSelectDistrict(district);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#00A046] bg-emerald-50/50 ring-2 ring-[#00A046]/30 shadow-2xs'
                    : 'border-[#E5E7EB] hover:border-gray-300 hover:bg-[#F7F8FA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-[#00A046] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isSelected ? 'text-[#00A046]' : 'text-[#1F2328]'}`}>
                      {isAr ? district.nameAr : district.nameEn}
                    </h4>
                    <span className="text-[11px] text-[#6B7280]">
                      {isAr ? district.cityAr : district.cityEn} • العراق
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <span className="w-6 h-6 rounded-full bg-[#00A046] text-white flex items-center justify-center text-xs shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[11px] text-[#00A046] font-bold opacity-0 group-hover:opacity-100 transition">
                    {isAr ? 'اختيار' : 'Select'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F7F8FA] flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            {isAr ? 'الموقع النشط حالياً: ' : 'Active Store Location: '}
            <strong className="text-[#1F2328]">{isAr ? currentDistrict.nameAr : currentDistrict.nameEn}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
