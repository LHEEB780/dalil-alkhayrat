export interface WholesaleSupplier {
  id: string;
  nameAr: string;
  nameEn: string;
  districtAr: string;
  districtEn: string;
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  deliveryTimeAr: string;
  deliveryTimeEn: string;
  minOrderIQD: number;
  creditTermsAr: string;
  creditTermsEn: string;
  specialtiesAr: string;
  specialtiesEn: string;
  isVerified: boolean;
  hasSmartShipping: boolean;
  activeVansCount: number;
  badgeAr: string;
  badgeEn: string;
  badgeColor: string;
  phone: string;
  logoUrl?: string;
  storeImageUrl?: string;
  brandsDistributed?: string[];
  category?: string;
  minOrderUSD?: number;
}

export interface StoreDistrict {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  lat: number;
  lng: number;
}

export const BAGHDAD_DISTRICTS: StoreDistrict[] = [
  {
    id: 'mansoor',
    nameAr: 'المنصور - شارع 14 رمضان (حي دراغ)',
    nameEn: 'Al-Mansoor - 14th Ramadan St (Daragh)',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.3152,
    lng: 44.3540
  },
  {
    id: 'karkh_yarmouk',
    nameAr: 'الكرخ - اليرموك وحي الجامعة',
    nameEn: 'Karkh - Yarmouk & Jamiaa',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.3080,
    lng: 44.3420
  },
  {
    id: 'shorja',
    nameAr: 'الرصافة - الشورجة وشارع الرشيد',
    nameEn: 'Rusafa - Shorja & Rasheed St',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.3400,
    lng: 44.3900
  },
  {
    id: 'karrada',
    nameAr: 'الكرادة داخل وخارج',
    nameEn: 'Karrada Dakhil & Kharij',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.2980,
    lng: 44.4250
  },
  {
    id: 'jamila',
    nameAr: 'مدينة جميلة الصناعية - قطاع التموين',
    nameEn: 'Jamila Industrial City - Food Sector',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.3750,
    lng: 44.4420
  },
  {
    id: 'bayaa',
    nameAr: 'البياع وحي العامل والسيدية',
    nameEn: 'Bayaa, Amil & Saydiya',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.2650,
    lng: 44.3450
  },
  {
    id: 'adhamiya',
    nameAr: 'الأعظمية وشارع المغرب',
    nameEn: 'Adhamiya & Maghrib St',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.3700,
    lng: 44.3750
  },
  {
    id: 'doura',
    nameAr: 'الدورة والمهدية',
    nameEn: 'Doura & Mahdiya',
    cityAr: 'بغداد',
    cityEn: 'Baghdad',
    lat: 33.2500,
    lng: 44.3850
  },
  {
    id: 'basra_ashar',
    nameAr: 'البصرة - العشار وسوق الذهب',
    nameEn: 'Basra - Ashar Commercial Market',
    cityAr: 'البصرة',
    cityEn: 'Basra',
    lat: 30.5081,
    lng: 47.8236
  },
  {
    id: 'erbil_ainkawa',
    nameAr: 'أربيل - عينكاوة وطريق المطار',
    nameEn: 'Erbil - Ainkawa & Airport Rd',
    cityAr: 'أربيل',
    cityEn: 'Erbil',
    lat: 36.2167,
    lng: 43.9933
  }
];

export const WHOLESALE_SUPPLIERS: WholesaleSupplier[] = [
  {
    id: 'supp_tigris',
    nameAr: 'شركة دجلة والفرات للتوزيع السريع',
    nameEn: 'Tigris & Euphrates Express Distribution',
    districtAr: 'المنصور - شارع 14 رمضان (حي دراغ)',
    districtEn: 'Al-Mansoor - 14th Ramadan St (Daragh)',
    addressAr: 'شارع 14 رمضان قرب ساحة اللقاء',
    addressEn: '14th Ramadan St near Liqa Square',
    lat: 33.3180,
    lng: 44.3590,
    rating: 4.9,
    reviewsCount: 198,
    distanceKm: 0.9,
    deliveryTimeAr: 'خلال 45 دقيقة • فان في منطقتك',
    deliveryTimeEn: 'Within 45 mins • Van in your zone',
    minOrderIQD: 100000,
    minOrderUSD: 75,
    creditTermsAr: 'سقف ائتمان 10 مليون د.ع • سداد 21 يوماً',
    creditTermsEn: '10M IQD credit line • 21-day terms',
    specialtiesAr: 'ألبان وأجبان، معلبات، معكرونة، شاي، منظفات',
    specialtiesEn: 'Dairy & Cheese, Canned, Pasta, Tea',
    isVerified: true,
    hasSmartShipping: true,
    activeVansCount: 5,
    badgeAr: 'الأقرب لموقعك ⚡',
    badgeEn: 'Closest to You ⚡',
    badgeColor: 'bg-emerald-50 text-[#00A046] border-emerald-200',
    phone: '+964 771 223 3445',
    category: 'ألبان وأجبان تبريد',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['بريزيدن', 'لونا', 'المراعي', 'الروابي', 'سنان']
  },
  {
    id: 'supp_rafidain',
    nameAr: 'شركة الرافدين للتجارة العامة والأغذية',
    nameEn: 'Al-Rafidain General Food & Trading Co.',
    districtAr: 'الرصافة - الشورجة وشارع الرشيد',
    districtEn: 'Rusafa - Shorja & Rasheed St',
    addressAr: 'سوق الجملة المركزي، عمارة الأغذية الكبرى',
    addressEn: 'Wholesale Center, Grand Food Building',
    lat: 33.3400,
    lng: 44.3900,
    rating: 4.9,
    reviewsCount: 264,
    distanceKm: 1.8,
    deliveryTimeAr: 'ساعتان • فانات تبريد نشطة',
    deliveryTimeEn: '2 Hours • Active refrigerated vans',
    minOrderIQD: 150000,
    minOrderUSD: 115,
    creditTermsAr: 'سقف ائتمان 15 مليون د.ع • سداد 30 يوماً',
    creditTermsEn: '15M IQD credit line • 30-day terms',
    specialtiesAr: 'أرز بسمتي عنبر، زيوت عافية، حليب بودرة، سكر نقي',
    specialtiesEn: 'Basmati Rice, Cooking Oils, Milk, Sugar',
    isVerified: true,
    hasSmartShipping: true,
    activeVansCount: 7,
    badgeAr: 'المورد الأعلى تقييماً ⭐',
    badgeEn: 'Highest Rated Supplier ⭐',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    phone: '+964 780 112 2334',
    category: 'أرز وحبوب',
    logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['عافية', 'أرز العنبر العراقي', 'شكر الاتحاد', 'نيدو', 'ألتونسا']
  },
  {
    id: 'supp_nahrain',
    nameAr: 'شركة النهرين لاستيراد الشاي والبن الفاخر',
    nameEn: 'Al-Nahrain Tea & Premium Coffee Importers',
    districtAr: 'الكرادة داخل وخارج',
    districtEn: 'Karrada Dakhil & Kharij',
    addressAr: 'ساحة الحرية، مجمع التوزيع الغذائي',
    addressEn: 'Hurriya Square, Food Distribution Complex',
    lat: 33.2980,
    lng: 44.4250,
    rating: 4.8,
    reviewsCount: 172,
    distanceKm: 2.6,
    deliveryTimeAr: 'توصيل اليوم قبل 3:00 عصراً',
    deliveryTimeEn: 'Same-day delivery before 3:00 PM',
    minOrderIQD: 120000,
    minOrderUSD: 90,
    creditTermsAr: 'تسهيلات وكالات • دفع آجل 30 يوماً',
    creditTermsEn: 'Exclusive agency terms • 30-day credit',
    specialtiesAr: 'شاي الكوزي، قهوة العميد، بن لافازا، نسكافيه',
    specialtiesEn: 'Al-Koozi Tea, Al-Ameed Coffee, Lavazza',
    isVerified: true,
    hasSmartShipping: true,
    activeVansCount: 3,
    badgeAr: 'شحن مجاني SMART 🚚',
    badgeEn: 'Free SMART Shipping 🚚',
    badgeColor: 'bg-[#E8F8EE] text-[#00A046] border-[#B3EBC8]',
    phone: '+964 770 445 5667',
    category: 'قهوة وشاي',
    logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['شاي الكوزي', 'قهوة العميد', 'نسكافيه', 'لافازا', 'ديلما']
  },
  {
    id: 'supp_babylon',
    nameAr: 'مؤسسة بابل للزيوت والتموين الغذائي',
    nameEn: 'Babylon Oils & Wholesale Provisions',
    districtAr: 'البياع وحي العامل والسيدية',
    districtEn: 'Bayaa, Amil & Saydiya',
    addressAr: 'شارع المصافي، مجمع المخازن الكبرى',
    addressEn: 'Refinery St, Grand Warehouses',
    lat: 33.2650,
    lng: 44.3450,
    rating: 4.7,
    reviewsCount: 145,
    distanceKm: 3.4,
    deliveryTimeAr: 'خلال 3 ساعات • أسطول فانات يومي',
    deliveryTimeEn: 'Within 3 hours • Daily van fleet',
    minOrderIQD: 200000,
    minOrderUSD: 150,
    creditTermsAr: 'دفع آجل 14 يوماً • خصم نقدي 2% للكاش',
    creditTermsEn: '14-day credit • 2% cash discount',
    specialtiesAr: 'زيوت نباتية بالكرتون، سمنة، تونة الوها، معجون طماطم',
    specialtiesEn: 'Cooking Oils, Ghee, Tuna, Tomato Paste',
    isVerified: true,
    hasSmartShipping: false,
    activeVansCount: 4,
    badgeAr: 'أفضل أسعار الزيوت 💰',
    badgeEn: 'Best Oil Prices 💰',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    phone: '+964 781 667 7889',
    category: 'زيوت ودهون',
    logoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['عافية', 'زيت الذرة الشهبندر', 'تونة ألوها', 'معجون المزرعة', 'سمنة شوكة وملعقة']
  },
  {
    id: 'supp_jamila',
    nameAr: 'مجمع جميلة المركزي لتجارة الحبوب والأغذية',
    nameEn: 'Jamila Central Grain & Food Complex',
    districtAr: 'مدينة جميلة الصناعية - قطاع التموين',
    districtEn: 'Jamila Industrial City - Food Sector',
    addressAr: 'قطاع التموين، مخازن الجملة رقم 14',
    addressEn: 'Food Sector, Wholesale Warehouse #14',
    lat: 33.3750,
    lng: 44.4420,
    rating: 4.8,
    reviewsCount: 320,
    distanceKm: 4.2,
    deliveryTimeAr: 'شاحنات نقل ثقيل ونصف جملة',
    deliveryTimeEn: 'Heavy trucks & semi-wholesale',
    minOrderIQD: 400000,
    minOrderUSD: 300,
    creditTermsAr: 'أسعار مصنع مباشرة • خصومات كميات كبرى',
    creditTermsEn: 'Factory direct prices • Bulk discounts',
    specialtiesAr: 'شوالات أرز عنبر 50 كغم، طحين صفر، سكر الاتحاد بالطن',
    specialtiesEn: '50kg Rice sacks, Sugar, Flour',
    isVerified: true,
    hasSmartShipping: false,
    activeVansCount: 8,
    badgeAr: 'أسعار مصنع مباشرة 🏭',
    badgeEn: 'Direct Factory Prices 🏭',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    phone: '+964 790 889 9001',
    category: 'أرز وحبوب',
    logoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['أرز محمود', 'طحين صفر تركي', 'سكر الاتحاد', 'عدس كندي', 'فاصولياء بيضاء']
  },
  {
    id: 'supp_baghdad_canned',
    nameAr: 'شركة الرافد للمعلبات والمؤن الغذائية',
    nameEn: 'Al-Rafid Canned Foods & Provisions Co.',
    districtAr: 'الكرخ - اليرموك وحي الجامعة',
    districtEn: 'Karkh - Yarmouk & Jamiaa',
    addressAr: 'شارع الأربعين، مجمع الأغذية المستوردة',
    addressEn: '40th St, Imported Food Hub',
    lat: 33.3080,
    lng: 44.3420,
    rating: 4.8,
    reviewsCount: 110,
    distanceKm: 1.4,
    deliveryTimeAr: 'خلال ساعة واحدة • توصيل مبرد',
    deliveryTimeEn: 'Within 1 hour • Chilled delivery',
    minOrderIQD: 80000,
    minOrderUSD: 60,
    creditTermsAr: 'تسهيلات ائتمانية 20 يوماً للمتاجر المسجلة',
    creditTermsEn: '20-day credit for verified stores',
    specialtiesAr: 'معلبات ذرة، فول مدمس، حلاوة طحينية، بسكويت',
    specialtiesEn: 'Canned Corn, Fava Beans, Halawa, Biscuits',
    isVerified: true,
    hasSmartShipping: true,
    activeVansCount: 4,
    badgeAr: 'توصيل فوري < ساعة ⏱️',
    badgeEn: 'Express < 1h ⏱️',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    phone: '+964 772 334 5566',
    category: 'معلبات ومؤن',
    logoUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=150&q=80',
    storeImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    brandsDistributed: ['حدائق كاليفورنيا', 'أمريكانا', 'لونا', 'المداح', 'بسكويت أولكر']
  }
];

/**
 * Approximate distance calculation in KM between two lat/lng coordinates (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Resolves a product offer's supplier into a full WholesaleSupplier profile
 * so clicking the supplier link from any product modal opens their dedicated storefront page.
 */
export function resolveWholesaleSupplierByOffer(
  supplierId: string,
  supplierName: string,
  supplierCity: string
): WholesaleSupplier {
  const exact = WHOLESALE_SUPPLIERS.find(
    (s) => s.id === supplierId || s.nameAr === supplierName || s.nameEn === supplierName
  );
  if (exact) return exact;

  if (supplierId === 'supp_dijla') {
    const base = WHOLESALE_SUPPLIERS.find((s) => s.id === 'supp_tigris') || WHOLESALE_SUPPLIERS[0];
    return {
      ...base,
      id: 'supp_dijla',
      nameAr: supplierName || 'مجموعة دجلة للمشروبات والسلع الغذائية',
      nameEn: 'Dijla Food & Beverages Group',
      districtAr: supplierCity || base.districtAr,
      districtEn: supplierCity || base.districtEn,
      specialtiesAr: 'مشروبات ساخنة، قهوة، شاي، سلع استهلاكية بالجملة',
      specialtiesEn: 'Coffee, Tea, Beverages & FMCG Wholesale',
      badgeAr: 'موزع معتمد ✓',
      badgeEn: 'Verified Distributor ✓'
    };
  }

  if (supplierId === 'supp_baghdad_hub') {
    const base = WHOLESALE_SUPPLIERS.find((s) => s.id === 'supp_jamila') || WHOLESALE_SUPPLIERS[1];
    return {
      ...base,
      id: 'supp_baghdad_hub',
      nameAr: supplierName || 'مجمع بغداد للمواد الاستهلاكية والتوزيع',
      nameEn: 'Baghdad Consumer Goods & Distribution Hub',
      districtAr: supplierCity || base.districtAr,
      districtEn: supplierCity || base.districtEn,
      specialtiesAr: 'مواد تموينية، منظفات، ألبان، معلبات، حبوب',
      specialtiesEn: 'Groceries, Cleaning, Dairy, Canned & Grains',
      badgeAr: 'مجمع جملة معتمد ✓',
      badgeEn: 'Verified Wholesale Hub ✓'
    };
  }

  const fallback = WHOLESALE_SUPPLIERS[0];
  return {
    ...fallback,
    id: supplierId,
    nameAr: supplierName || fallback.nameAr,
    nameEn: supplierName || fallback.nameEn,
    districtAr: supplierCity || fallback.districtAr,
    districtEn: supplierCity || fallback.districtEn
  };
}

