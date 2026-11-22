import { StorageType, SupplierOffer, UnifiedProduct } from './types.ts';

type ImageProfile =
  | 'olive_oil'
  | 'cooking_oil'
  | 'rice_grains'
  | 'sugar_salt'
  | 'pasta'
  | 'canned_tomato'
  | 'canned_open'
  | 'sauces_spices'
  | 'dairy'
  | 'frozen'
  | 'meat'
  | 'beverages'
  | 'tea_coffee'
  | 'sweets_snacks'
  | 'biscuits'
  | 'breakfast'
  | 'baby_care'
  | 'bakery'
  | 'horeca'
  | 'cleaning'
  | 'personal_care'
  | 'paper'
  | 'packaging'
  | 'supermarket';

const PROFILE_IMAGES: Record<ImageProfile, [string, string, string, string]> = {
  olive_oil: [
    '/assets/images/carton_unit_olive_glass.jpg',
    '/assets/images/carton_olive_oil_open.jpg',
    '/assets/images/unit_olive_oil_bottle.jpg',
    '/assets/images/carton_olive_oil_stack.jpg'
  ],
  cooking_oil: [
    '/assets/images/carton_unit_sunflower_oil.jpg',
    '/assets/images/carton_olive_oil_open.jpg',
    '/assets/images/white_sunflower_oil.jpg',
    '/assets/images/carton_cooking_oil_main.jpg'
  ],
  rice_grains: [
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_rice_grain_bulk.jpg',
    '/assets/images/white_basmati_rice.jpg',
    '/assets/images/product_white_sugar_50kg.jpg'
  ],
  sugar_salt: [
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/product_white_sugar_50kg.jpg',
    '/assets/images/white_sugar_pack.jpg',
    '/assets/images/carton_rice_grain_bulk.jpg'
  ],
  pasta: [
    '/assets/images/carton_unit_pasta.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/white_pasta_pack.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg'
  ],
  canned_tomato: [
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/white_tomato_paste.jpg',
    '/assets/images/carton_canned_tomato_main.jpg'
  ],
  canned_open: [
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/white_canned_goods.jpg',
    '/assets/images/carton_canned_tomato_main.jpg'
  ],
  sauces_spices: [
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_sauces_spices_main.jpg',
    '/assets/images/unit_ketchup_bottle.jpg',
    '/assets/images/carton_canned_open_tins.jpg'
  ],
  dairy: [
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/carton_dairy_milk_main.jpg',
    '/assets/images/white_milk_powder.jpg',
    '/assets/images/unit_cheese_tub.jpg'
  ],
  frozen: [
    '/assets/images/carton_frozen_meat_main.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/white_pasta_pack.jpg',
    '/assets/images/carton_dairy_milk_main.jpg'
  ],
  meat: [
    '/assets/images/carton_frozen_meat_main.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/white_canned_goods.jpg',
    '/assets/images/carton_unit_tomato_paste.jpg'
  ],
  beverages: [
    '/assets/images/carton_unit_beverages.jpg',
    '/assets/images/carton_unit_water_pack.jpg',
    '/assets/images/carton_beverages_water_case.jpg',
    '/assets/images/carton_canned_open_tins.jpg'
  ],
  tea_coffee: [
    '/assets/images/carton_unit_tea_box.jpg',
    '/assets/images/carton_unit_coffee_jar.jpg',
    '/assets/images/white_ceylon_tea.jpg',
    '/assets/images/carton_tea_coffee_main.jpg'
  ],
  sweets_snacks: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/unit_biscuits_pack.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg'
  ],
  biscuits: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/unit_biscuits_pack.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg'
  ],
  breakfast: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/white_milk_powder.jpg',
    '/assets/images/carton_sauces_spices_main.jpg'
  ],
  baby_care: [
    '/assets/images/carton_baby_care_main.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/white_milk_powder.jpg',
    '/assets/images/carton_unit_tissues.jpg'
  ],
  bakery: [
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/white_sugar_pack.jpg',
    '/assets/images/product_white_sugar_50kg.jpg'
  ],
  horeca: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_unit_sunflower_oil.jpg',
    '/assets/images/carton_unit_tissues.jpg'
  ],
  cleaning: [
    '/assets/images/carton_unit_detergent.jpg',
    '/assets/images/carton_cleaning_detergent_main.jpg',
    '/assets/images/white_cleaner_bottles.jpg',
    '/assets/images/carton_unit_tissues.jpg'
  ],
  personal_care: [
    '/assets/images/carton_unit_personal_care.jpg',
    '/assets/images/carton_personal_care_main.jpg',
    '/assets/images/white_cleaner_bottles.jpg',
    '/assets/images/carton_unit_tissues.jpg'
  ],
  paper: [
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_paper_tissues_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_detergent.jpg'
  ],
  packaging: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/carton_unit_rice_bale.jpg'
  ],
  supermarket: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_unit_detergent.jpg'
  ]
};

/** Alternate lead thumbnails per profile so the 5 products in a branch each have a distinct visual look */
const PROFILE_SLOT_ALTS: Partial<Record<ImageProfile, [string, string, string, string, string]>> = {
  olive_oil: [
    '/assets/images/carton_unit_olive_glass.jpg',
    '/assets/images/carton_unit_olive_tin.jpg',
    '/assets/images/carton_olive_oil_open.jpg',
    '/assets/images/carton_olive_oil_stack.jpg',
    '/assets/images/carton_olive_oil_main.jpg'
  ],
  cooking_oil: [
    '/assets/images/carton_unit_sunflower_oil.jpg',
    '/assets/images/carton_cooking_oil_main.jpg',
    '/assets/images/carton_unit_olive_tin.jpg',
    '/assets/images/carton_olive_oil_open.jpg',
    '/assets/images/carton_olive_oil_stack.jpg'
  ],
  rice_grains: [
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_rice_grain_bulk.jpg',
    '/assets/images/product_white_sugar_50kg.jpg',
    '/assets/images/carton_unit_pasta.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  sugar_salt: [
    '/assets/images/product_white_sugar_50kg.jpg',
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_rice_grain_bulk.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  pasta: [
    '/assets/images/carton_unit_pasta.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg',
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  canned_tomato: [
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_canned_tomato_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  canned_open: [
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_canned_tomato_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  sauces_spices: [
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_sauces_spices_main.jpg',
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/carton_unit_olive_glass.jpg'
  ],
  dairy: [
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/carton_dairy_milk_main.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/carton_frozen_meat_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  beverages: [
    '/assets/images/carton_unit_beverages.jpg',
    '/assets/images/carton_unit_water_pack.jpg',
    '/assets/images/carton_beverages_water_case.jpg',
    '/assets/images/carton_unit_tea_box.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  tea_coffee: [
    '/assets/images/carton_unit_tea_box.jpg',
    '/assets/images/carton_unit_coffee_jar.jpg',
    '/assets/images/carton_tea_coffee_main.jpg',
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_snacks_open_packs.jpg'
  ],
  sweets_snacks: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg',
    '/assets/images/carton_unit_tea_box.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  biscuits: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/carton_snacks_biscuits_main.jpg',
    '/assets/images/carton_unit_coffee_jar.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  cleaning: [
    '/assets/images/carton_unit_detergent.jpg',
    '/assets/images/carton_cleaning_detergent_main.jpg',
    '/assets/images/carton_unit_personal_care.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  personal_care: [
    '/assets/images/carton_unit_personal_care.jpg',
    '/assets/images/carton_personal_care_main.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_unit_detergent.jpg',
    '/assets/images/carton_paper_tissues_main.jpg'
  ],
  paper: [
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_paper_tissues_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_detergent.jpg',
    '/assets/images/carton_unit_personal_care.jpg'
  ],
  frozen: [
    '/assets/images/carton_frozen_meat_main.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/carton_dairy_milk_main.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_snacks_open_packs.jpg'
  ],
  meat: [
    '/assets/images/carton_frozen_meat_main.jpg',
    '/assets/images/carton_canned_open_tins.jpg',
    '/assets/images/carton_unit_tomato_paste.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  breakfast: [
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/carton_unit_tea_box.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_snacks_open_packs.jpg'
  ],
  baby_care: [
    '/assets/images/carton_baby_care_main.jpg',
    '/assets/images/carton_unit_milk_powder.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_unit_personal_care.jpg',
    '/assets/images/carton_paper_tissues_main.jpg'
  ],
  bakery: [
    '/assets/images/carton_unit_rice_bale.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/product_white_sugar_50kg.jpg',
    '/assets/images/carton_unit_pasta.jpg',
    '/assets/images/carton_horeca_packaging_main.jpg'
  ],
  horeca: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_sauces.jpg',
    '/assets/images/carton_unit_sunflower_oil.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_unit_beverages.jpg'
  ],
  packaging: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_paper_tissues_main.jpg',
    '/assets/images/carton_snacks_open_packs.jpg',
    '/assets/images/carton_unit_rice_bale.jpg'
  ],
  supermarket: [
    '/assets/images/carton_horeca_packaging_main.jpg',
    '/assets/images/carton_unit_tissues.jpg',
    '/assets/images/carton_unit_biscuits.jpg',
    '/assets/images/carton_unit_detergent.jpg',
    '/assets/images/carton_paper_tissues_main.jpg'
  ]
};

interface BranchSeedSpec {
  category: string;
  subCategory: string;
  subCategoryEn: string;
  profile: ImageProfile;
  storageType: StorageType;
  isPerishable?: boolean;
  basePriceIQD: number;
  brands: [string, string, string, string, string];
  origins: [string, string, string, string, string];
  /** Custom 5-product overrides for key flagship branches */
  customItems?: Array<{
    nameAr: string;
    nameEn: string;
    brand: string;
    unit: string;
    packSize: string;
    packageQuantity: number;
    priceIQD: number;
    origin: string;
    descriptionAr: string;
    images?: [string, string, string, string];
  }>;
}

const BRANCH_SPECS: BranchSeedSpec[] = [
  // ================= 01 Pantry Staples =================
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'أرز',
    subCategoryEn: 'Basmati & Long-Grain Rice',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 32000,
    brands: ['أبو خروف الذهبي', 'محمود الملكي', 'بوابة الهند', 'دجلة الخير', 'سنابل الفرات'],
    origins: ['الهند', 'الهند', 'باكستان', 'تايلاند', 'فيتنام']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'سكر ومحليات',
    subCategoryEn: 'Refined Sugar & Sweeteners',
    profile: 'sugar_salt',
    storageType: 'dry',
    basePriceIQD: 34000,
    brands: ['الاتحاد التكرير', 'الأسرة الذهبية', 'الرافدين سويت', 'بلور الخليج', 'تروبيكانا'],
    origins: ['العراق', 'البرازيل', 'الإمارات', 'تركيا', 'ماليزيا']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'طحين ونشويات',
    subCategoryEn: 'Wheat Flour & Cornstarch',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 24000,
    brands: ['مطاحن الفاو', 'السنبلة الذهبية', 'الكويتية للدقيق', 'الأناضول', 'بغداد برو'],
    origins: ['العراق', 'تركيا', 'الكويت', 'الأردن', 'الإمارات']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'بقوليات',
    subCategoryEn: 'Dried Lentils, Chickpeas & Beans',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 28000,
    brands: ['الواحة الخضراء', 'خير الشورجة', 'الريان للحبوب', 'تلال الأناضول', 'الأمير الذهبي'],
    origins: ['تركيا', 'كندا', 'أستراليا', 'العراق', 'الهند']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'حبوب وبرغل وكسكس',
    subCategoryEn: 'Bulgur, Freekeh & Couscous',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 25500,
    brands: ['دورو تركي', 'بشائر الشام', 'الميزان الذهبي', 'أرض الخير', 'مزارع نينوى'],
    origins: ['تركيا', 'لبنان', 'الأردن', 'المغرب', 'العراق']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'مكرونة وشعرية ونودلز',
    subCategoryEn: 'Pasta, Vermicelli & Instant Noodles',
    profile: 'pasta',
    storageType: 'dry',
    basePriceIQD: 19500,
    brands: ['باريلا فينيسيا', 'إندومي الشرق', 'باستازارا', 'أنقرة باستا', 'بانزاني'],
    origins: ['إيطاليا', 'إندونيسيا', 'تركيا', 'فرنسا', 'السعودية']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'ملح',
    subCategoryEn: 'Iodized & Sea Cooking Salt',
    profile: 'sugar_salt',
    storageType: 'dry',
    basePriceIQD: 11000,
    brands: ['ملح البصرة النقي', 'ساسا الفاخر', 'البحر الأزرق', 'الرافدين ميود', 'هملايا نيتشر'],
    origins: ['العراق', 'الأردن', 'تركيا', 'السعودية', 'باكستان']
  },
  {
    category: 'مواد غذائية أساسية',
    subCategory: 'مواد الطبخ والخبز الأساسية',
    subCategoryEn: 'Baking Powder, Yeast & Cooking Basics',
    profile: 'bakery',
    storageType: 'dry',
    basePriceIQD: 22000,
    brands: ['فوستر كلاركس', 'دكتور أوتكر', 'بايكرز شيف', 'البيان للمخبوزات', 'رويال كلاسيك'],
    origins: ['الإمارات', 'ألمانيا', 'تركيا', 'لبنان', 'مصر']
  },

  // ================= 02 Oils, Ghee & Fats =================
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيت دوار الشمس',
    subCategoryEn: 'Pure Sunflower Cooking Oil',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 35000,
    brands: ['عافية الفرات', 'التونسا الذهبي', 'نور النقي', 'أوركيد أيل', 'دجلة كولد'],
    origins: ['العراق', 'تركيا', 'الإمارات', 'أوكرانيا', 'الأردن']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيت الذرة',
    subCategoryEn: 'Pure Golden Corn Oil',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 39000,
    brands: ['مازولا برو', 'عافية الذرة', 'شمس الخليج', 'حياة النقي', 'الفرات الذهبي'],
    origins: ['السعودية', 'تركيا', 'الأردن', 'الإمارات', 'العراق']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيت النخيل',
    subCategoryEn: 'Refined Palm Olein Frying Oil',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 29500,
    brands: ['أولين ماليزيا', 'الدار برو', 'سوبر فراي', 'جولدن بالم', 'شمس البصرة'],
    origins: ['ماليزيا', 'إندونيسيا', 'تركيا', 'الإمارات', 'الأردن']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيت الصويا والزيوت النباتية',
    subCategoryEn: 'Soybean & Blended Vegetable Oil',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 31500,
    brands: ['دلال نباتي', 'هالة بيور', 'الخير نباتي', 'نسيم الشرق', 'الواحة بليند'],
    origins: ['الأردن', 'تركيا', 'الإمارات', 'مصر', 'العراق']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيت الزيتون',
    subCategoryEn: 'Extra Virgin & Pure Olive Oil',
    profile: 'olive_oil',
    storageType: 'ambient',
    basePriceIQD: 74000,
    brands: ['رافاييل سالغادو (RS)', 'بساتين الأندلس', 'تلال بعشيقة', 'كاربونيلي', 'زيتون عجلون'],
    origins: ['إسبانيا', 'إسبانيا', 'العراق', 'إيطاليا', 'الأردن'],
    customItems: [
      {
        nameAr: 'زيت زيتون بكر ممتاز معصور على البارد (كرتون 12 × 1 لتر زجاج)',
        nameEn: 'Extra Virgin Cold-Pressed Olive Oil (Carton 12 x 1L Glass)',
        brand: 'رافاييل سالغادو (RS)',
        unit: 'كرتون (12 × 1 لتر)',
        packSize: '12 × 1 لتر',
        packageQuantity: 12,
        priceIQD: 92000,
        origin: 'إسبانيا',
        descriptionAr: 'كرتون جملة معتمد يحتوي على 12 قنينة زجاجية داكنة لحفظ النكهة والفيتامينات، مثالي للسوبرماركت والمطاعم الفاخرة.',
        images: [
          '/assets/images/carton_unit_olive_glass.jpg',
          '/assets/images/carton_olive_oil_open.jpg',
          '/assets/images/unit_olive_oil_bottle.jpg',
          '/assets/images/carton_olive_oil_stack.jpg'
        ]
      },
      {
        nameAr: 'زيت زيتون متوسطي بكر بعبوة تنك ذهبي (كرتون 6 × 2 لتر)',
        nameEn: 'Mediterranean Virgin Olive Oil Golden Tin Case (6 x 2L)',
        brand: 'بساتين الأندلس',
        unit: 'كرتون (6 × 2 لتر)',
        packSize: '6 × 2 لتر',
        packageQuantity: 6,
        priceIQD: 86000,
        origin: 'إسبانيا',
        descriptionAr: 'كرتون جملة مكون من 6 تنكات معدنية محكمة الإغلاق تحمي زيت الزيتون من الضوء والحرارة طوال فترة العرض.',
        images: [
          '/assets/images/carton_unit_olive_tin.jpg',
          '/assets/images/carton_olive_oil_open.jpg',
          '/assets/images/unit_olive_oil_bottle.jpg',
          '/assets/images/carton_olive_oil_stack.jpg'
        ]
      },
      {
        nameAr: 'زيت زيتون عراقي عصرة أولى تلال بعشيقة (كرتون 12 × 750 مل)',
        nameEn: 'Bashiqa First-Press Iraqi Olive Oil Carton (12 x 750ml)',
        brand: 'تلال بعشيقة',
        unit: 'كرتون (12 × 750 مل)',
        packSize: '12 × 750 مل',
        packageQuantity: 12,
        priceIQD: 74000,
        origin: 'العراق',
        descriptionAr: 'إنتاج محلي نقي من بساتين نينوى معبأ في كرتون شحن مقوى مع فواصل حماية داخلية لسلامة التوزيع.',
        images: [
          '/assets/images/carton_olive_oil_open.jpg',
          '/assets/images/carton_unit_olive_glass.jpg',
          '/assets/images/unit_olive_oil_bottle.jpg',
          '/assets/images/carton_olive_oil_stack.jpg'
        ]
      },
      {
        nameAr: 'زيت زيتون إيطالي للطبخ والسلطات كاربونيلي (كرتون 12 × 500 مل)',
        nameEn: 'Italian Pure Olive Oil Wholesale Case (12 x 500ml)',
        brand: 'كاربونيلي',
        unit: 'كرتون (12 × 500 مل)',
        packSize: '12 × 500 مل',
        packageQuantity: 12,
        priceIQD: 61500,
        origin: 'إيطاليا',
        descriptionAr: 'عبوات 500 مل سريعة الدوران لأرفف السوبرماركت، معبأة في كرتون جملة قياسي جاهز للعرض.',
        images: [
          '/assets/images/carton_olive_oil_stack.jpg',
          '/assets/images/carton_unit_olive_glass.jpg',
          '/assets/images/unit_olive_oil_bottle.jpg',
          '/assets/images/carton_olive_oil_open.jpg'
        ]
      },
      {
        nameAr: 'زيت زيتون ترف اقتصادي للمطاعم والفنادق HORECA (كرتون 4 × 4 لتر)',
        nameEn: 'Chef Pomace Olive Oil Foodservice Bulk Carton (4 x 4L)',
        brand: 'زيتون عجلون',
        unit: 'كرتون (4 × 4 لتر)',
        packSize: '4 × 4 لتر',
        packageQuantity: 4,
        priceIQD: 79000,
        origin: 'الأردن',
        descriptionAr: 'جالونات اقتصادية مخصصة للمطابخ التجارية والمخابز في كرتون جملة متين يتحمل التكديس.',
        images: [
          '/assets/images/carton_olive_oil_main.jpg',
          '/assets/images/carton_unit_olive_tin.jpg',
          '/assets/images/unit_olive_oil_bottle.jpg',
          '/assets/images/carton_olive_oil_stack.jpg'
        ]
      }
    ]
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'سمن نباتي',
    subCategoryEn: 'Pure Vegetable Ghee',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 38000,
    brands: ['الدار الذهبي', 'جنتي نباتي', 'بيزيم تيرياغ', 'شمسين', 'الرافدين سمن'],
    origins: ['العراق', 'تركيا', 'السعودية', 'الإمارات', 'الأردن']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'سمن حيواني وزبدة سمن',
    subCategoryEn: 'Pure Animal & Butter Ghee',
    profile: 'dairy',
    storageType: 'ambient',
    basePriceIQD: 88000,
    brands: ['المراعي سمن حر', 'أصيل الدهن الحر', 'الأصايل العراقية', 'كي بي آي النيوزيلندي', 'البقرة الذهبية'],
    origins: ['السعودية', 'نيوزيلندا', 'العراق', 'هولندا', 'الهند']
  },
  {
    category: 'زيوت وسمن ودهون',
    subCategory: 'زيوت القلي المهنية',
    subCategoryEn: 'Heavy-Duty HORECA Frying Oil',
    profile: 'cooking_oil',
    storageType: 'ambient',
    basePriceIQD: 46000,
    brands: ['ريستو ماكس', 'شيف فراي برو', 'جولدن كيتشن', 'دجلة هوريكا', 'كريستال فراي'],
    origins: ['تركيا', 'ماليزيا', 'الإمارات', 'السعودية', 'العراق']
  },

  // ================= 03 Canned & Preserved Foods =================
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'خضار معلبة',
    subCategoryEn: 'Canned Sweet Corn, Peas & Mushrooms',
    profile: 'canned_open',
    storageType: 'ambient',
    basePriceIQD: 29000,
    brands: ['حدائق كاليفورنيا', 'العلالي', 'المرجان الخضراء', 'تات التركية', 'بوندويل'],
    origins: ['تايلاند', 'الصين', 'تركيا', 'فرنسا', 'الإمارات']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'بقوليات معلبة',
    subCategoryEn: 'Canned Fava Beans, Chickpeas & Kidney Beans',
    profile: 'canned_open',
    storageType: 'ambient',
    basePriceIQD: 26500,
    brands: ['حدائق كاليفورنيا', 'قها المعلبات', 'كورتاس', 'الدار فودز', 'لونا فوول'],
    origins: ['الإمارات', 'مصر', 'لبنان', 'السعودية', 'تركيا']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'تونة وأسماك معلبة',
    subCategoryEn: 'Canned Light Tuna & Sardines',
    profile: 'canned_open',
    storageType: 'ambient',
    basePriceIQD: 51000,
    brands: ['المرجان الخليجي', 'سيرين التايلندية', 'الخير البحري', 'جون ويست', 'ريو ماري'],
    origins: ['تايلاند', 'المغرب', 'إندونيسيا', 'إيطاليا', 'فيتنام']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'لحوم معلبة',
    subCategoryEn: 'Halal Luncheon Meat & Corned Beef',
    profile: 'canned_tomato',
    storageType: 'ambient',
    basePriceIQD: 44000,
    brands: ['روبرتسون حلال', 'سينيورا دجاج', 'أمريكانا لحوم', 'البدر حلال', 'لونا بييف'],
    origins: ['الأردن', 'البرازيل', 'تركيا', 'الإمارات', 'الدنمارك']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'معجون وصلصة الطماطم',
    subCategoryEn: 'Double-Concentrated Tomato Paste',
    profile: 'canned_tomato',
    storageType: 'ambient',
    basePriceIQD: 39000,
    brands: ['لونا بغداد', 'زير التركي', 'التونسا', 'بيرغوت', 'الممتاز العراقي'],
    origins: ['تركيا', 'العراق', 'إيران', 'إيطاليا', 'الإمارات']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'فواكه معلبة',
    subCategoryEn: 'Canned Pineapple, Peaches & Fruit Cocktail',
    profile: 'canned_open',
    storageType: 'ambient',
    basePriceIQD: 37500,
    brands: ['دول فواكه', 'ديلمونتي', 'رويال فروت', 'العلالي شرائح', 'صن بيتش'],
    origins: ['الفلبين', 'اليونان', 'تايلاند', 'جنوب أفريقيا', 'الصين']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'مخللات وزيتون',
    subCategoryEn: 'Table Olives & Gourmet Pickles',
    profile: 'canned_open',
    storageType: 'ambient',
    basePriceIQD: 33000,
    brands: ['كوبيلي الإسباني', 'بيراك للطرشي', 'كورتاس', 'طرشي أربيل الفاخر', 'البستان'],
    origins: ['إسبانيا', 'تركيا', 'لبنان', 'العراق', 'الأردن']
  },
  {
    category: 'معلبات وأغذية محفوظة',
    subCategory: 'وجبات جاهزة معلبة',
    subCategoryEn: 'Canned Stuffed Vine Leaves & Ready Dishes',
    profile: 'canned_tomato',
    storageType: 'ambient',
    basePriceIQD: 41000,
    brands: ['درة الشام', 'المذاق الشرقي', 'يمامي', 'شتورة', 'بساتين دجلة'],
    origins: ['لبنان', 'الأردن', 'تركيا', 'سوريا', 'العراق']
  },

  // ================= 04 Sauces, Spices & Seasonings =================
  {
    category: 'صلصات وتوابل',
    subCategory: 'كاتشب ومايونيز',
    subCategoryEn: 'Tomato Ketchup & Creamy Mayonnaise',
    profile: 'sauces_spices',
    storageType: 'ambient',
    basePriceIQD: 28000,
    brands: ['هاينز كلاسيك', 'هيلمانز', 'لونا صوص', 'تات كاتشب', 'قودي'],
    origins: ['تركيا', 'الإمارات', 'مصر', 'السعودية', 'الأردن']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'مستردة وصلصات حارة',
    subCategoryEn: 'Dijon Mustard & Hot Chili Sauces',
    profile: 'sauces_spices',
    storageType: 'ambient',
    basePriceIQD: 25000,
    brands: ['رنا حار', 'كريستال', 'تاباسكو', 'فرينشز مسترد', 'سيراشا برو'],
    origins: ['السعودية', 'الولايات المتحدة', 'تايلاند', 'تركيا', 'مصر']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'صلصات الطبخ والبيتزا والمعكرونة',
    subCategoryEn: 'Pizza, Pasta & BBQ Cooking Sauces',
    profile: 'sauces_spices',
    storageType: 'ambient',
    basePriceIQD: 31000,
    brands: ['باريلا صوص', 'كرافت باربكيو', 'بانزاني نابولي', 'إندوفود', 'شيف إيتالي'],
    origins: ['إيطاليا', 'تركيا', 'فرنسا', 'الإمارات', 'الولايات المتحدة']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'صويا وخل ودبس',
    subCategoryEn: 'Soy Sauce, Vinegar & Pomegranate Molasses',
    profile: 'sauces_spices',
    storageType: 'ambient',
    basePriceIQD: 24000,
    brands: ['كيكومان', 'يمامي دبس الرمان', 'الدرة خل طبيعي', 'بيدر', 'المذاق العراقي'],
    origins: ['تركيا', 'لبنان', 'الصين', 'اليابان', 'الأردن']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'بهارات وتوابل',
    subCategoryEn: 'Ground Black Pepper, Cumin & Turmeric',
    profile: 'sauces_spices',
    storageType: 'dry',
    basePriceIQD: 36000,
    brands: ['بهارات الشورجة الملكية', 'الإسناد', 'مهران', 'بغداد سبايس', 'أسد الشرق'],
    origins: ['العراق', 'الهند', 'السعودية', 'باكستان', 'إيران']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'أعشاب مجففة',
    subCategoryEn: 'Dried Thyme, Oregano & Mint',
    profile: 'sauces_spices',
    storageType: 'dry',
    basePriceIQD: 22000,
    brands: ['أعشاب الشام', 'بغداد هيربز', 'أرض الفرات', 'العلالي', 'بيدر'],
    origins: ['الأردن', 'تركيا', 'لبنان', 'العراق', 'مصر']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'مكعبات مرق ومحسنات نكهة',
    subCategoryEn: 'Chicken & Beef Bouillon Stock Cubes',
    profile: 'sauces_spices',
    storageType: 'dry',
    basePriceIQD: 27000,
    brands: ['ماجي الأصلي', 'كنور برو', 'العلالي مرق', 'بايو سافور', 'الدار مرق'],
    origins: ['الإمارات', 'تركيا', 'السعودية', 'ألمانيا', 'الأردن']
  },
  {
    category: 'صلصات وتوابل',
    subCategory: 'خلطات الطبخ',
    subCategoryEn: 'Biryani, Shawarma & Mandi Spice Mixes',
    profile: 'sauces_spices',
    storageType: 'dry',
    basePriceIQD: 30000,
    brands: ['شان الباكستانية', 'الإسناد', 'مطبخ الرافدين', 'مهران', 'الشرق الأصيل'],
    origins: ['باكستان', 'السعودية', 'العراق', 'الأردن', 'تركيا']
  },

  // ================= 05 Dairy & Eggs =================
  {
    category: 'ألبان وبيض',
    subCategory: 'حليب طازج',
    subCategoryEn: 'Chilled Fresh Full-Cream Milk',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 18500,
    brands: ['المراعي الطازج', 'كي دي دي', 'ألبان أربيل', 'نادك', 'روابي'],
    origins: ['السعودية', 'الكويت', 'العراق', 'الأردن', 'الإمارات']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'حليب طويل الأجل',
    subCategoryEn: 'UHT Long-Life Full Cream Milk',
    profile: 'dairy',
    storageType: 'ambient',
    basePriceIQD: 21000,
    brands: ['كي دي دي الطويل', 'المراعي يو إتش تي', 'الصافي', 'لونا حليب', 'ندى'],
    origins: ['الكويت', 'السعودية', 'الإمارات', 'تركيا', 'ألمانيا']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'حليب بودرة ومبخر ومكثف',
    subCategoryEn: 'Instant Milk Powder, Evaporated & Condensed Milk',
    profile: 'dairy',
    storageType: 'dry',
    isPerishable: true,
    basePriceIQD: 54000,
    brands: ['الرافدين الذهبي', 'نيدو فورتي', 'أبو قوس', 'أنكور النيوزيلندي', 'لونا المكثف'],
    origins: ['هولندا', 'سويسرا', 'نيوزيلندا', 'الإمارات', 'تركيا']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'لبن وزبادي ولبنة',
    subCategoryEn: 'Fresh Yogurt, Laban Ayran & Strained Labneh',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 19500,
    brands: ['سوتاش التركية', 'أربيل ديري', 'المراعي زبادي', 'بينار لبنة', 'الفرات الطازج'],
    origins: ['تركيا', 'العراق', 'السعودية', 'الأردن', 'الكويت']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'أجبان',
    subCategoryEn: 'Mozzarella, Cheddar, Cream & Feta Cheese',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 45000,
    brands: ['بوك الكريمية', 'كيري المربعات', 'بريزيدن الفرنسي', 'البقرة الضاحكة', 'موزاريلا الدار'],
    origins: ['الدنمارك', 'فرنسا', 'تركيا', 'السعودية', 'هولندا']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'قشطة وكريمة',
    subCategoryEn: 'Thick Qeshta, Cooking & Whipping Cream',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 32000,
    brands: ['كي دي دي قشطة', 'بوك كريمة الطبخ', 'المراعي قشطة', 'نستله', 'إلي وير للحلويات'],
    origins: ['الكويت', 'الدنمارك', 'السعودية', 'فرنسا', 'الإمارات']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'زبدة ومارجرين',
    subCategoryEn: 'Unsalted Pure Butter & Pastry Margarine',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 56000,
    brands: ['لورباك الدنماركية', 'بريزيدن زبدة', 'أنكور', 'فلورا مارجرين', 'ألفا بايستري'],
    origins: ['الدنمارك', 'فرنسا', 'نيوزيلندا', 'تركيا', 'هولندا']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'بيض',
    subCategoryEn: 'Farm-Fresh Grade-A Table Eggs',
    profile: 'dairy',
    storageType: 'chilled',
    isPerishable: true,
    basePriceIQD: 42000,
    brands: ['مزارع كربلاء', 'الفرات الذهبي', 'تلال الموصل', 'الواحة الطازج', 'سفان للبيض'],
    origins: ['العراق', 'العراق', 'العراق', 'تركيا', 'الإمارات']
  },
  {
    category: 'ألبان وبيض',
    subCategory: 'بدائل الحليب',
    subCategoryEn: 'Barista Oat, Almond & Soy Plant Milk',
    profile: 'dairy',
    storageType: 'ambient',
    basePriceIQD: 34000,
    brands: ['ألبرو الباريستا', 'أوتلي السويدي', 'نيتشرز أون', 'كوكو فريش', 'سوي برو'],
    origins: ['بلجيكا', 'السويد', 'إسبانيا', 'تايلاند', 'ألمانيا']
  },

  // ================= 06 Frozen Foods =================
  {
    category: 'مجمدات',
    subCategory: 'خضار مجمدة',
    subCategoryEn: 'IQF Frozen Green Peas, Okra & Mixed Veg',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 26000,
    brands: ['ساديا خضار', 'مونتانا المجمدة', 'أمريكانا', 'الفرات مجمدات', 'بون أبل'],
    origins: ['مصر', 'تركيا', 'الأردن', 'الصين', 'بلجيكا']
  },
  {
    category: 'مجمدات',
    subCategory: 'فواكه مجمدة',
    subCategoryEn: 'IQF Frozen Strawberries, Mango & Berries',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 31000,
    brands: ['مونتانا فواكه', 'فريش فروت كافيه', 'أربيل بيري', 'دول آي كيو إف', 'تروبيك فروست'],
    origins: ['مصر', 'تركيا', 'تشيلي', 'الفلبين', 'إسبانيا']
  },
  {
    category: 'مجمدات',
    subCategory: 'بطاطا مجمدة',
    subCategoryEn: 'Crispy Frozen French Fries & Potato Wedges',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 24500,
    brands: ['لامب ويستون', 'ماكين فنجر', 'أفيكو الهولندية', 'الفرات كرسبي', 'فارم فريتس'],
    origins: ['هولندا', 'بلجيكا', 'مصر', 'تركيا', 'الولايات المتحدة']
  },
  {
    category: 'مجمدات',
    subCategory: 'وجبات ومأكولات جاهزة مجمدة',
    subCategoryEn: 'Frozen Chicken Nuggets, Kubba & Burgers',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 38000,
    brands: ['أمريكانا هوريكا', 'الكفيل حلال', 'نبيل المجمدة', 'ساديا دجاج', 'دار الضيافة'],
    origins: ['العراق', 'الأردن', 'الإمارات', 'تركيا', 'السعودية']
  },
  {
    category: 'مجمدات',
    subCategory: 'عجائن ومعجنات مجمدة',
    subCategoryEn: 'Frozen Puff Pastry, Kunafa & Phyllo Dough',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 29000,
    brands: ['السرايا كنافة', 'أمريكانا بف باستري', 'الكرامة رول', 'أرض الحلويات', 'شيف دو'],
    origins: ['الإمارات', 'تركيا', 'لبنان', 'السعودية', 'الأردن']
  },
  {
    category: 'مجمدات',
    subCategory: 'آيس كريم وحلويات مجمدة',
    subCategoryEn: 'Bulk Ice Cream Tubs & Impulse Bars',
    profile: 'frozen',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 43000,
    brands: ['ماغنوم بولز', 'كي دي دي آيس كريم', 'فرات جيلاتو', 'لندن ديري', 'أولكر موطة'],
    origins: ['الكويت', 'تركيا', 'الإمارات', 'إيطاليا', 'المملكة المتحدة']
  },

  // ================= 07 Meat, Poultry & Seafood =================
  {
    category: 'لحوم ودواجن وأسماك',
    subCategory: 'لحوم حمراء',
    subCategoryEn: 'Halal Frozen Beef Cubes & Lamb Cuts',
    profile: 'meat',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 95000,
    brands: ['مزارع الفرات حلال', 'فريش كات البرازيلي', 'أمريكانا بيف', 'أرض الرافدين', 'الأسترالي الممتاز'],
    origins: ['البرازيل', 'أستراليا', 'الهند', 'الأردن', 'العراق']
  },
  {
    category: 'لحوم ودواجن وأسماك',
    subCategory: 'دجاج وديك رومي',
    subCategoryEn: 'Halal Whole Chicken & Skinless Breast Fillet',
    profile: 'meat',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 48000,
    brands: ['الكفيل العراقي', 'ساديا حلال', 'بيرديكس البرازيلي', 'بانفيت التركي', 'دواجن كربلاء'],
    origins: ['العراق', 'البرازيل', 'تركيا', 'الإمارات', 'الأردن']
  },
  {
    category: 'لحوم ودواجن وأسماك',
    subCategory: 'أسماك',
    subCategoryEn: 'Frozen White Fish Fillet & Salmon Portions',
    profile: 'meat',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 58000,
    brands: ['الخليج سيفود', 'باشا فيليه', 'نورسك سالمون', 'أسماك البصرة', 'المرجان البحري'],
    origins: ['فيتنام', 'النرويج', 'تركيا', 'الإمارات', 'عمان']
  },
  {
    category: 'لحوم ودواجن وأسماك',
    subCategory: 'مأكولات بحرية',
    subCategoryEn: 'Frozen Peeled Jumbo Shrimp & Seafood Mix',
    profile: 'meat',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 76000,
    brands: ['روبيان الخليج', 'الواحة البحرية', 'أوشين برو', 'سمك الفاو', 'تروبيك برونز'],
    origins: ['الهند', 'عمان', 'إيران', 'الإمارات', 'فيتنام']
  },
  {
    category: 'لحوم ودواجن وأسماك',
    subCategory: 'لحوم مصنعة',
    subCategoryEn: 'Halal Sausages, Burger Patties & Mortadella',
    profile: 'meat',
    storageType: 'frozen',
    isPerishable: true,
    basePriceIQD: 39000,
    brands: ['ساديا فرانكس', 'سنيورة حلال', 'نبيل برغر', 'أمريكانا لحوم', 'بيتي مورتديلا'],
    origins: ['الأردن', 'الإمارات', 'تركيا', 'البرازيل', 'العراق']
  },

  // ================= 08 Beverages =================
  {
    category: 'مشروبات',
    subCategory: 'مياه معدنية',
    subCategoryEn: 'Natural Mineral Bottled Water',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 3200,
    brands: ['مياه الواحة', 'أكوافينا النقية', 'مياه لايف', 'ينابيع شيرين', 'أروى'],
    origins: ['العراق', 'العراق', 'الإمارات', 'العراق', 'السعودية']
  },
  {
    category: 'مشروبات',
    subCategory: 'مياه شرب وجالونات',
    subCategoryEn: '5L & 19L Dispenser Drinking Water',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 4500,
    brands: ['مياه الرافدين', 'السماء الصافية', 'الواحة 5 لتر', 'مسافي', 'فرات بيور'],
    origins: ['العراق', 'العراق', 'الإمارات', 'العراق', 'الأردن']
  },
  {
    category: 'مشروبات',
    subCategory: 'مشروبات غازية',
    subCategoryEn: 'Carbonated Soft Drinks & Cola Cases',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 11500,
    brands: ['بيبسي كولا', 'سفن أب', 'ميرندا برتقال', 'كوكاكولا الأصلية', 'سبرايت ليمون'],
    origins: ['العراق', 'العراق', 'العراق', 'الأردن', 'الإمارات']
  },
  {
    category: 'مشروبات',
    subCategory: 'عصائر ونكتار',
    subCategoryEn: 'Fruit Juices & Pulp Nectar Cases',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 14500,
    brands: ['راني حبيبات', 'المراعي عصير', 'لاكنور الطبيعي', 'تروبيكانا', 'عصائر دجلة'],
    origins: ['السعودية', 'الإمارات', 'الأردن', 'تركيا', 'العراق']
  },
  {
    category: 'مشروبات',
    subCategory: 'مشروبات الطاقة',
    subCategoryEn: 'Energy Drink Wholesale Cans',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 28000,
    brands: ['ريد بول', 'تايجر إنرجي', 'وايلد تايجر', 'مونستر إكس', 'باور هورس'],
    origins: ['النمسا', 'العراق', 'الأردن', 'هولندا', 'ألمانيا']
  },
  {
    category: 'مشروبات',
    subCategory: 'مشروبات رياضية ووظيفية',
    subCategoryEn: 'Electrolyte Hydration & Isotonic Drinks',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 22000,
    brands: ['جاتوريد', 'باوريد أزرق', 'بوكاري سويت', 'فيتامين ويل', 'أكتيف سبورت'],
    origins: ['الإمارات', 'تركيا', 'اليابان', 'ألمانيا', 'المملكة المتحدة']
  },
  {
    category: 'مشروبات',
    subCategory: 'شراب مركز ومشروبات بودرة',
    subCategoryEn: 'Fruit Cordials & Instant Powder Drinks',
    profile: 'beverages',
    storageType: 'dry',
    basePriceIQD: 26000,
    brands: ['فيمتو التوت', 'تانج برتقال', 'سن كويك', 'شراب الورد العراقي', 'ديل مونتي سيروب'],
    origins: ['السعودية', 'البحرين', 'الدنمارك', 'العراق', 'تركيا']
  },
  {
    category: 'مشروبات',
    subCategory: 'مشروبات شعير غير كحولية',
    subCategoryEn: 'Non-Alcoholic Flavored Malt Drinks',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 16500,
    brands: ['باربيكان شعير', 'موسي السويسري', 'هولستن', 'لازينا', 'باواريا مالت'],
    origins: ['الإمارات', 'سويسرا', 'ألمانيا', 'الأردن', 'هولندا']
  },
  {
    category: 'مشروبات',
    subCategory: 'مشروبات خالية من السكر',
    subCategoryEn: 'Zero-Sugar & Diet Beverages',
    profile: 'beverages',
    storageType: 'ambient',
    basePriceIQD: 12000,
    brands: ['بيبسي ماكس', 'كوكا زيرو', 'سفن أب فري', 'راني لايت', 'ريد بول شوغر فري'],
    origins: ['العراق', 'الأردن', 'الإمارات', 'السعودية', 'النمسا']
  },

  // ================= 09 Tea & Coffee =================
  {
    category: 'شاي وقهوة',
    subCategory: 'شاي أسود',
    subCategoryEn: 'Ceylon Loose Leaf Black Tea',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 68000,
    brands: ['شاي الكردي سيلان', 'شاي الغزالين', 'شاي أحمد تي', 'شاي محمود', 'شاي الوزة'],
    origins: ['سريلانكا', 'سريلانكا', 'المملكة المتحدة', 'سريلانكا', 'الأردن']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'شاي أخضر وأعشاب',
    subCategoryEn: 'Green Tea, Chamomile & Mint Infusions',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 39000,
    brands: ['توينينجز أعشاب', 'ليبتون أخضر', 'دغدغ التركية', 'أحمد تي بالنعناع', 'بابل هيربس'],
    origins: ['المملكة المتحدة', 'الإمارات', 'تركيا', 'سريلانكا', 'العراق']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'شاي أكياس',
    subCategoryEn: 'Black Tea Enveloped & Pyramid Bags',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 42000,
    brands: ['ليبتون العلامة الصفراء', 'أحمد تي إيرل غراي', 'ديلما سيلان', 'الكبوس', 'محمود فتلة'],
    origins: ['الإمارات', 'المملكة المتحدة', 'سريلانكا', 'الأردن', 'تركيا']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'قهوة عربية وتركية',
    subCategoryEn: 'Cardamom Arabic & Fine-Ground Turkish Coffee',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 52000,
    brands: ['العميد بالهيل', 'محمد أفندي التركية', 'النجار الأصلية', 'الحموي', 'بغداد كافيه'],
    origins: ['الأردن', 'تركيا', 'لبنان', 'سوريا', 'العراق']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'حبوب كاملة',
    subCategoryEn: 'Roasted Espresso Whole Coffee Beans',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 54000,
    brands: ['فيرارا الإيطالية', 'لافاتزا سوبر كريما', 'إيلي ترييستي', 'سيغافريدو', 'كيمبو'],
    origins: ['إيطاليا', 'إيطاليا', 'إيطاليا', 'ألمانيا', 'تركيا']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'القهوة المقطرة',
    subCategoryEn: 'Filter Drip & Pour-Over Roast Coffee',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 44000,
    brands: ['دالماير برودومو', 'أمباسادور', 'تشيبو جولد', 'ستاربكس بايك بليس', 'موكونا'],
    origins: ['ألمانيا', 'سويسرا', 'ألمانيا', 'هولندا', 'الولايات المتحدة']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'أرابيكا',
    subCategoryEn: '100% Single-Origin Arabica Roast',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 58000,
    brands: ['لافاتزا أورو', 'فيرارا أرابيكا', 'كولومبيا سوبريمو', 'إثيوبيا ييرغاشيف', 'جاكوبس كرونونج'],
    origins: ['إيطاليا', 'كولومبيا', 'إثيوبيا', 'ألمانيا', 'سويسرا']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'سريعة التحضير',
    subCategoryEn: 'Instant Freeze-Dried Coffee & 3-in-1 Sticks',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 35000,
    brands: ['نسكافيه جولد', 'جاكوبس مونارك', 'ماكسويل هاوس', 'دافيدوف ريتش', 'كلاسينو 3×1'],
    origins: ['سويسرا', 'ألمانيا', 'هولندا', 'بولندا', 'ماليزيا']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'كبسولات سريعة',
    subCategoryEn: 'Aluminum Espresso & Latte Coffee Pods',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 38000,
    brands: ['نسكافيه دولتشي', 'لور إسبريسو', 'إيلي كبسول', 'ستاربكس بودز', 'لافاتزا إيكو'],
    origins: ['سويسرا', 'فرنسا', 'إيطاليا', 'المملكة المتحدة', 'إسبانيا']
  },
  {
    category: 'شاي وقهوة',
    subCategory: 'كاكاو وسحلب ومشروبات ساخنة',
    subCategoryEn: 'Hot Chocolate, Cocoa Powder & Orchid Sahlab',
    profile: 'tea_coffee',
    storageType: 'dry',
    basePriceIQD: 29000,
    brands: ['نسكويك كاكاو', 'كادبوري هوت شوكليت', 'أولكر كاكاو', 'سحلب الشام', 'هنتز كاكاو'],
    origins: ['ألمانيا', 'تركيا', 'المملكة المتحدة', 'الأردن', 'هولندا']
  },

  // ================= 10 Confectionery & Chocolate =================
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'شوكولاتة',
    subCategoryEn: 'Creamy Milk & Dark Chocolate Tablets',
    profile: 'sweets_snacks',
    storageType: 'controlled',
    basePriceIQD: 42000,
    brands: ['جالكسي السلسة', 'ميلكا الألبية', 'كادبوري ديري ميلك', 'ليندت سويس', 'أولكر شوكولاتة'],
    origins: ['الإمارات', 'سويسرا', 'المملكة المتحدة', 'ألمانيا', 'تركيا']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'ألواح',
    subCategoryEn: 'Display Cases of Impulse Chocolate Bars',
    profile: 'sweets_snacks',
    storageType: 'controlled',
    basePriceIQD: 36000,
    brands: ['سنيكرز فستق', 'تويكس كراميل', 'كيت كات', 'مارس كلاسيك', 'باونتي جوز الهند'],
    origins: ['الإمارات', 'تركيا', 'هولندا', 'مصر', 'ألمانيا']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'سكاكر وحلوى',
    subCategoryEn: 'Fruit Drops, Lollipops & Hard Candies',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 19500,
    brands: ['شوبا تشوبس', 'كوينت التركية', 'فوكس فروت', 'ستورك', 'توفيكس'],
    origins: ['تركيا', 'إسبانيا', 'إندونيسيا', 'ألمانيا', 'الأردن']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'علكة ونعناع',
    subCategoryEn: 'Sugar-Free Chewing Gum & Breath Mints',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 23000,
    brands: ['إكسترا نعناع', 'ترايدنت', 'منتوس فريش', 'فايف علكة', 'مضغ المستكة'],
    origins: ['الإمارات', 'تركيا', 'هولندا', 'المملكة المتحدة', 'العراق']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'جيلي ومارشميلو',
    subCategoryEn: 'Halal Gummy Bears & Fluffy Marshmallows',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 21000,
    brands: ['هاريبو حلال', 'بيبتو التركي', 'جيتي جيلي', 'راينبو مارشميلو', 'توب غامي'],
    origins: ['تركيا', 'الأردن', 'ألمانيا', 'إسبانيا', 'مصر']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'توفي وكراميل',
    subCategoryEn: 'Milk Toffee, Éclairs & Butterscotch',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 24500,
    brands: ['كادبوري إكليرز', 'توفي لوك', 'أولكر توفي', 'سيروب كراميل', 'الضيافة العراقية'],
    origins: ['تركيا', 'الهند', 'بولندا', 'العراق', 'الأردن']
  },
  {
    category: 'حلويات وشوكولاتة',
    subCategory: 'علب هدايا وحزم',
    subCategoryEn: 'Assorted Luxury Praline Gift Boxes',
    profile: 'sweets_snacks',
    storageType: 'controlled',
    basePriceIQD: 64000,
    brands: ['فيريرو روشيه', 'رفايلو', 'ميرسي الأوروبية', 'ميكينتوش كواليتي ستريت', 'باتشي جولدن'],
    origins: ['إيطاليا', 'ألمانيا', 'المملكة المتحدة', 'لبنان', 'الإمارات']
  },

  // ================= 11 Biscuits & Dry Bakery =================
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'بسكويت',
    subCategoryEn: 'Tea Biscuits, Digestive & Cream Sandwiches',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 22000,
    brands: ['أولكر الشاي', 'أوريو كلاسيك', 'ماكفيتيز دايجستف', 'غندور يمامة', 'بسكويت أبولو'],
    origins: ['تركيا', 'البحرين', 'السعودية', 'المملكة المتحدة', 'ماليزيا']
  },
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'ويفر',
    subCategoryEn: 'Crispy Hazelnut & Chocolate Wafer Packs',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 24000,
    brands: ['لواكر الإيطالي', 'إيتي هوبي', 'توداي ويفر', 'كيت كات تشانكي', 'لوتس ويفر'],
    origins: ['إيطاليا', 'تركيا', 'الإمارات', 'بلجيكا', 'مصر']
  },
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'كراكر',
    subCategoryEn: 'Salted, Cheese & Sesame Savory Crackers',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 20500,
    brands: ['توك المملح', 'ريتز كراكر', 'أولكر كرسبي', 'جاكوبس كريم', 'كرانشي مالح'],
    origins: ['تركيا', 'المملكة المتحدة', 'السعودية', 'ألمانيا', 'ماليزيا']
  },
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'كيك وكرواسون مغلف',
    subCategoryEn: 'Individually Wrapped Croissants & Swiss Rolls',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 25000,
    brands: ['سفن دايز كرواسون', 'لوزين كب كيك', 'توداي سويس رول', 'أولكر دانكيك', 'شوبو مافن'],
    origins: ['تركيا', 'السعودية', 'الإمارات', 'اليونان', 'الأردن']
  },
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'كعك ومعمول مغلف',
    subCategoryEn: 'Date-Filled Maamoul & Butter Cookies',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 27000,
    brands: ['الكرامة معمول بالتمر', 'أبو الهول كليجة', 'لوتس بيسكوف', 'أميريكانا كوكيز', 'ديمه بالتمر'],
    origins: ['السعودية', 'العراق', 'بلجيكا', 'الإمارات', 'تركيا']
  },
  {
    category: 'بسكويت ومخبوزات جافة',
    subCategory: 'توست وخبز طويل الأجل',
    subCategoryEn: 'Rusk Toast, Tortilla Wraps & Brioche',
    profile: 'biscuits',
    storageType: 'dry',
    basePriceIQD: 19000,
    brands: ['لوزين توست', 'ميشن تورتيلا', 'سوداني شابورة', 'بريد ماستر', 'إيتي توست'],
    origins: ['السعودية', 'الإمارات', 'تركيا', 'ألمانيا', 'الأردن']
  },

  // ================= 12 Snacks & Nuts =================
  {
    category: 'سناكات ومكسرات',
    subCategory: 'شيبس',
    subCategoryEn: 'Potato Chips & Tortilla Corn Crisps',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 18500,
    brands: ['ليز الكلاسيك', 'برينجلز الأصلية', 'دوريتوس ناتشو', 'بطاطا كتكو', 'شيبس بابل'],
    origins: ['السعودية', 'بلجيكا', 'تركيا', 'العراق', 'الأردن']
  },
  {
    category: 'سناكات ومكسرات',
    subCategory: 'فشار',
    subCategoryEn: 'Butter Microwave & Ready-Popped Corn',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 17000,
    brands: ['أميركان بوب كورن', 'بوب تايم بالزبدة', 'تاسال شامية', 'شيبس بوب', 'جولدن كيرنل'],
    origins: ['الولايات المتحدة', 'تركيا', 'الأردن', 'الإمارات', 'العراق']
  },
  {
    category: 'سناكات ومكسرات',
    subCategory: 'مكسرات',
    subCategoryEn: 'Roasted Pistachios, Cashews & Almonds',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 68000,
    brands: ['باجة للمكسرات', 'مكسرات أربيل', 'بيست مكس', 'الرفاعي', 'الأمير فستق'],
    origins: ['السعودية', 'إيران', 'العراق', 'تركيا', 'لبنان']
  },
  {
    category: 'سناكات ومكسرات',
    subCategory: 'بذور',
    subCategoryEn: 'Salted Sunflower & Pumpkin Seeds',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 29000,
    brands: ['الحب الشمسي الشامي', 'تاديم التركية', 'المجال لب أبيض', 'الأصيل محمص', 'سن فلاور برو'],
    origins: ['تركيا', 'سوريا', 'العراق', 'الأردن', 'الصين']
  },
  {
    category: 'سناكات ومكسرات',
    subCategory: 'فواكه مجففة وتمور',
    subCategoryEn: 'Iraqi Zahdi Dates, Raisins & Dried Figs',
    profile: 'rice_grains',
    storageType: 'dry',
    basePriceIQD: 33000,
    brands: ['تمور كربلاء الذهبية', 'تمور بتيل', 'بساتين البصرة', 'أرض الفرات مجفف', 'زبيب السليمانية'],
    origins: ['العراق', 'العراق', 'السعودية', 'تركيا', 'إيران']
  },
  {
    category: 'سناكات ومكسرات',
    subCategory: 'سناك صحي وألواح الطاقة',
    subCategoryEn: 'Protein Bars, Granola Bites & Rice Cakes',
    profile: 'sweets_snacks',
    storageType: 'dry',
    basePriceIQD: 39000,
    brands: ['نيتشر فالي', 'غرنيد بروتين', 'كويكر سناك', 'أورجانيك تريب', 'إيت ريل'],
    origins: ['إسبانيا', 'المملكة المتحدة', 'ألمانيا', 'الإمارات', 'تركيا']
  },

  // ================= 13 Breakfast & Spreads =================
  {
    category: 'الإفطار والمربى',
    subCategory: 'حبوب الإفطار',
    subCategoryEn: 'Corn Flakes, Choco Loops & Frosties',
    profile: 'breakfast',
    storageType: 'dry',
    basePriceIQD: 31000,
    brands: ['كيلوقز الأصلي', 'نستله نسكويك', 'كوكو بوبس', 'فيتنس نستله', 'كراون سيريال'],
    origins: ['المملكة المتحدة', 'الإمارات', 'تركيا', 'ألمانيا', 'الأردن']
  },
  {
    category: 'الإفطار والمربى',
    subCategory: 'شوفان وجرانولا وموسلي',
    subCategoryEn: 'Wholegrain Oats, Crunchy Granola & Muesli',
    profile: 'breakfast',
    storageType: 'dry',
    basePriceIQD: 28500,
    brands: ['كويكر الشوفان', 'هاهان الأوروبي', 'جوردنز جرانولا', 'العلالي شوفان', 'بيو موسلي'],
    origins: ['المملكة المتحدة', 'ألمانيا', 'الأردن', 'تركيا', 'هولندا']
  },
  {
    category: 'الإفطار والمربى',
    subCategory: 'عسل',
    subCategoryEn: 'Pure Natural Sidr & Blossom Honey',
    profile: 'breakfast',
    storageType: 'ambient',
    basePriceIQD: 69000,
    brands: ['الشفاء الطبيعي', 'لانجنيز الألماني', 'عسل جبال كردستان', 'وادي النحل', 'بالبارماك'],
    origins: ['السعودية', 'ألمانيا', 'العراق', 'تركيا', 'نيوزيلندا']
  },
  {
    category: 'الإفطار والمربى',
    subCategory: 'مربى',
    subCategoryEn: 'Strawberry, Apricot & Fig Fruit Jam',
    profile: 'breakfast',
    storageType: 'ambient',
    basePriceIQD: 29500,
    brands: ['هيرو السويسرية', 'فيتراك', 'تات مربى', 'بون مامان', 'بساتين دجلة'],
    origins: ['سويسرا', 'مصر', 'تركيا', 'فرنسا', 'العراق']
  },
  {
    category: 'الإفطار والمربى',
    subCategory: 'معجون الشوكولاتة والمكسرات',
    subCategoryEn: 'Hazelnut Cocoa & Smooth Peanut Butter',
    profile: 'breakfast',
    storageType: 'ambient',
    basePriceIQD: 46000,
    brands: ['نوتيلا بالبندق', 'لوتس بيسكوف سبريد', 'أميريكان غاردن', 'أولكر شوكوكريم', 'سكيبي بينت'],
    origins: ['بولندا', 'بلجيكا', 'تركيا', 'الولايات المتحدة', 'الإمارات']
  },
  {
    category: 'الإفطار والمربى',
    subCategory: 'طحينة وحلاوة ودبس',
    subCategoryEn: 'Sesame Tahini Rashi, Halawa & Date Syrup',
    profile: 'breakfast',
    storageType: 'ambient',
    basePriceIQD: 35000,
    brands: ['راشي البصرة', 'حلاوة الكسار', 'الدرة طحينية', 'دبس الفرات النقي', 'طعام الشام'],
    origins: ['العراق', 'الأردن', 'تركيا', 'لبنان', 'الإمارات']
  },

  // ================= 14 Baby Products =================
  {
    category: 'منتجات الأطفال',
    subCategory: 'حليب أطفال',
    subCategoryEn: 'Stage 1-3 Infant Formula Milk Powder',
    profile: 'baby_care',
    storageType: 'dry',
    isPerishable: true,
    basePriceIQD: 82000,
    brands: ['نان أوبتي برو', 'أبتاميل أدفانس', 'إس-26 جولد', 'سيميلاك كومفورت', 'بيبلاك'],
    origins: ['سويسرا', 'أيرلندا', 'هولندا', 'إسبانيا', 'فرنسا']
  },
  {
    category: 'منتجات الأطفال',
    subCategory: 'أغذية أطفال',
    subCategoryEn: 'Fruit Puree Jars & Infant Meals',
    profile: 'baby_care',
    storageType: 'ambient',
    basePriceIQD: 34000,
    brands: ['هيرو بيبي', 'جيربر العضوي', 'هيب أورجانيك', 'إيلاز كيتشن', 'نستله ناتورن'],
    origins: ['إسبانيا', 'ألمانيا', 'المملكة المتحدة', 'سويسرا', 'فرنسا']
  },
  {
    category: 'منتجات الأطفال',
    subCategory: 'حبوب أطفال',
    subCategoryEn: 'Wheat, Honey & Fruit Baby Cereals',
    profile: 'baby_care',
    storageType: 'dry',
    basePriceIQD: 38000,
    brands: ['سيريلاك بالقمح', 'هيب حبوب', 'بليميل بلس', 'أبتاميل سيريال', 'هيرو سيريال'],
    origins: ['سويسرا', 'إسبانيا', 'ألمانيا', 'الإمارات', 'تركيا']
  },
  {
    category: 'منتجات الأطفال',
    subCategory: 'عصائر وسناك أطفال',
    subCategoryEn: 'Teething Biscuits & Kids Fruit Pouches',
    profile: 'baby_care',
    storageType: 'ambient',
    basePriceIQD: 26000,
    brands: ['فارليز بسكويت', 'كابري صن', 'هيب باوتش', 'بلاسمون', 'لاكنور أطفال'],
    origins: ['المملكة المتحدة', 'إيطاليا', 'ألمانيا', 'تركيا', 'الإمارات']
  },
  {
    category: 'منتجات الأطفال',
    subCategory: 'حفاضات ومستلزمات',
    subCategoryEn: 'Jumbo Soft Baby Diapers & Care Packs',
    profile: 'baby_care',
    storageType: 'dry',
    basePriceIQD: 55000,
    brands: ['بامبرز بريميوم', 'مولفيكس التركي', 'هاجيز إكسترا', 'بيبي جوي', 'فاين بيبي'],
    origins: ['السعودية', 'تركيا', 'الإمارات', 'الأردن', 'ألمانيا']
  },

  // ================= 15 Bakery & Pastry Supplies =================
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'طحين متخصص',
    subCategoryEn: 'Commercial Bread, Pastry & Semolina Flour',
    profile: 'bakery',
    storageType: 'dry',
    basePriceIQD: 29000,
    brands: ['الفاو سبشيال', 'الطحان التركي', 'مطاحن الساحل', 'كابوتو 00', 'الشيف للأفران'],
    origins: ['تركيا', 'العراق', 'إيطاليا', 'الإمارات', 'الأردن']
  },
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'خميرة ومحسنات خبز',
    subCategoryEn: 'Instant Active Yeast & Bread Improvers',
    profile: 'bakery',
    storageType: 'dry',
    basePriceIQD: 34000,
    brands: ['ساف إنستانت', 'دورميسي المحسن', 'يومايا التركية', 'باكوماستر', 'الفرات خميرة'],
    origins: ['فرنسا', 'تركيا', 'بلجيكا', 'إندونيسيا', 'العراق']
  },
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'خلطات كيك وعجين',
    subCategoryEn: 'Commercial Sponge Cake & Waffle Premixes',
    profile: 'bakery',
    storageType: 'dry',
    basePriceIQD: 42000,
    brands: ['بوراتوس ميكس', 'أويا ماستر', 'بيلسبري', 'دكتور أوتكر برو', 'فوستر كلاركس'],
    origins: ['بلجيكا', 'تركيا', 'الولايات المتحدة', 'ألمانيا', 'الإمارات']
  },
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'شوكولاتة وكريمة تصنيع',
    subCategoryEn: 'Couverture Chocolate Blocks & Heavy Whipping Cream',
    profile: 'bakery',
    storageType: 'controlled',
    basePriceIQD: 62000,
    brands: ['كاليبو البلجيكية', 'فوساتو التركي', 'شانتي باك', 'فيستا كريمة', 'داتاسو'],
    origins: ['بلجيكا', 'تركيا', 'إيطاليا', 'الإمارات', 'الأردن']
  },
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'حشوات وصلصات حلويات',
    subCategoryEn: 'Pistachio, Caramel & Fruit Pastry Fillings',
    profile: 'bakery',
    storageType: 'ambient',
    basePriceIQD: 49000,
    brands: ['فو التركية', 'داون فودز', 'مونين توبينج', 'شيف صوص', 'الحلبي للفستق'],
    origins: ['تركيا', 'بلجيكا', 'فرنسا', 'الأردن', 'الإمارات']
  },
  {
    category: 'مواد المخابز والحلويات التجارية',
    subCategory: 'مواد تزيين',
    subCategoryEn: 'Rolled Fondant, Sprinkles & Mirror Glaze',
    profile: 'bakery',
    storageType: 'dry',
    basePriceIQD: 37000,
    brands: ['دكتور باستا', 'بوراتوس غليز', 'شوجر ديكور', 'ويلتون', 'رويال فوندانت'],
    origins: ['تركيا', 'بلجيكا', 'إيطاليا', 'الولايات المتحدة', 'الإمارات']
  },

  // ================= 16 Foodservice & Commercial Kitchen =================
  {
    category: 'مواد المطاعم والمطابخ التجارية',
    subCategory: 'عبوات صلصات وتوابل مهنية',
    subCategoryEn: '5L Gallon HORECA Sauces & Spice Tubs',
    profile: 'horeca',
    storageType: 'ambient',
    basePriceIQD: 39000,
    brands: ['هاينز هوريكا', 'كي بي سي برو', 'أونلي كيتشن', 'دجلة جالون', 'تات للمطاعم'],
    origins: ['تركيا', 'الإمارات', 'السعودية', 'الأردن', 'العراق']
  },
  {
    category: 'مواد المطاعم والمطابخ التجارية',
    subCategory: 'مواد طبخ بالجملة',
    subCategoryEn: 'Bulk Commercial Stocks, Rice & Cooking Staples',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 47000,
    brands: ['كنور بروفيشنال', 'شيف ماستر', 'الرافدين هوريكا', 'التونسا للمطاعم', 'سافور إكسبرس'],
    origins: ['ألمانيا', 'تركيا', 'العراق', 'الإمارات', 'السعودية']
  },
  {
    category: 'مواد المطاعم والمطابخ التجارية',
    subCategory: 'قفازات وأغطية رأس ومرايل',
    subCategoryEn: 'Food-Safe Nitrile Gloves, Caps & Aprons',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 32000,
    brands: ['سيف تاتش', 'كيتشن شيلد', 'برو غارد', 'النظافة الطبية', 'هايجين برو'],
    origins: ['ماليزيا', 'الصين', 'تركيا', 'الإمارات', 'تايلاند']
  },
  {
    category: 'مواد المطاعم والمطابخ التجارية',
    subCategory: 'مناديل ومنشفات مهنية',
    subCategoryEn: 'Maxi Rolls, Centerfeed & Dispenser Napkins',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 27000,
    brands: ['تورك برو', 'سانيتا هوريكا', 'فاين أوت أوف هوم', 'كلينكس برو', 'الورقية التجارية'],
    origins: ['تركيا', 'الأردن', 'لبنان', 'الإمارات', 'العراق']
  },
  {
    category: 'مواد المطاعم والمطابخ التجارية',
    subCategory: 'مستلزمات المطابخ',
    subCategoryEn: 'Heavy-Duty Aluminum Foil & PVC Cling Film',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 36000,
    brands: ['سانيتا فويل', 'باك برو', 'شيف راب', 'كوروبلاست', 'الأقصى للتغليف'],
    origins: ['لبنان', 'تركيا', 'الأردن', 'الإمارات', 'العراق']
  },

  // ================= 17 Cleaning Products =================
  {
    category: 'منظفات',
    subCategory: 'منظفات الغسيل',
    subCategoryEn: 'Heavy-Duty Laundry Powder, Gel & Softener',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 48000,
    brands: ['تايد بروفيشنال', 'أريال جل', 'بيرسيل باور', 'داوني المنعم', 'كلوركس ألوان'],
    origins: ['السعودية', 'تركيا', 'الإمارات', 'ألمانيا', 'الأردن']
  },
  {
    category: 'منظفات',
    subCategory: 'منظفات الأطباق',
    subCategoryEn: 'Concentrated Dishwashing Liquid & Dishwasher Tabs',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 28000,
    brands: ['فيري النهرين', 'بريل ليمون', 'فنيش للأقراص', 'زاهي الأصلي', 'لوكس سائل'],
    origins: ['العراق', 'تركيا', 'الإمارات', 'بولندا', 'الأردن']
  },
  {
    category: 'منظفات',
    subCategory: 'منظفات الأرضيات والأسطح',
    subCategoryEn: 'Scented Multi-Surface & Floor Cleaners',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 26000,
    brands: ['داك بالصنوبر', 'مستر ماسل', 'العملاق الأخضر', 'فلاش كلين', 'بنغو'],
    origins: ['السعودية', 'تركيا', 'الأردن', 'مصر', 'العراق']
  },
  {
    category: 'منظفات',
    subCategory: 'منظفات الحمامات والمطابخ',
    subCategoryEn: 'Heavy Degreasers & Limescale Bathroom Cleaners',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 30000,
    brands: ['هاربك باور', 'جيف كريم', 'سيليت بانغ', 'فيري دهون', 'بلازما كلين'],
    origins: ['الإمارات', 'تركيا', 'بولندا', 'المملكة المتحدة', 'الأردن']
  },
  {
    category: 'منظفات',
    subCategory: 'منظفات الزجاج',
    subCategoryEn: 'Streak-Free Glass & Mirror Spray Cleaners',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 22000,
    brands: ['جيف كلين', 'ويندكس برو', 'العملاق زجاج', 'فيليدا سبراي', 'كلين سبارك'],
    origins: ['تركيا', 'الإمارات', 'الأردن', 'ألمانيا', 'العراق']
  },
  {
    category: 'منظفات',
    subCategory: 'مطهرات ومعقمات',
    subCategoryEn: 'Antiseptic Disinfectants & Concentrated Bleach',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 33000,
    brands: ['ديتول الرافدين', 'كلوركس المبيض', 'العملاق معقم', 'سافلون', 'كومفورت جيرم'],
    origins: ['العراق', 'السعودية', 'الإمارات', 'الأردن', 'تركيا']
  },
  {
    category: 'منظفات',
    subCategory: 'معطرات الجو ومبيدات الحشرات',
    subCategoryEn: 'Aerosol Air Fresheners & Insect Sprays',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 31000,
    brands: ['جليد العطرية', 'بف باف الأصلي', 'إير ويك', 'ريد الحماية', 'فريدا سبراي'],
    origins: ['الإمارات', 'تركيا', 'السعودية', 'مصر', 'الأردن']
  },
  {
    category: 'منظفات',
    subCategory: 'منظفات المؤسسات',
    subCategoryEn: '20L Institutional & Hotel Bulk Detergents',
    profile: 'cleaning',
    storageType: 'ambient',
    basePriceIQD: 45000,
    brands: ['دايفرسي برو', 'إيكولاب هوريكا', 'بغداد إندستريال', 'ترك كلين 20L', 'الرافدين كير'],
    origins: ['تركيا', 'ألمانيا', 'العراق', 'الإمارات', 'الأردن']
  },
  {
    category: 'منظفات',
    subCategory: 'أدوات التنظيف',
    subCategoryEn: 'Heavy-Duty Sponges, Microfiber Cloths & Mops',
    profile: 'cleaning',
    storageType: 'dry',
    basePriceIQD: 21000,
    brands: ['سكوتش برايت', 'فيليدا برو', 'سبونج إكس', 'دجلة مايكروفايبر', 'بيركسي'],
    origins: ['تركيا', 'ألمانيا', 'الإمارات', 'الصين', 'العراق']
  },

  // ================= 18 Personal Care =================
  {
    category: 'عناية شخصية',
    subCategory: 'شامبو وبلسم',
    subCategoryEn: 'Anti-Dandruff Shampoo & Silky Conditioner',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 54000,
    brands: ['هيد آند شولدرز', 'بانتين برو في', 'صانسيلك', 'دوف للشعر', 'إلفيف لوريال'],
    origins: ['السعودية', 'فرنسا', 'تركيا', 'الإمارات', 'ألمانيا']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'استحمام وصابون',
    subCategoryEn: 'Creamy Bar Soap, Hand Wash & Shower Gel',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 39000,
    brands: ['دوف بيوتي', 'لوكس الحريري', 'لايفبوي المعقم', 'كامي', 'بالمرز'],
    origins: ['تركيا', 'الإمارات', 'ألمانيا', 'السعودية', 'العراق']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'العناية بالفم',
    subCategoryEn: 'Whitening Toothpaste, Brushes & Mouthwash',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 36000,
    brands: ['كولغيت ماكس', 'سنسوداين', 'سيجنال كومبليت', 'ليسترين', 'أورال بي'],
    origins: ['تركيا', 'المملكة المتحدة', 'ألمانيا', 'مصر', 'الإمارات']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'مزيلات العرق',
    subCategoryEn: '48h Roll-On & Body Deodorant Sprays',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 49000,
    brands: ['ريكسونا برو', 'نيفيا ستيك', 'أكس سبراي', 'دوف مزيل عرق', 'سيكريت'],
    origins: ['الإمارات', 'ألمانيا', 'المملكة المتحدة', 'تركيا', 'فرنسا']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'حلاقة',
    subCategoryEn: 'Multi-Blade Razors & Shaving Foam Cases',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 43000,
    brands: ['جيليت بلو 3', 'بيك سنسيتيف', 'نيفيا مين فوم', 'آركو حلاقة', 'ويلكنسون'],
    origins: ['بولندا', 'فرنسا', 'ألمانيا', 'تركيا', 'المملكة المتحدة']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'العناية بالبشرة',
    subCategoryEn: 'Moisturizing Lotions, Vaseline & Face Wash',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 51000,
    brands: ['نيفيا سوفت', 'فازلين جيلي', 'غارنييه فيتامين', 'دوف كريم', 'جونسون كير'],
    origins: ['ألمانيا', 'الإمارات', 'فرنسا', 'الهند', 'تركيا']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'النظافة النسائية',
    subCategoryEn: 'Cotton Sanitary Pads & Daily Care Cartons',
    profile: 'personal_care',
    storageType: 'dry',
    basePriceIQD: 44000,
    brands: ['أولويز الترا', 'كوتكس قطن', 'أوركيد كير', 'فام ميجا', 'برايفت'],
    origins: ['تركيا', 'السعودية', 'الأردن', 'الإمارات', 'مصر']
  },
  {
    category: 'عناية شخصية',
    subCategory: 'مناديل مبللة',
    subCategoryEn: 'Aloe Vera Baby & Cleansing Wet Wipes',
    profile: 'personal_care',
    storageType: 'ambient',
    basePriceIQD: 24000,
    brands: ['بامبرز سينسيتيف', 'سليبي التركية', 'ديتول وايبس', 'وايتس بيور', 'كول اند كول'],
    origins: ['تركيا', 'السعودية', 'الإمارات', 'الأردن', 'الصين']
  },

  // ================= 19 Paper Products =================
  {
    category: 'ورقيات',
    subCategory: 'ورق تواليت',
    subCategoryEn: '3-Ply Soft Virgin Pulp Toilet Paper Bales',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 29000,
    brands: ['فاين لوكس', 'سانيتا كلوب', 'سولو التركية', 'بابيا 3 طبقات', 'نورس بغداد'],
    origins: ['الأردن', 'تركيا', 'لبنان', 'الإمارات', 'العراق']
  },
  {
    category: 'ورقيات',
    subCategory: 'مناديل وجه',
    subCategoryEn: 'Facial Tissue Boxes (200 & 500 Sheets)',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 31000,
    brands: ['كلينكس الأصلي', 'فاين فلافي', 'سيلباك', 'ميشوار', 'لوتس سوفت'],
    origins: ['الإمارات', 'الأردن', 'تركيا', 'السعودية', 'العراق']
  },
  {
    category: 'ورقيات',
    subCategory: 'مناديل مطبخ',
    subCategoryEn: 'High-Absorbency Kitchen Paper Towel Rolls',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 27000,
    brands: ['فاين سوبر تاول', 'سولو ماكسي', 'سانيتا المطبخ', 'كلينكس فيفا', 'فاميليا'],
    origins: ['تركيا', 'الأردن', 'لبنان', 'الإمارات', 'السعودية']
  },
  {
    category: 'ورقيات',
    subCategory: 'مناديل سفرة',
    subCategoryEn: 'Tabletop Dining Napkins & Folded Serviettes',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 19500,
    brands: ['سانيتا السفرة', 'بابيا سفرة', 'فاين مائدة', 'الضيافة ورقيات', 'ماكسي نابكنز'],
    origins: ['تركيا', 'لبنان', 'الأردن', 'العراق', 'الإمارات']
  },
  {
    category: 'ورقيات',
    subCategory: 'ورق ألمنيوم وتغليف وورق زبدة',
    subCategoryEn: 'Aluminum Foil, Cling Wrap & Baking Parchment',
    profile: 'paper',
    storageType: 'dry',
    basePriceIQD: 33000,
    brands: ['سانيتا ألمنيوم', 'سارا كلينغ راب', 'كوروبلاست', 'دايموند فويل', 'شيف بيك'],
    origins: ['لبنان', 'تركيا', 'الأردن', 'الإمارات', 'العراق']
  },
  {
    category: 'ورقيات',
    subCategory: 'أكياس حفظ الطعام',
    subCategoryEn: 'Ziplock Freezer & Sandwich Storage Bags',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 22000,
    brands: ['سانيتا تفريز', 'زيبلوك الأصلي', 'كرو بلاست', 'سيف فود باجز', 'فريش لوك'],
    origins: ['تركيا', 'لبنان', 'الإمارات', 'الصين', 'الأردن']
  },

  // ================= 20 Packaging & Disposables =================
  {
    category: 'تعبئة وتغليف',
    subCategory: 'أكياس تسوق',
    subCategoryEn: 'HDPE Carrier & Kraft Paper Shopping Bags',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 25000,
    brands: ['بغداد بلاست', 'باك ماستر', 'إيكو كرافت', 'الفرات للتغليف', 'ستار باج'],
    origins: ['العراق', 'تركيا', 'الإمارات', 'الأردن', 'الصين']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'أكياس نفايات',
    subCategoryEn: 'Heavy-Duty Black & Drawstring Trash Liners',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 23000,
    brands: ['سانيتا جيبسي', 'كوراك نفايات', 'تاف باج', 'بغداد هيفي ديوتي', 'كلين لينر'],
    origins: ['تركيا', 'لبنان', 'العراق', 'الإمارات', 'الأردن']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'علب طعام وحافظات',
    subCategoryEn: 'Microwave Plastic Meal Prep & Foil Containers',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 36000,
    brands: ['فالكون باك', 'هوت باك جلوبال', 'شيف فويل تراي', 'بغداد فود باك', 'أطلس بلاست'],
    origins: ['الإمارات', 'تركيا', 'السعودية', 'العراق', 'الصين']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'أكواب وأغطية',
    subCategoryEn: 'Disposable Clear PET & Paper Cups with Lids',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 28000,
    brands: ['هوت باك كبس', 'فالكون للمشروبات', 'كوب باك التركي', 'دجلة بلاست', 'إيكو كب'],
    origins: ['الإمارات', 'تركيا', 'العراق', 'السعودية', 'الصين']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'أطباق',
    subCategoryEn: 'Pressed Paper, Foam & Biodegradable Plates',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 24000,
    brands: ['فالكون بليتس', 'سانيتا أطباق', 'نخيل للتغليف', 'هوت باك', 'بغداد داين'],
    origins: ['الإمارات', 'لبنان', 'تركيا', 'العراق', 'الأردن']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'أدوات مائدة',
    subCategoryEn: 'Wrapped Heavy Cutlery Sets (Spoons, Forks, Knives)',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 21500,
    brands: ['هوت باك كاتلري', 'فالكون', 'بارتي وير', 'إيكو وودن', 'بغداد للمائدة'],
    origins: ['تركيا', 'الإمارات', 'الصين', 'العراق', 'الأردن']
  },
  {
    category: 'تعبئة وتغليف',
    subCategory: 'كراتين ومواد تغليف',
    subCategoryEn: 'Corrugated Shipping Cartons, Stretch Film & Tape',
    profile: 'packaging',
    storageType: 'dry',
    basePriceIQD: 41000,
    brands: ['بغداد كارتون', 'باك سترتش', '3M تيب برو', 'النهرين كوروغيتد', 'ماستر باكينج'],
    origins: ['العراق', 'تركيا', 'الإمارات', 'السعودية', 'الصين']
  },

  // ================= 21 Supermarket Supplies =================
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'رول كاشير وأكياس',
    subCategoryEn: '80x80mm Thermal POS Receipt Rolls & Counter Bags',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 33000,
    brands: ['ثيرمو رول برو', 'بوس ماستر', 'ورق الرافدين', 'سمارت رولز', 'سوبر بوس'],
    origins: ['تركيا', 'الصين', 'الإمارات', 'العراق', 'ألمانيا']
  },
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'بطاقات أسعار وملصقات باركود',
    subCategoryEn: 'Barcode Thermal Stickers, Price Guns & Shelf Tags',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 29000,
    brands: ['زيبرا ليبلز', 'موتكس برايس غن', 'داتا تاغ', 'سوبر ستيكر', 'كود برو'],
    origins: ['تركيا', 'الصين', 'الإمارات', 'ألمانيا', 'كوريا الجنوبية']
  },
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'سلال وعربات',
    subCategoryEn: 'Rolling Shopping Baskets & Supermarket Trolleys',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 85000,
    brands: ['وانزل الألمانية', 'ماركت بلس', 'أرتلار التركية', 'بغداد تجهيزات', 'كارت ماستر'],
    origins: ['تركيا', 'ألمانيا', 'الصين', 'الإمارات', 'العراق']
  },
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'رفوف وحوامل عرض',
    subCategoryEn: 'Powder-Coated Gondola Shelving & Endcap Displays',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 115000,
    brands: ['رافكس التركية', 'سوبر راك', 'مودرن شيلف', 'معدات بغداد', 'جوندولا برو'],
    origins: ['تركيا', 'العراق', 'الصين', 'الإمارات', 'ألمانيا']
  },
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'أدوات تنظيم الرفوف',
    subCategoryEn: 'Spring-Loaded Shelf Pushers & Clear Dividers',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 37000,
    brands: ['إتش إل ديسبلاي', 'بوشر برو', 'ريتايل أورغانايزر', 'فيسينج ماستر', 'كلير ديفايدر'],
    origins: ['تركيا', 'الصين', 'الإمارات', 'ألمانيا', 'السويد']
  },
  {
    category: 'مستلزمات السوبر ماركت',
    subCategory: 'مستلزمات الكاشير',
    subCategoryEn: 'Counter Dividers, Cash Trays & Scanner Holders',
    profile: 'supermarket',
    storageType: 'dry',
    basePriceIQD: 42000,
    brands: ['تشيك أوت برو', 'بوس دايركت', 'كاش كير', 'ريتايل ديسك', 'سمارت كاونتر'],
    origins: ['تركيا', 'الصين', 'الإمارات', 'ألمانيا', 'العراق']
  },

  // ================= 22 Café & Restaurant Supplies =================
  {
    category: 'مستلزمات المقاهي والمطاعم',
    subCategory: 'أكواب وأغطية Takeaway',
    subCategoryEn: 'Double-Wall Kraft Coffee Cups & Sip Lids',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 34000,
    brands: ['كافيه باك برو', 'كرافت كب', 'باريستا تيك أواي', 'تركيا كبس', 'هوت باك كافيه'],
    origins: ['تركيا', 'الإمارات', 'الصين', 'العراق', 'الأردن']
  },
  {
    category: 'مستلزمات المقاهي والمطاعم',
    subCategory: 'شفاطات وعيدان تحريك',
    subCategoryEn: 'Wrapped Paper Straws & Birch Wooden Stirrers',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 18500,
    brands: ['إيكو سترو', 'باريستا ستيكس', 'كافيه وود', 'بيور بايبر', 'هوريكا ستير'],
    origins: ['تركيا', 'الصين', 'الإمارات', 'مصر', 'الأردن']
  },
  {
    category: 'مستلزمات المقاهي والمطاعم',
    subCategory: 'سكر وكريمة ومحليات للمقاهي',
    subCategoryEn: 'Portion Sugar Sticks, Non-Dairy Creamer & Stevia Sachets',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 27000,
    brands: ['كوفي ميت برو', 'أصابع سكر الفرات', 'سويت آند لو', 'تروبيكانا ساشيت', 'كافيه شوجر'],
    origins: ['تايلاند', 'العراق', 'ألمانيا', 'تركيا', 'الإمارات']
  },
  {
    category: 'مستلزمات المقاهي والمطاعم',
    subCategory: 'عبوات Takeaway',
    subCategoryEn: 'Kraft Burger Boxes, Pizza Cartons & Salad Bowls',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 38000,
    brands: ['كرافت بوكس برو', 'بيتزا بلس', 'هوت باك ديليفري', 'بغداد تيك أواي', 'فود كرافت'],
    origins: ['تركيا', 'الإمارات', 'العراق', 'الصين', 'الأردن']
  },
  {
    category: 'مستلزمات المقاهي والمطاعم',
    subCategory: 'مستلزمات التقديم',
    subCategoryEn: '2/4-Cup Kraft Carriers, Coasters & Serving Trays',
    profile: 'horeca',
    storageType: 'dry',
    basePriceIQD: 31000,
    brands: ['باريستا تريز', 'كافيه كارير', 'هوريكا سيرف', 'بغداد كافيه', 'سيرفينج برو'],
    origins: ['تركيا', 'الإمارات', 'الصين', 'العراق', 'الأردن']
  }
];

interface ProductVariantTemplate {
  packSuffixAr: string;
  packSuffixEn: string;
  unit: string;
  packSize: string;
  packageQuantity: number;
  priceMultiplier: number;
  badgeType?: UnifiedProduct['badgeType'];
  discountPercent?: number;
}

const PROFILE_SLOT_VARIANTS: Partial<Record<ImageProfile, ProductVariantTemplate[]>> = {
  cooking_oil: [
    { packSuffixAr: 'قناني شفافة 1 لتر للتجزئة', packSuffixEn: '1L Clear Bottle Case', unit: 'كرتون (12 × 1 لتر)', packSize: '12 × 1 لتر', packageQuantity: 12, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'عبوة عائلية مزدوجة 1.8 لتر', packSuffixEn: '1.8L Family Bottle Carton', unit: 'كرتون (6 × 1.8 لتر)', packSize: '6 × 1.8 لتر', packageQuantity: 6, priceMultiplier: 1.12, badgeType: 'promo_day', discountPercent: 14 },
    { packSuffixAr: 'تنك معدني فاخر للطبخ', packSuffixEn: 'Golden Metal Tin Case', unit: 'كرتون (4 × 3 لتر)', packSize: '4 × 3 لتر', packageQuantity: 4, priceMultiplier: 1.24, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'قوارير اقتصادية 750 مل', packSuffixEn: '750ml Shelf-Ready Case', unit: 'كرتون (15 × 750 مل)', packSize: '15 × 750 مل', packageQuantity: 15, priceMultiplier: 0.96, badgeType: 'hot_deal', discountPercent: 15 },
    { packSuffixAr: 'جالون مطاعم ومخابز HORECA', packSuffixEn: '5L Foodservice Jerrycan Case', unit: 'كرتون (4 × 5 لتر)', packSize: '4 × 5 لتر', packageQuantity: 4, priceMultiplier: 1.32, discountPercent: 9 }
  ],
  rice_grains: [
    { packSuffixAr: 'بالة جملة فاخرة 4 × 5 كغم', packSuffixEn: '4x5kg Master Wholesale Bale', unit: 'بالة (4 × 5 كغم)', packSize: '4 × 5 كغم', packageQuantity: 4, priceMultiplier: 1.05, badgeType: 'top_seller', discountPercent: 11 },
    { packSuffixAr: 'كيس عائلي مضغوط 10 × 2 كغم', packSuffixEn: '10x2kg Vacuum Pack Bale', unit: 'بالة (10 × 2 كغم)', packSize: '10 × 2 كغم', packageQuantity: 10, priceMultiplier: 1.0, badgeType: 'promo_day', discountPercent: 13 },
    { packSuffixAr: 'شوال تمويني كبير 25 كغم', packSuffixEn: '25kg Bulk Catering Sack', unit: 'شوال (25 كغم)', packSize: '25 كغم', packageQuantity: 1, priceMultiplier: 1.22, badgeType: 'discount', discountPercent: 9 },
    { packSuffixAr: 'أكياس سوبرماركت سريعة البيع 1 كغم', packSuffixEn: '20x1kg Retail Shelf Case', unit: 'كرتون (20 × 1 كغم)', packSize: '20 × 1 كغم', packageQuantity: 20, priceMultiplier: 0.95, badgeType: 'hot_deal', discountPercent: 14 },
    { packSuffixAr: 'علب وعبوات فاخرة محكمة 1.5 كغم', packSuffixEn: '12x1.5kg Sealed Carton', unit: 'كرتون (12 × 1.5 كغم)', packSize: '12 × 1.5 كغم', packageQuantity: 12, priceMultiplier: 1.1, discountPercent: 8 }
  ],
  canned_tomato: [
    { packSuffixAr: 'علب صفيح سهلة الفتح 800 غرام', packSuffixEn: '800g Easy-Open Tin Carton', unit: 'كرتون (24 × 800 غرام)', packSize: '24 × 800 غرام', packageQuantity: 24, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'مرطبان زجاجي فاخر 700 غرام', packSuffixEn: '700g Glass Jar Wholesale Case', unit: 'كرتون (12 × 700 غرام)', packSize: '12 × 700 غرام', packageQuantity: 12, priceMultiplier: 1.08, badgeType: 'promo_day', discountPercent: 15 },
    { packSuffixAr: 'تعبئة التجزئة السريعة 400 غرام', packSuffixEn: '400g Supermarket Shelf Case', unit: 'كرتون (24 × 400 غرام)', packSize: '24 × 400 غرام', packageQuantity: 24, priceMultiplier: 0.9, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'درام كبير للمطاعم والفنادق HORECA', packSuffixEn: '4.5kg HORECA Bulk Drum Case', unit: 'كرتون (6 × 4.5 كغم)', packSize: '6 × 4.5 كغم', packageQuantity: 6, priceMultiplier: 1.28, badgeType: 'hot_deal', discountPercent: 16 },
    { packSuffixAr: 'علب عائلية ميني مركزة 135 غرام', packSuffixEn: '135g Portion Pack Tray', unit: 'كرتون (48 × 135 غرام)', packSize: '48 × 135 غرام', packageQuantity: 48, priceMultiplier: 0.85, discountPercent: 8 }
  ],
  dairy: [
    { packSuffixAr: 'علب معدنية محكمة 400 غرام', packSuffixEn: '400g Sealed Tin Carton', unit: 'كرتون (24 × 400 غرام)', packSize: '24 × 400 غرام', packageQuantity: 24, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'تعبئة عائلية كبيرة 900 غرام', packSuffixEn: '900g Family Tin Case', unit: 'كرتون (12 × 900 غرام)', packSize: '12 × 900 غرام', packageQuantity: 12, priceMultiplier: 1.18, badgeType: 'promo_day', discountPercent: 14 },
    { packSuffixAr: 'عبوات مبردة للعرض اليومي 200 غرام', packSuffixEn: '200g Chilled Display Case', unit: 'كرتون (24 × 200 غرام)', packSize: '24 × 200 غرام', packageQuantity: 24, priceMultiplier: 0.92, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'بلوك وتعبئة للمخابز والمطاعم 2.5 كغم', packSuffixEn: '2.5kg Bakery & Chef Case', unit: 'كرتون (6 × 2.5 كغم)', packSize: '6 × 2.5 كغم', packageQuantity: 6, priceMultiplier: 1.26, badgeType: 'hot_deal', discountPercent: 16 },
    { packSuffixAr: 'أظرف فورية سريعة التوزيع 180 غرام', packSuffixEn: '180g Pouch Retail Carton', unit: 'كرتون (30 × 180 غرام)', packSize: '30 × 180 غرام', packageQuantity: 30, priceMultiplier: 0.88, discountPercent: 9 }
  ],
  beverages: [
    { packSuffixAr: 'علب معدنية مبردة 330 مل', packSuffixEn: '330ml Chilled Can Tray', unit: 'كرتون (24 × 330 مل)', packSize: '24 × 330 مل', packageQuantity: 24, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'قناني زجاجية وبلاستيك 500 مل', packSuffixEn: '500ml Bottle Wholesale Case', unit: 'شريط (24 × 500 مل)', packSize: '24 × 500 مل', packageQuantity: 24, priceMultiplier: 1.08, badgeType: 'promo_day', discountPercent: 14 },
    { packSuffixAr: 'عبوة عائلية كبيرة 1.5 لتر', packSuffixEn: '1.5L Family Pack Case', unit: 'شريط (6 × 1.5 لتر)', packSize: '6 × 1.5 لتر', packageQuantity: 6, priceMultiplier: 0.96, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'كراتين أطفال وميني 200 مل', packSuffixEn: '200ml Tetra Pack Case', unit: 'كرتون (27 × 200 مل)', packSize: '27 × 200 مل', packageQuantity: 27, priceMultiplier: 0.88, badgeType: 'hot_deal', discountPercent: 15 },
    { packSuffixAr: 'قناني زجاجية فاخرة للمطاعم 250 مل', packSuffixEn: '250ml HORECA Glass Case', unit: 'كرتون (24 × 250 مل)', packSize: '24 × 250 مل', packageQuantity: 24, priceMultiplier: 1.15, discountPercent: 8 }
  ],
  tea_coffee: [
    { packSuffixAr: 'باكيت كلاسيك فاخر 400 غرام', packSuffixEn: '400g Classic Box Carton', unit: 'كرتون (24 × 400 غرام)', packSize: '24 × 400 غرام', packageQuantity: 24, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'مرطبان زجاجي فاخر 200 غرام', packSuffixEn: '200g Glass Jar Wholesale Case', unit: 'كرتون (12 × 200 غرام)', packSize: '12 × 200 غرام', packageQuantity: 12, priceMultiplier: 1.14, badgeType: 'promo_day', discountPercent: 15 },
    { packSuffixAr: 'عبوة ضيافة ومقاهي 1 كغم', packSuffixEn: '1kg Cafe & Hospitality Case', unit: 'كرتون (10 × 1 كغم)', packSize: '10 × 1 كغم', packageQuantity: 10, priceMultiplier: 1.24, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'أكياس وأظرف سريعة التحضير 100 قطعة', packSuffixEn: '100-Count Bag/Stick Carton', unit: 'كرتون (18 علبة)', packSize: '18 × 100 قطعة', packageQuantity: 18, priceMultiplier: 0.95, badgeType: 'hot_deal', discountPercent: 16 },
    { packSuffixAr: 'علبة صفيح حافظة للنكهة 500 غرام', packSuffixEn: '500g Aroma Tin Case', unit: 'كرتون (12 × 500 غرام)', packSize: '12 × 500 غرام', packageQuantity: 12, priceMultiplier: 1.08, discountPercent: 9 }
  ],
  cleaning: [
    { packSuffixAr: 'أكياس بودرة مركزة 1.5 كغم', packSuffixEn: '1.5kg Concentrated Powder Case', unit: 'كرتون (12 × 1.5 كغم)', packSize: '12 × 1.5 كغم', packageQuantity: 12, priceMultiplier: 1.0, badgeType: 'top_seller', discountPercent: 12 },
    { packSuffixAr: 'قناني سائل غسيل وتنظيف 1 لتر', packSuffixEn: '1L Liquid Bottle Wholesale Case', unit: 'كرتون (12 × 1 لتر)', packSize: '12 × 1 لتر', packageQuantity: 12, priceMultiplier: 1.12, badgeType: 'promo_day', discountPercent: 14 },
    { packSuffixAr: 'بخاخ وعبوات عناية بالأسطح 750 مل', packSuffixEn: '750ml Spray Bottle Case', unit: 'كرتون (12 × 750 مل)', packSize: '12 × 750 مل', packageQuantity: 12, priceMultiplier: 0.94, badgeType: 'discount', discountPercent: 10 },
    { packSuffixAr: 'جالون اقتصادي للمغاسل والفنادق 4 لتر', packSuffixEn: '4L Commercial Bulk Carton', unit: 'كرتون (4 × 4 لتر)', packSize: '4 × 4 لتر', packageQuantity: 4, priceMultiplier: 1.25, badgeType: 'hot_deal', discountPercent: 18 },
    { packSuffixAr: 'عبوة اقتصادية كبيرة 3 كغم', packSuffixEn: '3kg Value Pack Case', unit: 'كرتون (6 × 3 كغم)', packSize: '6 × 3 كغم', packageQuantity: 6, priceMultiplier: 1.18, discountPercent: 9 }
  ]
};

const DEFAULT_CARTON_VARIANTS: ProductVariantTemplate[] = [
  {
    packSuffixAr: 'عبوة عرض قياسية للسوبرماركت',
    packSuffixEn: 'Standard Supermarket Display Carton',
    unit: 'كرتون (12 عبوة)',
    packSize: '12 × 1 وحدة',
    packageQuantity: 12,
    priceMultiplier: 1.0,
    badgeType: 'top_seller',
    discountPercent: 12
  },
  {
    packSuffixAr: 'تعبئة عائلية مزدوجة الأحجام',
    packSuffixEn: 'Twin-Size Family Wholesale Case',
    unit: 'كرتون (18 عبوة)',
    packSize: '18 × 750 غرام/مل',
    packageQuantity: 18,
    priceMultiplier: 1.12,
    badgeType: 'promo_day',
    discountPercent: 15
  },
  {
    packSuffixAr: 'علبة تجزئة محكمة سريعة البيع',
    packSuffixEn: 'Fast-Turnover Retail Shelf Carton',
    unit: 'كرتون (24 عبوة)',
    packSize: '24 × 500 غرام/مل',
    packageQuantity: 24,
    priceMultiplier: 1.06,
    badgeType: 'discount',
    discountPercent: 10
  },
  {
    packSuffixAr: 'حجم اقتصادي للمطاعم والمخابز HORECA',
    packSuffixEn: 'Commercial HORECA Bulk Container Case',
    unit: 'كرتون (6 عبوات كبيرة)',
    packSize: '6 × 2.5 وحدة',
    packageQuantity: 6,
    priceMultiplier: 1.24,
    badgeType: 'hot_deal',
    discountPercent: 18
  },
  {
    packSuffixAr: 'عبوات صغيرة متنوعة للتوزيع اليومي',
    packSuffixEn: 'Compact Portion Assortment Case',
    unit: 'كرتون (36 عبوة)',
    packSize: '36 × 250 غرام/مل',
    packageQuantity: 36,
    priceMultiplier: 0.92,
    discountPercent: 8
  }
];

function getImagesForBranchSlot(profile: ImageProfile, idx: number): [string, string, string, string] {
  const base = PROFILE_IMAGES[profile];
  const slotLead = PROFILE_SLOT_ALTS[profile]?.[idx];
  if (!slotLead || slotLead === base[0]) {
    return base;
  }
  const rest = base.filter((img) => img !== slotLead);
  const combined = [slotLead, ...rest];
  while (combined.length < 4) {
    combined.push(base[combined.length % base.length]);
  }
  return [combined[0], combined[1], combined[2], combined[3]];
}

const SUPPLIERS_FOR_BRANCHES = [
  {
    id: 'supp_rafidain',
    name: 'شركة الرافدين للتجارة العامة والأغذية',
    city: 'بغداد - الشورجة',
    deliveryDays: 1,
    maxCreditDays: 45
  },
  {
    id: 'supp_baghdad_hub',
    name: 'مجمع بغداد للمواد الاستهلاكية والتوزيع',
    city: 'بغداد - جميلة',
    deliveryDays: 1,
    maxCreditDays: 30
  },
  {
    id: 'supp_dijla',
    name: 'مجموعة دجلة للمشروبات والسلع الغذائية',
    city: 'أربيل',
    deliveryDays: 2,
    maxCreditDays: 45
  }
] as const;

export function buildBranchProductsAndOffers(): {
  products: UnifiedProduct[];
  offers: SupplierOffer[];
} {
  const products: UnifiedProduct[] = [];
  const offers: SupplierOffer[] = [];
  let seq = 1;

  for (const spec of BRANCH_SPECS) {
    const profileVariants = PROFILE_SLOT_VARIANTS[spec.profile] || DEFAULT_CARTON_VARIANTS;

    for (let idx = 0; idx < 5; idx++) {
      const custom = spec.customItems?.[idx];
      const variant = profileVariants[idx] || DEFAULT_CARTON_VARIANTS[idx];
      const paddedSeq = String(seq).padStart(4, '0');
      const barcode = `6289900${paddedSeq}1`;
      seq++;

      const brand = custom?.brand || spec.brands[idx];
      const origin = custom?.origin || spec.origins[idx];
      const unit = custom?.unit || variant.unit;
      const packSize = custom?.packSize || variant.packSize;
      const packageQuantity = custom?.packageQuantity || variant.packageQuantity;
      const basePrice =
        custom?.priceIQD ||
        Math.round((spec.basePriceIQD * variant.priceMultiplier) / 500) * 500;
      const discountPercent = variant.discountPercent || 10;
      const oldPrice = Math.round((basePrice * (1 + discountPercent / 100)) / 500) * 500;

      const images: [string, string, string, string] = custom?.images
        ? custom.images
        : getImagesForBranchSlot(spec.profile, idx);

      const nameAr =
        custom?.nameAr ||
        `${spec.subCategory} ${brand} — ${variant.packSuffixAr} (${unit})`;
      const nameEn =
        custom?.nameEn ||
        `${spec.subCategoryEn} ${brand} — ${variant.packSuffixEn}`;

      const descriptionAr =
        custom?.descriptionAr ||
        `منتج جملة أصلي من ${brand} ضمن قسم ${spec.subCategory}، معبأ في كرتون شحن تجاري محكم (${packSize}) لحماية العبوات أثناء النقل والتخزين على أرفف السوبرماركت.`;

      const product: UnifiedProduct = {
        barcode,
        nameAr,
        nameEn,
        brand,
        category: spec.category,
        subCategory: spec.subCategory,
        unit,
        packSize,
        packageQuantity,
        imageUrl: images[0],
        images,
        descriptionAr,
        isPerishable: Boolean(spec.isPerishable),
        storageType: spec.storageType,
        countryOfOrigin: origin,
        standardBarcodeFormat: 'EAN-13',
        oldPrice,
        discountPercent,
        badgeType: variant.badgeType,
        rating: Number((4.7 + ((idx % 3) * 0.1)).toFixed(1)),
        reviewsCount: 48 + idx * 27 + (seq % 40),
        isSmartShipping: true
      };

      products.push(product);

      // Generate 2-3 supplier offers covering Baghdad Karkh/Rusafa & regional zones
      const suppA = SUPPLIERS_FOR_BRANCHES[0]; // supp_rafidain
      const suppB = SUPPLIERS_FOR_BRANCHES[1]; // supp_baghdad_hub
      const suppC = SUPPLIERS_FOR_BRANCHES[2]; // supp_dijla

      const priceA = basePrice;
      const priceB = Math.round((basePrice * 1.03) / 500) * 500;
      const priceC = Math.round((basePrice * 0.98) / 500) * 500;

      offers.push({
        id: `off_br_${paddedSeq}_raf`,
        barcode,
        supplierId: suppA.id,
        supplierName: suppA.name,
        supplierCity: suppA.city,
        priceIQD: priceA,
        priceUSD: Number((priceA / 1530).toFixed(2)),
        minOrderQuantity: idx % 2 === 0 ? 1 : 2,
        availableStock: 260 + idx * 45,
        deliveryDays: suppA.deliveryDays,
        paymentTerms: {
          allowsCredit: true,
          maxCreditDays: suppA.maxCreditDays,
          allowsCash: true
        },
        discountTiers: [{ minQuantity: 10, discountPercent: 5 }]
      });

      offers.push({
        id: `off_br_${paddedSeq}_hub`,
        barcode,
        supplierId: suppB.id,
        supplierName: suppB.name,
        supplierCity: suppB.city,
        priceIQD: priceB,
        priceUSD: Number((priceB / 1530).toFixed(2)),
        minOrderQuantity: 1,
        availableStock: 340 + idx * 30,
        deliveryDays: suppB.deliveryDays,
        paymentTerms: {
          allowsCredit: true,
          maxCreditDays: suppB.maxCreditDays,
          allowsCash: true
        }
      });

      if (idx % 2 === 0) {
        offers.push({
          id: `off_br_${paddedSeq}_dij`,
          barcode,
          supplierId: suppC.id,
          supplierName: suppC.name,
          supplierCity: suppC.city,
          priceIQD: priceC,
          priceUSD: Number((priceC / 1530).toFixed(2)),
          minOrderQuantity: 2,
          availableStock: 190 + idx * 25,
          deliveryDays: suppC.deliveryDays,
          paymentTerms: {
            allowsCredit: true,
            maxCreditDays: suppC.maxCreditDays,
            allowsCash: true
          }
        });
      }
    }
  }

  return { products, offers };
}
