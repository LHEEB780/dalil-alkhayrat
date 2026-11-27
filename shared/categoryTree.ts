export interface CategoryTreeBranch {
  id: string;
  labelAr: string;
  labelEn: string;
  subCategoryKey: string;
}

export interface CategoryTreeDepartment {
  id: string;
  order: number;
  categoryKey: string;
  labelAr: string;
  labelEn: string;
  aliases?: string[];
  branches: CategoryTreeBranch[];
}

export const SHARED_CATEGORY_ALIASES: Record<string, string> = {
  'قهوة ومشروبات ساخنة': 'شاي وقهوة',
  'أرز وحبوب': 'مواد غذائية أساسية',
  'زيوت وسمن': 'زيوت وسمن ودهون',
  'ألبان وأجبان': 'ألبان وبيض',
  'منظفات وعناية': 'منظفات',
  'معلبات ومخللات': 'معلبات وأغذية محفوظة',
  'سكر ومحليات': 'مواد غذائية أساسية',
  'مشروبات وشاي': 'مشروبات',
  'مكرونة وشعرية': 'مواد غذائية أساسية'
};

export function resolveSharedCategoryKey(key: string): string {
  if (!key || key === 'الكل') return 'الكل';
  return SHARED_CATEGORY_ALIASES[key] || key;
}

export const SHARED_CATEGORY_TREE: CategoryTreeDepartment[] = [
  {
    id: 'pantry-staples',
    order: 1,
    categoryKey: 'مواد غذائية أساسية',
    labelAr: 'مواد غذائية أساسية',
    labelEn: 'Pantry Staples',
    aliases: ['أرز وحبوب', 'سكر ومحليات', 'مكرونة وشعرية'],
    branches: [
      { id: 'rice', labelAr: 'أرز', labelEn: 'Rice', subCategoryKey: 'أرز' },
      { id: 'sugar-sweeteners', labelAr: 'سكر ومحليات', labelEn: 'Sugar & Sweeteners', subCategoryKey: 'سكر ومحليات' },
      { id: 'flour-starches', labelAr: 'طحين ونشويات', labelEn: 'Flour & Starches', subCategoryKey: 'طحين ونشويات' },
      { id: 'pulses', labelAr: 'بقوليات', labelEn: 'Pulses', subCategoryKey: 'بقوليات' },
      { id: 'grains-bulgur-couscous', labelAr: 'حبوب وبرغل وكسكس', labelEn: 'Grains, Bulgur & Couscous', subCategoryKey: 'حبوب وبرغل وكسكس' },
      { id: 'pasta-vermicelli-noodles', labelAr: 'مكرونة وشعرية ونودلز', labelEn: 'Pasta, Vermicelli & Noodles', subCategoryKey: 'مكرونة وشعرية ونودلز' },
      { id: 'salt', labelAr: 'ملح', labelEn: 'Salt', subCategoryKey: 'ملح' },
      { id: 'cooking-baking-basics', labelAr: 'مواد الطبخ والخبز الأساسية', labelEn: 'Cooking & Baking Basics', subCategoryKey: 'مواد الطبخ والخبز الأساسية' }
    ]
  },
  {
    id: 'oils-ghee-fats',
    order: 2,
    categoryKey: 'زيوت وسمن ودهون',
    labelAr: 'زيوت وسمن ودهون',
    labelEn: 'Oils, Ghee & Fats',
    aliases: ['زيوت وسمن'],
    branches: [
      { id: 'sunflower-oil', labelAr: 'زيت دوار الشمس', labelEn: 'Sunflower Oil', subCategoryKey: 'زيت دوار الشمس' },
      { id: 'corn-oil', labelAr: 'زيت الذرة', labelEn: 'Corn Oil', subCategoryKey: 'زيت الذرة' },
      { id: 'palm-oil', labelAr: 'زيت النخيل', labelEn: 'Palm Oil', subCategoryKey: 'زيت النخيل' },
      { id: 'soybean-vegetable-oils', labelAr: 'زيت الصويا والزيوت النباتية', labelEn: 'Soybean & Vegetable Oils', subCategoryKey: 'زيت الصويا والزيوت النباتية' },
      { id: 'olive-oil', labelAr: 'زيت الزيتون', labelEn: 'Olive Oil', subCategoryKey: 'زيت الزيتون' },
      { id: 'vegetable-ghee', labelAr: 'سمن نباتي', labelEn: 'Vegetable Ghee', subCategoryKey: 'سمن نباتي' },
      { id: 'animal-ghee', labelAr: 'سمن حيواني وزبدة سمن', labelEn: 'Animal Ghee', subCategoryKey: 'سمن حيواني وزبدة سمن' },
      { id: 'professional-frying-oils', labelAr: 'زيوت القلي المهنية', labelEn: 'Professional Frying Oils', subCategoryKey: 'زيوت القلي المهنية' }
    ]
  },
  {
    id: 'canned-preserved-foods',
    order: 3,
    categoryKey: 'معلبات وأغذية محفوظة',
    labelAr: 'معلبات وأغذية محفوظة',
    labelEn: 'Canned & Preserved Foods',
    aliases: ['معلبات ومخللات'],
    branches: [
      { id: 'canned-vegetables', labelAr: 'خضار معلبة', labelEn: 'Canned Vegetables', subCategoryKey: 'خضار معلبة' },
      { id: 'canned-pulses', labelAr: 'بقوليات معلبة', labelEn: 'Canned Pulses', subCategoryKey: 'بقوليات معلبة' },
      { id: 'canned-fish-tuna', labelAr: 'تونة وأسماك معلبة', labelEn: 'Canned Fish & Tuna', subCategoryKey: 'تونة وأسماك معلبة' },
      { id: 'canned-meat', labelAr: 'لحوم معلبة', labelEn: 'Canned Meat', subCategoryKey: 'لحوم معلبة' },
      { id: 'tomato-paste-sauce', labelAr: 'معجون وصلصة الطماطم', labelEn: 'Tomato Paste & Sauce', subCategoryKey: 'معجون وصلصة الطماطم' },
      { id: 'canned-fruits', labelAr: 'فواكه معلبة', labelEn: 'Canned Fruits', subCategoryKey: 'فواكه معلبة' },
      { id: 'pickles-olives', labelAr: 'مخللات وزيتون', labelEn: 'Pickles & Olives', subCategoryKey: 'مخللات وزيتون' },
      { id: 'canned-ready-meals', labelAr: 'وجبات جاهزة معلبة', labelEn: 'Canned Ready Meals', subCategoryKey: 'وجبات جاهزة معلبة' }
    ]
  },
  {
    id: 'sauces-spices-seasonings',
    order: 4,
    categoryKey: 'صلصات وتوابل',
    labelAr: 'صلصات وتوابل',
    labelEn: 'Sauces, Spices & Seasonings',
    branches: [
      { id: 'ketchup-mayonnaise', labelAr: 'كاتشب ومايونيز', labelEn: 'Ketchup & Mayonnaise', subCategoryKey: 'كاتشب ومايونيز' },
      { id: 'mustard-hot-sauces', labelAr: 'مستردة وصلصات حارة', labelEn: 'Mustard & Hot Sauces', subCategoryKey: 'مستردة وصلصات حارة' },
      { id: 'cooking-pizza-pasta-sauces', labelAr: 'صلصات الطبخ والبيتزا والمعكرونة', labelEn: 'Cooking, Pizza & Pasta Sauces', subCategoryKey: 'صلصات الطبخ والبيتزا والمعكرونة' },
      { id: 'soy-vinegar-molasses', labelAr: 'صويا وخل ودبس', labelEn: 'Soy Sauce, Vinegar & Molasses', subCategoryKey: 'صويا وخل ودبس' },
      { id: 'spices', labelAr: 'بهارات وتوابل', labelEn: 'Spices', subCategoryKey: 'بهارات وتوابل' },
      { id: 'dried-herbs', labelAr: 'أعشاب مجففة', labelEn: 'Dried Herbs', subCategoryKey: 'أعشاب مجففة' },
      { id: 'stock-cubes-flavor-enhancers', labelAr: 'مكعبات مرق ومحسنات نكهة', labelEn: 'Stock Cubes & Flavor Enhancers', subCategoryKey: 'مكعبات مرق ومحسنات نكهة' },
      { id: 'cooking-mixes', labelAr: 'خلطات الطبخ', labelEn: 'Cooking Mixes', subCategoryKey: 'خلطات الطبخ' }
    ]
  },
  {
    id: 'dairy-eggs',
    order: 5,
    categoryKey: 'ألبان وبيض',
    labelAr: 'ألبان وبيض',
    labelEn: 'Dairy & Eggs',
    aliases: ['ألبان وأجبان'],
    branches: [
      { id: 'fresh-milk', labelAr: 'حليب طازج', labelEn: 'Fresh Milk', subCategoryKey: 'حليب طازج' },
      { id: 'uht-milk', labelAr: 'حليب طويل الأجل', labelEn: 'UHT Milk', subCategoryKey: 'حليب طويل الأجل' },
      { id: 'powdered-evaporated-condensed-milk', labelAr: 'حليب بودرة ومبخر ومكثف', labelEn: 'Powdered, Evaporated & Condensed Milk', subCategoryKey: 'حليب بودرة ومبخر ومكثف' },
      { id: 'laban-yogurt-labneh', labelAr: 'لبن وزبادي ولبنة', labelEn: 'Laban, Yogurt & Labneh', subCategoryKey: 'لبن وزبادي ولبنة' },
      { id: 'cheese', labelAr: 'أجبان', labelEn: 'Cheese', subCategoryKey: 'أجبان' },
      { id: 'cream-qeshta', labelAr: 'قشطة وكريمة', labelEn: 'Cream & Qeshta', subCategoryKey: 'قشطة وكريمة' },
      { id: 'butter-margarine', labelAr: 'زبدة ومارجرين', labelEn: 'Butter & Margarine', subCategoryKey: 'زبدة ومارجرين' },
      { id: 'eggs', labelAr: 'بيض', labelEn: 'Eggs', subCategoryKey: 'بيض' },
      { id: 'milk-alternatives', labelAr: 'بدائل الحليب', labelEn: 'Milk Alternatives', subCategoryKey: 'بدائل الحليب' }
    ]
  },
  {
    id: 'frozen-foods',
    order: 6,
    categoryKey: 'مجمدات',
    labelAr: 'مجمدات',
    labelEn: 'Frozen Foods',
    branches: [
      { id: 'frozen-vegetables', labelAr: 'خضار مجمدة', labelEn: 'Frozen Vegetables', subCategoryKey: 'خضار مجمدة' },
      { id: 'frozen-fruits', labelAr: 'فواكه مجمدة', labelEn: 'Frozen Fruits', subCategoryKey: 'فواكه مجمدة' },
      { id: 'frozen-potatoes', labelAr: 'بطاطا مجمدة', labelEn: 'Frozen Potatoes', subCategoryKey: 'بطاطا مجمدة' },
      { id: 'frozen-ready-meals', labelAr: 'وجبات ومأكولات جاهزة مجمدة', labelEn: 'Frozen Ready Meals', subCategoryKey: 'وجبات ومأكولات جاهزة مجمدة' },
      { id: 'frozen-dough-pastries', labelAr: 'عجائن ومعجنات مجمدة', labelEn: 'Frozen Dough & Pastries', subCategoryKey: 'عجائن ومعجنات مجمدة' },
      { id: 'ice-cream-frozen-desserts', labelAr: 'آيس كريم وحلويات مجمدة', labelEn: 'Ice Cream & Frozen Desserts', subCategoryKey: 'آيس كريم وحلويات مجمدة' }
    ]
  },
  {
    id: 'meat-poultry-seafood',
    order: 7,
    categoryKey: 'لحوم ودواجن وأسماك',
    labelAr: 'لحوم ودواجن وأسماك',
    labelEn: 'Meat, Poultry & Seafood',
    branches: [
      { id: 'red-meat', labelAr: 'لحوم حمراء', labelEn: 'Red Meat', subCategoryKey: 'لحوم حمراء' },
      { id: 'chicken-turkey', labelAr: 'دجاج وديك رومي', labelEn: 'Chicken & Turkey', subCategoryKey: 'دجاج وديك رومي' },
      { id: 'fish', labelAr: 'أسماك', labelEn: 'Fish', subCategoryKey: 'أسماك' },
      { id: 'seafood', labelAr: 'مأكولات بحرية', labelEn: 'Seafood', subCategoryKey: 'مأكولات بحرية' },
      { id: 'processed-meat', labelAr: 'لحوم مصنعة', labelEn: 'Processed Meat', subCategoryKey: 'لحوم مصنعة' }
    ]
  },
  {
    id: 'beverages',
    order: 8,
    categoryKey: 'مشروبات',
    labelAr: 'مشروبات',
    labelEn: 'Beverages',
    aliases: ['مشروبات وشاي'],
    branches: [
      { id: 'mineral-water', labelAr: 'مياه معدنية', labelEn: 'Mineral Water', subCategoryKey: 'مياه معدنية' },
      { id: 'drinking-water-jugs', labelAr: 'مياه شرب وجالونات', labelEn: 'Drinking Water & Jugs', subCategoryKey: 'مياه شرب وجالونات' },
      { id: 'soft-drinks', labelAr: 'مشروبات غازية', labelEn: 'Soft Drinks', subCategoryKey: 'مشروبات غازية' },
      { id: 'juices-nectars', labelAr: 'عصائر ونكتار', labelEn: 'Juices & Nectars', subCategoryKey: 'عصائر ونكتار' },
      { id: 'energy-drinks', labelAr: 'مشروبات الطاقة', labelEn: 'Energy Drinks', subCategoryKey: 'مشروبات الطاقة' },
      { id: 'sports-functional-drinks', labelAr: 'مشروبات رياضية ووظيفية', labelEn: 'Sports & Functional Drinks', subCategoryKey: 'مشروبات رياضية ووظيفية' },
      { id: 'concentrates-powder-drinks', labelAr: 'شراب مركز ومشروبات بودرة', labelEn: 'Concentrates & Powder Drinks', subCategoryKey: 'شراب مركز ومشروبات بودرة' },
      { id: 'non-alcoholic-malt-drinks', labelAr: 'مشروبات شعير غير كحولية', labelEn: 'Non-alcoholic Malt Drinks', subCategoryKey: 'مشروبات شعير غير كحولية' },
      { id: 'sugar-free-drinks', labelAr: 'مشروبات خالية من السكر', labelEn: 'Sugar-free Drinks', subCategoryKey: 'مشروبات خالية من السكر' }
    ]
  },
  {
    id: 'tea-coffee',
    order: 9,
    categoryKey: 'شاي وقهوة',
    labelAr: 'شاي وقهوة',
    labelEn: 'Tea & Coffee',
    aliases: ['قهوة ومشروبات ساخنة'],
    branches: [
      { id: 'black-tea', labelAr: 'شاي أسود', labelEn: 'Black Tea', subCategoryKey: 'شاي أسود' },
      { id: 'green-herbal-tea', labelAr: 'شاي أخضر وأعشاب', labelEn: 'Green & Herbal Tea', subCategoryKey: 'شاي أخضر وأعشاب' },
      { id: 'tea-bags', labelAr: 'شاي أكياس', labelEn: 'Tea Bags', subCategoryKey: 'شاي أكياس' },
      { id: 'arabic-turkish-coffee', labelAr: 'قهوة عربية وتركية', labelEn: 'Arabic & Turkish Coffee', subCategoryKey: 'قهوة عربية وتركية' },
      { id: 'ground-coffee-beans', labelAr: 'قهوة مطحونة وحبوب', labelEn: 'Ground Coffee & Beans', subCategoryKey: 'حبوب كاملة' },
      { id: 'drip', labelAr: 'القهوة المقطرة', labelEn: 'Drip Coffee', subCategoryKey: 'القهوة المقطرة' },
      { id: 'arabica', labelAr: 'أرابيكا 100%', labelEn: 'Arabica Beans', subCategoryKey: 'أرابيكا' },
      { id: 'instant', labelAr: 'قهوة سريعة وخلطات 3×1', labelEn: 'Instant Coffee', subCategoryKey: 'سريعة التحضير' },
      { id: 'pods', labelAr: 'كبسولات القهوة', labelEn: 'Coffee Capsules', subCategoryKey: 'كبسولات سريعة' },
      { id: 'cocoa-sahlab-hot-drinks', labelAr: 'كاكاو وسحلب ومشروبات ساخنة', labelEn: 'Cocoa, Sahlab & Hot Drinks', subCategoryKey: 'كاكاو وسحلب ومشروبات ساخنة' }
    ]
  },
  {
    id: 'confectionery-chocolate',
    order: 10,
    categoryKey: 'حلويات وشوكولاتة',
    labelAr: 'حلويات وشوكولاتة',
    labelEn: 'Confectionery & Chocolate',
    branches: [
      { id: 'chocolate', labelAr: 'شوكولاتة', labelEn: 'Chocolate', subCategoryKey: 'شوكولاتة' },
      { id: 'bars', labelAr: 'ألواح', labelEn: 'Bars', subCategoryKey: 'ألواح' },
      { id: 'candy', labelAr: 'سكاكر وحلوى', labelEn: 'Candy', subCategoryKey: 'سكاكر وحلوى' },
      { id: 'gum-mints', labelAr: 'علكة ونعناع', labelEn: 'Gum & Mints', subCategoryKey: 'علكة ونعناع' },
      { id: 'jelly-marshmallow', labelAr: 'جيلي ومارشميلو', labelEn: 'Jelly & Marshmallow', subCategoryKey: 'جيلي ومارشميلو' },
      { id: 'toffee-caramel', labelAr: 'توفي وكراميل', labelEn: 'Toffee & Caramel', subCategoryKey: 'توفي وكراميل' },
      { id: 'gift-boxes-bundles', labelAr: 'علب هدايا وحزم', labelEn: 'Gift Boxes & Bundles', subCategoryKey: 'علب هدايا وحزم' }
    ]
  },
  {
    id: 'biscuits-dry-bakery',
    order: 11,
    categoryKey: 'بسكويت ومخبوزات جافة',
    labelAr: 'بسكويت ومخبوزات جافة',
    labelEn: 'Biscuits & Dry Bakery',
    branches: [
      { id: 'biscuits', labelAr: 'بسكويت', labelEn: 'Biscuits', subCategoryKey: 'بسكويت' },
      { id: 'wafers', labelAr: 'ويفر', labelEn: 'Wafers', subCategoryKey: 'ويفر' },
      { id: 'crackers', labelAr: 'كراكر', labelEn: 'Crackers', subCategoryKey: 'كراكر' },
      { id: 'packaged-cakes-croissants', labelAr: 'كيك وكرواسون مغلف', labelEn: 'Packaged Cakes & Croissants', subCategoryKey: 'كيك وكرواسون مغلف' },
      { id: 'packaged-cookies-maamoul', labelAr: 'كعك ومعمول مغلف', labelEn: 'Packaged Cookies & Maamoul', subCategoryKey: 'كعك ومعمول مغلف' },
      { id: 'toast-long-life-bread', labelAr: 'توست وخبز طويل الأجل', labelEn: 'Toast & Long-life Bread', subCategoryKey: 'توست وخبز طويل الأجل' }
    ]
  },
  {
    id: 'snacks-nuts',
    order: 12,
    categoryKey: 'سناكات ومكسرات',
    labelAr: 'سناكات ومكسرات',
    labelEn: 'Snacks & Nuts',
    branches: [
      { id: 'chips', labelAr: 'شيبس', labelEn: 'Chips', subCategoryKey: 'شيبس' },
      { id: 'popcorn', labelAr: 'فشار', labelEn: 'Popcorn', subCategoryKey: 'فشار' },
      { id: 'nuts', labelAr: 'مكسرات', labelEn: 'Nuts', subCategoryKey: 'مكسرات' },
      { id: 'seeds', labelAr: 'بذور', labelEn: 'Seeds', subCategoryKey: 'بذور' },
      { id: 'dried-fruits-dates', labelAr: 'فواكه مجففة وتمور', labelEn: 'Dried Fruits & Dates', subCategoryKey: 'فواكه مجففة وتمور' },
      { id: 'healthy-snacks-energy-bars', labelAr: 'سناك صحي وألواح الطاقة', labelEn: 'Healthy Snacks & Energy Bars', subCategoryKey: 'سناك صحي وألواح الطاقة' }
    ]
  },
  {
    id: 'breakfast-spreads',
    order: 13,
    categoryKey: 'الإفطار والمربى',
    labelAr: 'الإفطار والمربى',
    labelEn: 'Breakfast & Spreads',
    branches: [
      { id: 'breakfast-cereals', labelAr: 'حبوب الإفطار', labelEn: 'Breakfast Cereals', subCategoryKey: 'حبوب الإفطار' },
      { id: 'oats-granola-muesli', labelAr: 'شوفان وجرانولا وموسلي', labelEn: 'Oats, Granola & Muesli', subCategoryKey: 'شوفان وجرانولا وموسلي' },
      { id: 'honey', labelAr: 'عسل', labelEn: 'Honey', subCategoryKey: 'عسل' },
      { id: 'jam', labelAr: 'مربى', labelEn: 'Jam', subCategoryKey: 'مربى' },
      { id: 'chocolate-nut-spreads', labelAr: 'معجون الشوكولاتة والمكسرات', labelEn: 'Chocolate & Nut Spreads', subCategoryKey: 'معجون الشوكولاتة والمكسرات' },
      { id: 'tahini-halawa-molasses', labelAr: 'طحينة وحلاوة ودبس', labelEn: 'Tahini, Halawa & Molasses', subCategoryKey: 'طحينة وحلاوة ودبس' }
    ]
  },
  {
    id: 'baby-products',
    order: 14,
    categoryKey: 'منتجات الأطفال',
    labelAr: 'منتجات الأطفال',
    labelEn: 'Baby Products',
    branches: [
      { id: 'infant-formula', labelAr: 'حليب أطفال', labelEn: 'Infant Formula', subCategoryKey: 'حليب أطفال' },
      { id: 'baby-food', labelAr: 'أغذية أطفال', labelEn: 'Baby Food', subCategoryKey: 'أغذية أطفال' },
      { id: 'baby-cereals', labelAr: 'حبوب أطفال', labelEn: 'Baby Cereals', subCategoryKey: 'حبوب أطفال' },
      { id: 'baby-juices-snacks', labelAr: 'عصائر وسناك أطفال', labelEn: 'Baby Juices & Snacks', subCategoryKey: 'عصائر وسناك أطفال' },
      { id: 'diapers-essentials', labelAr: 'حفاضات ومستلزمات', labelEn: 'Diapers & Essentials', subCategoryKey: 'حفاضات ومستلزمات' }
    ]
  },
  {
    id: 'bakery-pastry-supplies',
    order: 15,
    categoryKey: 'مواد المخابز والحلويات التجارية',
    labelAr: 'مواد المخابز والحلويات التجارية',
    labelEn: 'Bakery & Pastry Supplies',
    branches: [
      { id: 'specialty-flour', labelAr: 'طحين متخصص', labelEn: 'Specialty Flour', subCategoryKey: 'طحين متخصص' },
      { id: 'yeast-improvers', labelAr: 'خميرة ومحسنات خبز', labelEn: 'Yeast & Improvers', subCategoryKey: 'خميرة ومحسنات خبز' },
      { id: 'cake-dough-mixes', labelAr: 'خلطات كيك وعجين', labelEn: 'Cake & Dough Mixes', subCategoryKey: 'خلطات كيك وعجين' },
      { id: 'baking-chocolate-cream', labelAr: 'شوكولاتة وكريمة تصنيع', labelEn: 'Baking Chocolate & Cream', subCategoryKey: 'شوكولاتة وكريمة تصنيع' },
      { id: 'fillings-dessert-sauces', labelAr: 'حشوات وصلصات حلويات', labelEn: 'Fillings & Dessert Sauces', subCategoryKey: 'حشوات وصلصات حلويات' },
      { id: 'decorations', labelAr: 'مواد تزيين', labelEn: 'Decorations', subCategoryKey: 'مواد تزيين' }
    ]
  },
  {
    id: 'foodservice-commercial-kitchen',
    order: 16,
    categoryKey: 'مواد المطاعم والمطابخ التجارية',
    labelAr: 'مواد المطاعم والمطابخ التجارية',
    labelEn: 'Foodservice & Commercial Kitchen',
    branches: [
      { id: 'bulk-sauces-seasonings', labelAr: 'عبوات صلصات وتوابل مهنية', labelEn: 'Bulk Sauces & Seasonings', subCategoryKey: 'عبوات صلصات وتوابل مهنية' },
      { id: 'bulk-cooking-ingredients', labelAr: 'مواد طبخ بالجملة', labelEn: 'Bulk Cooking Ingredients', subCategoryKey: 'مواد طبخ بالجملة' },
      { id: 'gloves-caps-aprons', labelAr: 'قفازات وأغطية رأس ومرايل', labelEn: 'Gloves, Caps & Aprons', subCategoryKey: 'قفازات وأغطية رأس ومرايل' },
      { id: 'professional-tissues', labelAr: 'مناديل ومنشفات مهنية', labelEn: 'Professional Tissues', subCategoryKey: 'مناديل ومنشفات مهنية' },
      { id: 'kitchen-supplies', labelAr: 'مستلزمات المطابخ', labelEn: 'Kitchen Supplies', subCategoryKey: 'مستلزمات المطابخ' }
    ]
  },
  {
    id: 'cleaning-products',
    order: 17,
    categoryKey: 'منظفات',
    labelAr: 'منظفات',
    labelEn: 'Cleaning Products',
    aliases: ['منظفات وعناية'],
    branches: [
      { id: 'laundry', labelAr: 'منظفات الغسيل', labelEn: 'Laundry', subCategoryKey: 'منظفات الغسيل' },
      { id: 'dishwashing', labelAr: 'منظفات الأطباق', labelEn: 'Dishwashing', subCategoryKey: 'منظفات الأطباق' },
      { id: 'floor-surface-cleaners', labelAr: 'منظفات الأرضيات والأسطح', labelEn: 'Floor & Surface Cleaners', subCategoryKey: 'منظفات الأرضيات والأسطح' },
      { id: 'bathroom-kitchen-cleaners', labelAr: 'منظفات الحمامات والمطابخ', labelEn: 'Bathroom & Kitchen Cleaners', subCategoryKey: 'منظفات الحمامات والمطابخ' },
      { id: 'glass-cleaners', labelAr: 'منظفات الزجاج', labelEn: 'Glass Cleaners', subCategoryKey: 'منظفات الزجاج' },
      { id: 'disinfectants-sanitizers', labelAr: 'مطهرات ومعقمات', labelEn: 'Disinfectants & Sanitizers', subCategoryKey: 'مطهرات ومعقمات' },
      { id: 'air-fresheners-insecticides', labelAr: 'معطرات الجو ومبيدات الحشرات', labelEn: 'Air Fresheners & Insecticides', subCategoryKey: 'معطرات الجو ومبيدات الحشرات' },
      { id: 'institutional-cleaners', labelAr: 'منظفات المؤسسات', labelEn: 'Institutional Cleaners', subCategoryKey: 'منظفات المؤسسات' },
      { id: 'cleaning-tools', labelAr: 'أدوات التنظيف', labelEn: 'Cleaning Tools', subCategoryKey: 'أدوات التنظيف' }
    ]
  },
  {
    id: 'personal-care',
    order: 18,
    categoryKey: 'عناية شخصية',
    labelAr: 'عناية شخصية',
    labelEn: 'Personal Care',
    branches: [
      { id: 'hair-care', labelAr: 'شامبو وبلسم', labelEn: 'Hair Care', subCategoryKey: 'شامبو وبلسم' },
      { id: 'bath-soap', labelAr: 'استحمام وصابون', labelEn: 'Bath & Soap', subCategoryKey: 'استحمام وصابون' },
      { id: 'oral-care', labelAr: 'العناية بالفم', labelEn: 'Oral Care', subCategoryKey: 'العناية بالفم' },
      { id: 'deodorants', labelAr: 'مزيلات العرق', labelEn: 'Deodorants', subCategoryKey: 'مزيلات العرق' },
      { id: 'shaving', labelAr: 'حلاقة', labelEn: 'Shaving', subCategoryKey: 'حلاقة' },
      { id: 'skin-care', labelAr: 'العناية بالبشرة', labelEn: 'Skin Care', subCategoryKey: 'العناية بالبشرة' },
      { id: 'feminine-hygiene', labelAr: 'النظافة النسائية', labelEn: 'Feminine Hygiene', subCategoryKey: 'النظافة النسائية' },
      { id: 'wet-wipes', labelAr: 'مناديل مبللة', labelEn: 'Wet Wipes', subCategoryKey: 'مناديل مبللة' }
    ]
  },
  {
    id: 'paper-products',
    order: 19,
    categoryKey: 'ورقيات',
    labelAr: 'ورقيات',
    labelEn: 'Paper Products',
    branches: [
      { id: 'toilet-paper', labelAr: 'ورق تواليت', labelEn: 'Toilet Paper', subCategoryKey: 'ورق تواليت' },
      { id: 'facial-tissues', labelAr: 'مناديل وجه', labelEn: 'Facial Tissues', subCategoryKey: 'مناديل وجه' },
      { id: 'kitchen-towels', labelAr: 'مناديل مطبخ', labelEn: 'Kitchen Towels', subCategoryKey: 'مناديل مطبخ' },
      { id: 'napkins', labelAr: 'مناديل سفرة', labelEn: 'Napkins', subCategoryKey: 'مناديل سفرة' },
      { id: 'foil-wrap-baking-paper', labelAr: 'ورق ألمنيوم وتغليف وورق زبدة', labelEn: 'Foil, Wrap & Baking Paper', subCategoryKey: 'ورق ألمنيوم وتغليف وورق زبدة' },
      { id: 'food-storage-bags', labelAr: 'أكياس حفظ الطعام', labelEn: 'Food Storage Bags', subCategoryKey: 'أكياس حفظ الطعام' }
    ]
  },
  {
    id: 'packaging-disposables',
    order: 20,
    categoryKey: 'تعبئة وتغليف',
    labelAr: 'تعبئة وتغليف',
    labelEn: 'Packaging & Disposables',
    branches: [
      { id: 'shopping-bags', labelAr: 'أكياس تسوق', labelEn: 'Shopping Bags', subCategoryKey: 'أكياس تسوق' },
      { id: 'trash-bags', labelAr: 'أكياس نفايات', labelEn: 'Trash Bags', subCategoryKey: 'أكياس نفايات' },
      { id: 'food-containers', labelAr: 'علب طعام وحافظات', labelEn: 'Food Containers', subCategoryKey: 'علب طعام وحافظات' },
      { id: 'cups-lids', labelAr: 'أكواب وأغطية', labelEn: 'Cups & Lids', subCategoryKey: 'أكواب وأغطية' },
      { id: 'plates', labelAr: 'أطباق', labelEn: 'Plates', subCategoryKey: 'أطباق' },
      { id: 'cutlery', labelAr: 'أدوات مائدة', labelEn: 'Cutlery', subCategoryKey: 'أدوات مائدة' },
      { id: 'boxes-packing-materials', labelAr: 'كراتين ومواد تغليف', labelEn: 'Boxes & Packing Materials', subCategoryKey: 'كراتين ومواد تغليف' }
    ]
  },
  {
    id: 'supermarket-supplies',
    order: 21,
    categoryKey: 'مستلزمات السوبر ماركت',
    labelAr: 'مستلزمات السوبر ماركت',
    labelEn: 'Supermarket Supplies',
    branches: [
      { id: 'receipt-rolls-bags', labelAr: 'رول كاشير وأكياس', labelEn: 'Receipt Rolls & Bags', subCategoryKey: 'رول كاشير وأكياس' },
      { id: 'price-tags-barcode-labels', labelAr: 'بطاقات أسعار وملصقات باركود', labelEn: 'Price Tags & Barcode Labels', subCategoryKey: 'بطاقات أسعار وملصقات باركود' },
      { id: 'baskets-trolleys', labelAr: 'سلال وعربات', labelEn: 'Baskets & Trolleys', subCategoryKey: 'سلال وعربات' },
      { id: 'shelving-display', labelAr: 'رفوف وحوامل عرض', labelEn: 'Shelving & Display', subCategoryKey: 'رفوف وحوامل عرض' },
      { id: 'shelf-organization', labelAr: 'أدوات تنظيم الرفوف', labelEn: 'Shelf Organization', subCategoryKey: 'أدوات تنظيم الرفوف' },
      { id: 'cashier-supplies', labelAr: 'مستلزمات الكاشير', labelEn: 'Cashier Supplies', subCategoryKey: 'مستلزمات الكاشير' }
    ]
  },
  {
    id: 'cafe-restaurant-supplies',
    order: 22,
    categoryKey: 'مستلزمات المقاهي والمطاعم',
    labelAr: 'مستلزمات المقاهي والمطاعم',
    labelEn: 'Café & Restaurant Supplies',
    branches: [
      { id: 'takeaway-cups-lids', labelAr: 'أكواب وأغطية Takeaway', labelEn: 'Takeaway Cups & Lids', subCategoryKey: 'أكواب وأغطية Takeaway' },
      { id: 'straws-stirrers', labelAr: 'شفاطات وعيدان تحريك', labelEn: 'Straws & Stirrers', subCategoryKey: 'شفاطات وعيدان تحريك' },
      { id: 'cafe-sugar-creamers-sweeteners', labelAr: 'سكر وكريمة ومحليات للمقاهي', labelEn: 'Café Sugar, Creamers & Sweeteners', subCategoryKey: 'سكر وكريمة ومحليات للمقاهي' },
      { id: 'takeaway-packaging', labelAr: 'عبوات Takeaway', labelEn: 'Takeaway Packaging', subCategoryKey: 'عبوات Takeaway' },
      { id: 'serving-supplies', labelAr: 'مستلزمات التقديم', labelEn: 'Serving Supplies', subCategoryKey: 'مستلزمات التقديم' }
    ]
  }
];
