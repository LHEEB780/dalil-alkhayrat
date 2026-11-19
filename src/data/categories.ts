import subcatAllCoffeeImg from '../assets/images/subcat_all_coffee_1794573391580.jpg';
import subcatDripCoffeeImg from '../assets/images/subcat_drip_coffee_1794573391555.jpg';
import subcatArabicaBeansImg from '../assets/images/subcat_arabica_beans_1794573392511.jpg';
import subcatCoffeePodsImg from '../assets/images/subcat_coffee_pods_1794573392676.jpg';
import subcatInstantCoffeeImg from '../assets/images/subcat_instant_coffee_1794573393076.jpg';

import catRiceGrainsImg from '../assets/images/cat_rice_grains_1794585209594.jpg';
import catOilsGheeImg from '../assets/images/cat_oils_ghee_1794585209308.jpg';
import catDairyCheeseImg from '../assets/images/cat_dairy_cheese_1794585210408.jpg';
import catCannedGoodsImg from '../assets/images/cat_canned_goods_1794585209818.jpg';
import catSugarSweetenersImg from '../assets/images/cat_sugar_sweeteners_1794585210363.jpg';
import catTeaDrinksImg from '../assets/images/cat_tea_drinks_1794585211607.jpg';
import catPastaNoodlesImg from '../assets/images/cat_pasta_noodles_1794585212139.jpg';
import catCleaningCareImg from '../assets/images/cat_cleaning_care_1794585211950.jpg';

export interface WholesaleCategoryItem {
  id: string;
  categoryKey: string;
  subCategoryKey?: string;
  labelAr: string;
  labelEn: string;
  imageUrl: string;
  row: 1 | 2;
}

export interface CategoryBranchItem {
  id: string;
  labelAr: string;
  labelEn: string;
  subCategoryKey?: string;
  keywords?: string[];
  imageUrl: string;
}

export interface GroceryDepartment extends WholesaleCategoryItem {
  order: number;
  aliases?: string[];
  branches: CategoryBranchItem[];
}

/**
 * Legacy categoryKey -> new Department categoryKey alias mapping
 * Ensures all old category keys continue working seamlessly across the app and API.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
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

export function resolveCategoryKey(key: string): string {
  if (!key || key === 'الكل') return 'الكل';
  return CATEGORY_ALIASES[key] || key;
}

/**
 * Compact homepage / CategoryBar quick-access items (preserves exact 2-row homepage & CategoryBar structure).
 */
export const WHOLESALE_CATEGORIES: WholesaleCategoryItem[] = [
  {
    id: 'coffee_hot',
    categoryKey: 'قهوة ومشروبات ساخنة',
    labelAr: 'قهوة ومشروبات ساخنة',
    labelEn: 'Coffee & Hot Drinks',
    imageUrl: subcatAllCoffeeImg,
    row: 1
  },
  {
    id: 'rice_grains',
    categoryKey: 'أرز وحبوب',
    labelAr: 'أرز وحبوب',
    labelEn: 'Rice & Grains',
    imageUrl: catRiceGrainsImg,
    row: 1
  },
  {
    id: 'oils_ghee',
    categoryKey: 'زيوت وسمن',
    labelAr: 'زيوت وسمن',
    labelEn: 'Oils & Ghee',
    imageUrl: catOilsGheeImg,
    row: 1
  },
  {
    id: 'dairy_cheese',
    categoryKey: 'ألبان وأجبان',
    labelAr: 'ألبان وأجبان',
    labelEn: 'Dairy & Cheese',
    imageUrl: catDairyCheeseImg,
    row: 1
  },
  {
    id: 'cleaning_care',
    categoryKey: 'منظفات وعناية',
    labelAr: 'منظفات وعناية',
    labelEn: 'Cleaning & Care',
    imageUrl: catCleaningCareImg,
    row: 1
  },
  {
    id: 'canned_pickles',
    categoryKey: 'معلبات ومخللات',
    labelAr: 'معلبات ومخللات',
    labelEn: 'Canned & Pickles',
    imageUrl: catCannedGoodsImg,
    row: 2
  },
  {
    id: 'sugar_sweeteners',
    categoryKey: 'سكر ومحليات',
    labelAr: 'سكر ومحليات',
    labelEn: 'Sugar & Sweeteners',
    imageUrl: catSugarSweetenersImg,
    row: 2
  },
  {
    id: 'tea_beverages',
    categoryKey: 'مشروبات وشاي',
    labelAr: 'مشروبات وشاي',
    labelEn: 'Tea & Beverages',
    imageUrl: catTeaDrinksImg,
    row: 2
  },
  {
    id: 'pasta_noodles',
    categoryKey: 'مكرونة وشعرية',
    labelAr: 'مكرونة وشعرية',
    labelEn: 'Pasta & Noodles',
    imageUrl: catPastaNoodlesImg,
    row: 2
  },
  {
    id: 'drip_coffee',
    categoryKey: 'قهوة ومشروبات ساخنة',
    subCategoryKey: 'القهوة المقطرة',
    labelAr: 'القهوة المقطرة',
    labelEn: 'Drip Coffee',
    imageUrl: subcatDripCoffeeImg,
    row: 2
  },
  {
    id: 'arabica_beans',
    categoryKey: 'قهوة ومشروبات ساخنة',
    subCategoryKey: 'أرابيكا',
    labelAr: 'حبوب قهوة أرابيكا',
    labelEn: 'Arabica Beans',
    imageUrl: subcatArabicaBeansImg,
    row: 1
  },
  {
    id: 'coffee_pods',
    categoryKey: 'قهوة ومشروبات ساخنة',
    subCategoryKey: 'كبسولات سريعة',
    labelAr: 'كبسولات وإسبريسو',
    labelEn: 'Coffee Capsules',
    imageUrl: subcatCoffeePodsImg,
    row: 2
  }
];

/**
 * Full 22-Department B2B Wholesale Grocery Taxonomy (Department -> Category)
 * Displayed in AllCategoriesView and CategoryBranchesView.
 */
export const GROCERY_DEPARTMENTS: GroceryDepartment[] = [
  // 01 Pantry Staples
  {
    id: 'pantry-staples',
    order: 1,
    categoryKey: 'مواد غذائية أساسية',
    labelAr: 'مواد غذائية أساسية',
    labelEn: 'Pantry Staples',
    imageUrl: catRiceGrainsImg,
    row: 1,
    aliases: ['أرز وحبوب', 'سكر ومحليات', 'مكرونة وشعرية'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catRiceGrainsImg },
      { id: 'rice', labelAr: 'أرز', labelEn: 'Rice', subCategoryKey: 'أرز', keywords: ['أرز', 'بسمتي', 'عنبر', 'محلي', 'سريع الطهي', 'rice', 'basmati', 'anbar', 'long grain', 'parboiled', 'mahmood rice'], imageUrl: catRiceGrainsImg },
      { id: 'sugar-sweeteners', labelAr: 'سكر ومحليات', labelEn: 'Sugar & Sweeteners', subCategoryKey: 'سكر ومحليات', keywords: ['سكر', 'محليات', 'sugar', 'white sugar', 'cane sugar', 'sweeteners', 'brown sugar', 'stevia'], imageUrl: catSugarSweetenersImg },
      { id: 'flour-starches', labelAr: 'طحين ونشويات', labelEn: 'Flour & Starches', subCategoryKey: 'طحين ونشويات', keywords: ['طحين', 'دقيق', 'نشا', 'flour', 'wheat flour', 'all purpose flour', 'starch', 'cornstarch'], imageUrl: catRiceGrainsImg },
      { id: 'pulses', labelAr: 'بقوليات', labelEn: 'Pulses', subCategoryKey: 'بقوليات', keywords: ['عدس', 'حمص', 'فاصوليا', 'لوبيا', 'بقوليات', 'lentils', 'chickpeas', 'beans', 'pulses', 'legumes', 'black eyed peas'], imageUrl: catCannedGoodsImg },
      { id: 'grains-bulgur-couscous', labelAr: 'حبوب وبرغل وكسكس', labelEn: 'Grains, Bulgur & Couscous', subCategoryKey: 'حبوب وبرغل وكسكس', keywords: ['حبوب', 'برغل', 'كسكس', 'قمح', 'grains', 'bulgur', 'couscous', 'wheat', 'freekeh'], imageUrl: catRiceGrainsImg },
      { id: 'pasta-vermicelli-noodles', labelAr: 'مكرونة وشعرية ونودلز', labelEn: 'Pasta, Vermicelli & Noodles', subCategoryKey: 'مكرونة وشعرية ونودلز', keywords: ['مكرونة', 'معكرونة', 'سباغيتي', 'شعرية', 'نودلز', 'pasta', 'spaghetti', 'vermicelli', 'noodles', 'macaroni', 'barilla', 'indomie'], imageUrl: catPastaNoodlesImg },
      { id: 'salt', labelAr: 'ملح', labelEn: 'Salt', subCategoryKey: 'ملح', keywords: ['ملح', 'salt', 'table salt', 'sea salt', 'iodized salt', 'pink salt'], imageUrl: catSugarSweetenersImg },
      { id: 'cooking-baking-basics', labelAr: 'مواد الطبخ والخبز الأساسية', labelEn: 'Cooking & Baking Basics', subCategoryKey: 'مواد الطبخ والخبز الأساسية', keywords: ['طبخ', 'خبز', 'بيكنج', 'فانيلا', 'baking powder', 'vanilla', 'baking soda', 'cooking basics', 'breadcrumbs'], imageUrl: catPastaNoodlesImg }
    ]
  },
  // 02 Oils, Ghee & Fats
  {
    id: 'oils-ghee-fats',
    order: 2,
    categoryKey: 'زيوت وسمن ودهون',
    labelAr: 'زيوت وسمن ودهون',
    labelEn: 'Oils, Ghee & Fats',
    imageUrl: catOilsGheeImg,
    row: 1,
    aliases: ['زيوت وسمن'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catOilsGheeImg },
      { id: 'sunflower-oil', labelAr: 'زيت دوار الشمس', labelEn: 'Sunflower Oil', subCategoryKey: 'زيت دوار الشمس', keywords: ['دوار الشمس', 'عافية', 'نباتي', 'sunflower oil', 'cooking oil', 'afia', 'altonsa', 'vegetable oil'], imageUrl: catOilsGheeImg },
      { id: 'corn-oil', labelAr: 'زيت الذرة', labelEn: 'Corn Oil', subCategoryKey: 'زيت الذرة', keywords: ['ذرة', 'زيت الذرة', 'corn oil', 'mazola', 'afia corn', 'cooking oil'], imageUrl: catOilsGheeImg },
      { id: 'palm-oil', labelAr: 'زيت النخيل', labelEn: 'Palm Oil', subCategoryKey: 'زيت النخيل', keywords: ['نخيل', 'palm oil', 'palm olein', 'cooking oil', 'frying oil'], imageUrl: catOilsGheeImg },
      { id: 'soybean-vegetable-oils', labelAr: 'زيت الصويا والزيوت النباتية', labelEn: 'Soybean & Vegetable Oils', subCategoryKey: 'زيت الصويا والزيوت النباتية', keywords: ['صويا', 'نباتي', 'soybean oil', 'vegetable oil', 'canola oil', 'blended oil'], imageUrl: catOilsGheeImg },
      { id: 'olive-oil', labelAr: 'زيت الزيتون', labelEn: 'Olive Oil', subCategoryKey: 'زيت الزيتون', keywords: ['زيتون', 'olive oil', 'extra virgin', 'virgin olive oil', 'pomace oil', 'rs olive'], imageUrl: catOilsGheeImg },
      { id: 'vegetable-ghee', labelAr: 'سمن نباتي', labelEn: 'Vegetable Ghee', subCategoryKey: 'سمن نباتي', keywords: ['سمن نباتي', 'سمن', 'vegetable ghee', 'ghee', 'shortening', 'al-dar ghee'], imageUrl: catDairyCheeseImg },
      { id: 'animal-ghee', labelAr: 'سمن حيواني وزبدة سمن', labelEn: 'Animal Ghee', subCategoryKey: 'سمن حيواني وزبدة سمن', keywords: ['سمن حيواني', 'دهن حر', 'animal ghee', 'pure ghee', 'butter ghee', 'clarified butter'], imageUrl: catDairyCheeseImg },
      { id: 'professional-frying-oils', labelAr: 'زيوت القلي المهنية', labelEn: 'Professional Frying Oils', subCategoryKey: 'زيوت القلي المهنية', keywords: ['قلي', 'مهني', 'frying oil', 'deep fry oil', 'commercial oil', 'horeca oil'], imageUrl: catOilsGheeImg }
    ]
  },
  // 03 Canned & Preserved Foods
  {
    id: 'canned-preserved-foods',
    order: 3,
    categoryKey: 'معلبات وأغذية محفوظة',
    labelAr: 'معلبات وأغذية محفوظة',
    labelEn: 'Canned & Preserved Foods',
    imageUrl: catCannedGoodsImg,
    row: 2,
    aliases: ['معلبات ومخللات'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCannedGoodsImg },
      { id: 'canned-vegetables', labelAr: 'خضار معلبة', labelEn: 'Canned Vegetables', subCategoryKey: 'خضار معلبة', keywords: ['ذرة', 'بازلاء', 'فطر', 'خضار', 'canned vegetables', 'sweet corn', 'green peas', 'mushrooms', 'canned veggies'], imageUrl: catCannedGoodsImg },
      { id: 'canned-pulses', labelAr: 'بقوليات معلبة', labelEn: 'Canned Pulses', subCategoryKey: 'بقوليات معلبة', keywords: ['فاصوليا', 'حمص', 'فول', 'canned beans', 'chickpeas', 'fava beans', 'foul medames', 'hummus', 'kidney beans'], imageUrl: catCannedGoodsImg },
      { id: 'canned-fish-tuna', labelAr: 'تونة وأسماك معلبة', labelEn: 'Canned Fish & Tuna', subCategoryKey: 'تونة وأسماك معلبة', keywords: ['تونة', 'سردين', 'أسماك', 'tuna', 'sardines', 'canned fish', 'mackerel', 'seafood cans'], imageUrl: catCannedGoodsImg },
      { id: 'canned-meat', labelAr: 'لحوم معلبة', labelEn: 'Canned Meat', subCategoryKey: 'لحوم معلبة', keywords: ['لحوم', 'لانشون', 'مرتديلا', 'canned meat', 'luncheon meat', 'corned beef', 'mortadella', 'canned chicken'], imageUrl: catCannedGoodsImg },
      { id: 'tomato-paste-sauce', labelAr: 'معجون وصلصة الطماطم', labelEn: 'Tomato Paste & Sauce', subCategoryKey: 'معجون وصلصة الطماطم', keywords: ['معجون', 'طماطم', 'صلصة', 'tomato paste', 'tomato sauce', 'crushed tomatoes', 'al-tonsa', 'zer'], imageUrl: catCannedGoodsImg },
      { id: 'canned-fruits', labelAr: 'فواكه معلبة', labelEn: 'Canned Fruits', subCategoryKey: 'فواكه معلبة', keywords: ['فواكه', 'أناناس', 'خوخ', 'canned fruits', 'pineapple', 'peaches', 'fruit cocktail', 'syrup fruit'], imageUrl: catCannedGoodsImg },
      { id: 'pickles-olives', labelAr: 'مخللات وزيتون', labelEn: 'Pickles & Olives', subCategoryKey: 'مخللات وزيتون', keywords: ['مخلل', 'طرشي', 'زيتون', 'pickles', 'olives', 'torshi', 'pickled cucumbers', 'jalapeno'], imageUrl: catCannedGoodsImg },
      { id: 'canned-ready-meals', labelAr: 'وجبات جاهزة معلبة', labelEn: 'Canned Ready Meals', subCategoryKey: 'وجبات جاهزة معلبة', keywords: ['وجبات', 'جاهزة', 'ready meals', 'canned meals', 'stuffed vine leaves', 'dolma', 'instant meals'], imageUrl: catCannedGoodsImg }
    ]
  },
  // 04 Sauces, Spices & Seasonings
  {
    id: 'sauces-spices-seasonings',
    order: 4,
    categoryKey: 'صلصات وتوابل',
    labelAr: 'صلصات وتوابل',
    labelEn: 'Sauces, Spices & Seasonings',
    imageUrl: catCannedGoodsImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCannedGoodsImg },
      { id: 'ketchup-mayonnaise', labelAr: 'كاتشب ومايونيز', labelEn: 'Ketchup & Mayonnaise', subCategoryKey: 'كاتشب ومايونيز', keywords: ['كاتشب', 'مايونيز', 'ketchup', 'mayonnaise', 'mayo', 'heinz', 'hellmanns'], imageUrl: catCannedGoodsImg },
      { id: 'mustard-hot-sauces', labelAr: 'مستردة وصلصات حارة', labelEn: 'Mustard & Hot Sauces', subCategoryKey: 'مستردة وصلصات حارة', keywords: ['مستردة', 'شطة', 'حارة', 'mustard', 'hot sauce', 'chili sauce', 'tabasco', 'sriracha'], imageUrl: catCannedGoodsImg },
      { id: 'cooking-pizza-pasta-sauces', labelAr: 'صلصات الطبخ والبيتزا والمعكرونة', labelEn: 'Cooking, Pizza & Pasta Sauces', subCategoryKey: 'صلصات الطبخ والبيتزا والمعكرونة', keywords: ['بيتزا', 'معكرونة', 'صلصة', 'pizza sauce', 'pasta sauce', 'marinara', 'bbq sauce', 'cooking sauce'], imageUrl: catPastaNoodlesImg },
      { id: 'soy-vinegar-molasses', labelAr: 'صويا وخل ودبس', labelEn: 'Soy Sauce, Vinegar & Molasses', subCategoryKey: 'صويا وخل ودبس', keywords: ['صويا', 'خل', 'دبس', 'رمان', 'soy sauce', 'vinegar', 'pomegranate molasses', 'balsamic', 'apple cider vinegar'], imageUrl: catOilsGheeImg },
      { id: 'spices', labelAr: 'بهارات وتوابل', labelEn: 'Spices', subCategoryKey: 'بهارات وتوابل', keywords: ['بهارات', 'توابل', 'فلفل', 'كمون', 'كركم', 'spices', 'black pepper', 'cumin', 'turmeric', 'paprika', 'cinnamon'], imageUrl: catRiceGrainsImg },
      { id: 'dried-herbs', labelAr: 'أعشاب مجففة', labelEn: 'Dried Herbs', subCategoryKey: 'أعشاب مجففة', keywords: ['أعشاب', 'زعتر', 'نعناع', 'أوريغانو', 'dried herbs', 'thyme', 'zaatar', 'oregano', 'dried mint', 'basil'], imageUrl: catTeaDrinksImg },
      { id: 'stock-cubes-flavor-enhancers', labelAr: 'مكعبات مرق ومحسنات نكهة', labelEn: 'Stock Cubes & Flavor Enhancers', subCategoryKey: 'مكعبات مرق ومحسنات نكهة', keywords: ['مرق', 'ماجي', 'نكهة', 'stock cubes', 'bouillon', 'maggi', 'knorr', 'chicken stock'], imageUrl: catCannedGoodsImg },
      { id: 'cooking-mixes', labelAr: 'خلطات الطبخ', labelEn: 'Cooking Mixes', subCategoryKey: 'خلطات الطبخ', keywords: ['خلطات', 'تتبيلة', 'cooking mixes', 'seasoning mix', 'marinade', 'biryani mix', 'shawarma spice'], imageUrl: catCannedGoodsImg }
    ]
  },
  // 05 Dairy & Eggs
  {
    id: 'dairy-eggs',
    order: 5,
    categoryKey: 'ألبان وبيض',
    labelAr: 'ألبان وبيض',
    labelEn: 'Dairy & Eggs',
    imageUrl: catDairyCheeseImg,
    row: 1,
    aliases: ['ألبان وأجبان'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catDairyCheeseImg },
      { id: 'fresh-milk', labelAr: 'حليب طازج', labelEn: 'Fresh Milk', subCategoryKey: 'حليب طازج', keywords: ['حليب طازج', 'fresh milk', 'dairy milk', 'full cream milk', 'low fat milk', 'almarai'], imageUrl: catDairyCheeseImg },
      { id: 'uht-milk', labelAr: 'حليب طويل الأجل', labelEn: 'UHT Milk', subCategoryKey: 'حليب طويل الأجل', keywords: ['حليب طويل الأجل', 'سائل', 'uht milk', 'long life milk', 'liquid milk', 'kdd milk', 'almarai uht'], imageUrl: catDairyCheeseImg },
      { id: 'powdered-evaporated-condensed-milk', labelAr: 'حليب بودرة ومبخر ومكثف', labelEn: 'Powdered, Evaporated & Condensed Milk', subCategoryKey: 'حليب بودرة ومبخر ومكثف', keywords: ['بودرة', 'مبخر', 'مكثف', 'حليب', 'milk powder', 'nido', 'evaporated milk', 'condensed milk', 'rainbow milk'], imageUrl: catDairyCheeseImg },
      { id: 'laban-yogurt-labneh', labelAr: 'لبن وزبادي ولبنة', labelEn: 'Laban, Yogurt & Labneh', subCategoryKey: 'لبن وزبادي ولبنة', keywords: ['لبن', 'زبادي', 'لبنة', 'رائب', 'laban', 'yogurt', 'labneh', 'ayran', 'greek yogurt'], imageUrl: catDairyCheeseImg },
      { id: 'cheese', labelAr: 'أجبان', labelEn: 'Cheese', subCategoryKey: 'أجبان', keywords: ['جبن', 'أجبان', 'موزاريلا', 'شيدر', 'cheese', 'mozzarella', 'cheddar', 'feta', 'kiri', 'puck'], imageUrl: catDairyCheeseImg },
      { id: 'cream-qeshta', labelAr: 'قشطة وكريمة', labelEn: 'Cream & Qeshta', subCategoryKey: 'قشطة وكريمة', keywords: ['قشطة', 'كريمة', 'كيمر', 'cream', 'qeshta', 'cooking cream', 'whipping cream', 'kaymak'], imageUrl: catDairyCheeseImg },
      { id: 'butter-margarine', labelAr: 'زبدة ومارجرين', labelEn: 'Butter & Margarine', subCategoryKey: 'زبدة ومارجرين', keywords: ['زبدة', 'مارجرين', 'butter', 'margarine', 'unsalted butter', 'lurpak', 'president butter'], imageUrl: catDairyCheeseImg },
      { id: 'eggs', labelAr: 'بيض', labelEn: 'Eggs', subCategoryKey: 'بيض', keywords: ['بيض', 'طبقة بيض', 'eggs', 'egg tray', 'white eggs', 'brown eggs', 'fresh eggs'], imageUrl: catDairyCheeseImg },
      { id: 'milk-alternatives', labelAr: 'بدائل الحليب', labelEn: 'Milk Alternatives', subCategoryKey: 'بدائل الحليب', keywords: ['لوز', 'شوفان', 'صويا', 'نباتي', 'almond milk', 'oat milk', 'soy milk', 'plant milk', 'coconut milk', 'alpro'], imageUrl: catDairyCheeseImg }
    ]
  },
  // 06 Frozen Foods
  {
    id: 'frozen-foods',
    order: 6,
    categoryKey: 'مجمدات',
    labelAr: 'مجمدات',
    labelEn: 'Frozen Foods',
    imageUrl: catDairyCheeseImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catDairyCheeseImg },
      { id: 'frozen-vegetables', labelAr: 'خضار مجمدة', labelEn: 'Frozen Vegetables', subCategoryKey: 'خضار مجمدة', keywords: ['خضار مجمدة', 'بازلاء', 'ذرة', 'frozen vegetables', 'frozen peas', 'frozen corn', 'mixed vegetables', 'okra'], imageUrl: catCannedGoodsImg },
      { id: 'frozen-fruits', labelAr: 'فواكه مجمدة', labelEn: 'Frozen Fruits', subCategoryKey: 'فواكه مجمدة', keywords: ['فواكه مجمدة', 'فراولة', 'مانجو', 'frozen fruits', 'frozen strawberries', 'frozen mango', 'berries', 'smoothie fruit'], imageUrl: catCannedGoodsImg },
      { id: 'frozen-potatoes', labelAr: 'بطاطا مجمدة', labelEn: 'Frozen Potatoes', subCategoryKey: 'بطاطا مجمدة', keywords: ['بطاطا', 'فنجر', 'مقلية', 'مجمدة', 'french fries', 'frozen potatoes', 'fries', 'wedges', 'lamb weston', 'mccain'], imageUrl: catPastaNoodlesImg },
      { id: 'frozen-ready-meals', labelAr: 'وجبات ومأكولات جاهزة مجمدة', labelEn: 'Frozen Ready Meals', subCategoryKey: 'وجبات ومأكولات جاهزة مجمدة', keywords: ['وجبات مجمدة', 'كبة', 'برغر', 'frozen meals', 'kubba', 'nuggets', 'frozen burgers', 'samosa'], imageUrl: catCannedGoodsImg },
      { id: 'frozen-dough-pastries', labelAr: 'عجائن ومعجنات مجمدة', labelEn: 'Frozen Dough & Pastries', subCategoryKey: 'عجائن ومعجنات مجمدة', keywords: ['عجائن', 'معجنات', 'بقلاوة', 'بف باستري', 'frozen dough', 'puff pastry', 'phyllo', 'kunafa', 'paratha'], imageUrl: catPastaNoodlesImg },
      { id: 'ice-cream-frozen-desserts', labelAr: 'آيس كريم وحلويات مجمدة', labelEn: 'Ice Cream & Frozen Desserts', subCategoryKey: 'آيس كريم وحلويات مجمدة', keywords: ['آيس كريم', 'موطة', 'مثلجات', 'ice cream', 'gelato', 'frozen desserts', 'popsicles', 'magnum'], imageUrl: catDairyCheeseImg }
    ]
  },
  // 07 Meat, Poultry & Seafood
  {
    id: 'meat-poultry-seafood',
    order: 7,
    categoryKey: 'لحوم ودواجن وأسماك',
    labelAr: 'لحوم ودواجن وأسماك',
    labelEn: 'Meat, Poultry & Seafood',
    imageUrl: catCannedGoodsImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCannedGoodsImg },
      { id: 'red-meat', labelAr: 'لحوم حمراء', labelEn: 'Red Meat', subCategoryKey: 'لحوم حمراء', keywords: ['غنم', 'عجل', 'لحم', 'red meat', 'beef', 'lamb', 'veal', 'minced meat'], imageUrl: catCannedGoodsImg },
      { id: 'chicken-turkey', labelAr: 'دجاج وديك رومي', labelEn: 'Chicken & Turkey', subCategoryKey: 'دجاج وديك رومي', keywords: ['دجاج', 'ديك رومي', 'صدر دجاج', 'chicken', 'turkey', 'chicken breast', 'poultry', 'sadia', 'al-kafeel'], imageUrl: catCannedGoodsImg },
      { id: 'fish', labelAr: 'أسماك', labelEn: 'Fish', subCategoryKey: 'أسماك', keywords: ['سمك', 'أسماك', 'فيليه', 'fish', 'fish fillet', 'salmon', 'tilapia', 'frozen fish'], imageUrl: catCannedGoodsImg },
      { id: 'seafood', labelAr: 'مأكولات بحرية', labelEn: 'Seafood', subCategoryKey: 'مأكولات بحرية', keywords: ['روبيان', 'جمبري', 'بحرية', 'seafood', 'shrimp', 'prawns', 'calamari', 'crab'], imageUrl: catCannedGoodsImg },
      { id: 'processed-meat', labelAr: 'لحوم مصنعة', labelEn: 'Processed Meat', subCategoryKey: 'لحوم مصنعة', keywords: ['نقانق', 'برغر', 'مرتديلا', 'سجق', 'processed meat', 'sausage', 'hot dog', 'burger patties', 'mortadella', 'salami'], imageUrl: catCannedGoodsImg }
    ]
  },
  // 08 Beverages
  {
    id: 'beverages',
    order: 8,
    categoryKey: 'مشروبات',
    labelAr: 'مشروبات',
    labelEn: 'Beverages',
    imageUrl: catTeaDrinksImg,
    row: 2,
    aliases: ['مشروبات وشاي'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catTeaDrinksImg },
      { id: 'mineral-water', labelAr: 'مياه معدنية', labelEn: 'Mineral Water', subCategoryKey: 'مياه معدنية', keywords: ['مياه معدنية', 'ماء', 'مياه', 'mineral water', 'water', 'bottled water', 'al-waha', 'aquafina', 'arwa'], imageUrl: catTeaDrinksImg },
      { id: 'drinking-water-jugs', labelAr: 'مياه شرب وجالونات', labelEn: 'Drinking Water & Jugs', subCategoryKey: 'مياه شرب وجالونات', keywords: ['جالون', 'مياه شرب', 'drinking water', 'water jugs', 'water gallon', 'water dispenser', 'water'], imageUrl: catTeaDrinksImg },
      { id: 'soft-drinks', labelAr: 'مشروبات غازية', labelEn: 'Soft Drinks', subCategoryKey: 'مشروبات غازية', keywords: ['غازية', 'كولا', 'بيبسي', 'soft drinks', 'soda', 'cola', 'pepsi', 'coca cola', '7up', 'mirinda'], imageUrl: catTeaDrinksImg },
      { id: 'juices-nectars', labelAr: 'عصائر ونكتار', labelEn: 'Juices & Nectars', subCategoryKey: 'عصائر ونكتار', keywords: ['عصير', 'عصائر', 'نكتار', 'juice', 'nectar', 'orange juice', 'apple juice', 'rani', 'almarai juice'], imageUrl: catTeaDrinksImg },
      { id: 'energy-drinks', labelAr: 'مشروبات الطاقة', labelEn: 'Energy Drinks', subCategoryKey: 'مشروبات الطاقة', keywords: ['طاقة', 'ريد بول', 'تايجر', 'energy drinks', 'red bull', 'tiger', 'monster', 'wild tiger'], imageUrl: catTeaDrinksImg },
      { id: 'sports-functional-drinks', labelAr: 'مشروبات رياضية ووظيفية', labelEn: 'Sports & Functional Drinks', subCategoryKey: 'مشروبات رياضية ووظيفية', keywords: ['رياضية', 'وظيفية', 'sports drinks', 'electrolyte', 'gatorade', 'powerade', 'isotonic'], imageUrl: catTeaDrinksImg },
      { id: 'concentrates-powder-drinks', labelAr: 'شراب مركز ومشروبات بودرة', labelEn: 'Concentrates & Powder Drinks', subCategoryKey: 'شراب مركز ومشروبات بودرة', keywords: ['مركز', 'شراب', 'تانج', 'بودرة', 'concentrate', 'powder drinks', 'tang', 'vimto', 'syrup'], imageUrl: catTeaDrinksImg },
      { id: 'non-alcoholic-malt-drinks', labelAr: 'مشروبات شعير غير كحولية', labelEn: 'Non-alcoholic Malt Drinks', subCategoryKey: 'مشروبات شعير غير كحولية', keywords: ['شعير', 'مالت', 'malt drink', 'barbican', 'moussy', 'non alcoholic beer', 'barley drink'], imageUrl: catTeaDrinksImg },
      { id: 'sugar-free-drinks', labelAr: 'مشروبات خالية من السكر', labelEn: 'Sugar-free Drinks', subCategoryKey: 'مشروبات خالية من السكر', keywords: ['دايت', 'زيرو', 'خالي من السكر', 'sugar free', 'diet soda', 'zero sugar', 'pepsi zero', 'diet cola'], imageUrl: catTeaDrinksImg }
    ]
  },
  // 09 Tea & Coffee (preserves existing coffee branches: All Coffee, Drip Coffee, Arabica Beans, Coffee Capsules, Instant Coffee)
  {
    id: 'tea-coffee',
    order: 9,
    categoryKey: 'شاي وقهوة',
    labelAr: 'شاي وقهوة',
    labelEn: 'Tea & Coffee',
    imageUrl: subcatAllCoffeeImg,
    row: 1,
    aliases: ['قهوة ومشروبات ساخنة'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Coffee', imageUrl: subcatAllCoffeeImg },
      { id: 'black-tea', labelAr: 'شاي أسود', labelEn: 'Black Tea', subCategoryKey: 'شاي أسود', keywords: ['شاي أسود', 'سيلاني', 'شاي', 'black tea', 'ceylon tea', 'loose tea', 'mahmood tea', 'ahmad tea', 'al-ghazaleen'], imageUrl: catTeaDrinksImg },
      { id: 'green-herbal-tea', labelAr: 'شاي أخضر وأعشاب', labelEn: 'Green & Herbal Tea', subCategoryKey: 'شاي أخضر وأعشاب', keywords: ['شاي أخضر', 'أعشاب', 'بابونج', 'green tea', 'herbal tea', 'chamomile', 'mint tea', 'anise'], imageUrl: catTeaDrinksImg },
      { id: 'tea-bags', labelAr: 'شاي أكياس', labelEn: 'Tea Bags', subCategoryKey: 'شاي أكياس', keywords: ['شاي أكياس', 'فتلة', 'ميداليات', 'tea bags', 'lipton', 'ahmad tea bags', 'pyramid tea'], imageUrl: catTeaDrinksImg },
      { id: 'arabic-turkish-coffee', labelAr: 'قهوة عربية وتركية', labelEn: 'Arabic & Turkish Coffee', subCategoryKey: 'قهوة عربية وتركية', keywords: ['عربية', 'تركية', 'هيل', 'arabic coffee', 'turkish coffee', 'cardamom coffee', 'al-ameed', 'mehmet efendi'], imageUrl: subcatAllCoffeeImg },
      { id: 'ground-coffee-beans', labelAr: 'قهوة مطحونة وحبوب', labelEn: 'Ground Coffee & Beans', subCategoryKey: 'حبوب كاملة', keywords: ['مطحونة', 'حبوب', 'كاملة', 'ground coffee', 'coffee beans', 'whole beans', 'espresso beans', 'lavazza', 'illy'], imageUrl: subcatArabicaBeansImg },
      { id: 'drip', labelAr: 'القهوة المقطرة', labelEn: 'Drip Coffee', subCategoryKey: 'القهوة المقطرة', keywords: ['مقطرة', 'فلتر', 'drip coffee', 'filter coffee', 'pour over', 'v60', 'specialty coffee'], imageUrl: subcatDripCoffeeImg },
      { id: 'arabica', labelAr: 'أرابيكا 100%', labelEn: 'Arabica Beans', subCategoryKey: 'أرابيكا', keywords: ['أرابيكا', 'arabica', 'arabica beans', '100% arabica', 'single origin', 'roasted beans'], imageUrl: subcatArabicaBeansImg },
      { id: 'instant', labelAr: 'قهوة سريعة وخلطات 3×1', labelEn: 'Instant Coffee', subCategoryKey: 'سريعة التحضير', keywords: ['سريعة', '3 في 1', '3×1', 'نسكافيه', 'instant coffee', 'nescafe', '3 in 1', 'coffee mix', 'jacobs', 'davidoff'], imageUrl: subcatInstantCoffeeImg },
      { id: 'pods', labelAr: 'كبسولات القهوة', labelEn: 'Coffee Capsules', subCategoryKey: 'كبسولات سريعة', keywords: ['كبسولات', 'إسبريسو', 'دولتشي', 'coffee capsules', 'coffee pods', 'nespresso', 'dolce gusto', 'espresso pods'], imageUrl: subcatCoffeePodsImg },
      { id: 'cocoa-sahlab-hot-drinks', labelAr: 'كاكاو وسحلب ومشروبات ساخنة', labelEn: 'Cocoa, Sahlab & Hot Drinks', subCategoryKey: 'كاكاو وسحلب ومشروبات ساخنة', keywords: ['كاكاو', 'سحلب', 'ساخنة', 'cocoa', 'hot chocolate', 'sahlab', 'nesquik', 'hot drinks'], imageUrl: subcatAllCoffeeImg }
    ]
  },
  // 10 Confectionery & Chocolate
  {
    id: 'confectionery-chocolate',
    order: 10,
    categoryKey: 'حلويات وشوكولاتة',
    labelAr: 'حلويات وشوكولاتة',
    labelEn: 'Confectionery & Chocolate',
    imageUrl: catSugarSweetenersImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catSugarSweetenersImg },
      { id: 'chocolate', labelAr: 'شوكولاتة', labelEn: 'Chocolate', subCategoryKey: 'شوكولاتة', keywords: ['شوكولاتة', 'chocolate', 'milk chocolate', 'dark chocolate', 'galaxy', 'cadbury', 'milka'], imageUrl: catSugarSweetenersImg },
      { id: 'bars', labelAr: 'ألواح', labelEn: 'Bars', subCategoryKey: 'ألواح', keywords: ['ألواح', 'بار', 'chocolate bars', 'snickers', 'mars', 'twix', 'kitkat', 'bounty'], imageUrl: catSugarSweetenersImg },
      { id: 'candy', labelAr: 'سكاكر وحلوى', labelEn: 'Candy', subCategoryKey: 'سكاكر وحلوى', keywords: ['سكاكر', 'حلوى', 'ملبس', 'candy', 'sweets', 'hard candy', 'lollipops', 'bonbons'], imageUrl: catSugarSweetenersImg },
      { id: 'gum-mints', labelAr: 'علكة ونعناع', labelEn: 'Gum & Mints', subCategoryKey: 'علكة ونعناع', keywords: ['علكة', 'لبان', 'نعناع', 'gum', 'chewing gum', 'mints', 'mentos', 'trident', 'extra'], imageUrl: catSugarSweetenersImg },
      { id: 'jelly-marshmallow', labelAr: 'جيلي ومارشميلو', labelEn: 'Jelly & Marshmallow', subCategoryKey: 'جيلي ومارشميلو', keywords: ['جيلي', 'مارشميلو', 'jelly', 'gummies', 'marshmallow', 'haribo', 'soft candy'], imageUrl: catSugarSweetenersImg },
      { id: 'toffee-caramel', labelAr: 'توفي وكراميل', labelEn: 'Toffee & Caramel', subCategoryKey: 'توفي وكراميل', keywords: ['توفي', 'كراميل', 'toffee', 'caramel', 'butterscotch', 'chewy candy', 'eclairs'], imageUrl: catSugarSweetenersImg },
      { id: 'gift-boxes-bundles', labelAr: 'علب هدايا وحزم', labelEn: 'Gift Boxes & Bundles', subCategoryKey: 'علب هدايا وحزم', keywords: ['هدايا', 'علب', 'حزم', 'gift box', 'chocolate box', 'ferrero rocher', 'raffaello', 'assorted chocolates'], imageUrl: catSugarSweetenersImg }
    ]
  },
  // 11 Biscuits & Dry Bakery
  {
    id: 'biscuits-dry-bakery',
    order: 11,
    categoryKey: 'بسكويت ومخبوزات جافة',
    labelAr: 'بسكويت ومخبوزات جافة',
    labelEn: 'Biscuits & Dry Bakery',
    imageUrl: catPastaNoodlesImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catPastaNoodlesImg },
      { id: 'biscuits', labelAr: 'بسكويت', labelEn: 'Biscuits', subCategoryKey: 'بسكويت', keywords: ['بسكويت', 'biscuits', 'tea biscuits', 'digestive', 'ulker', 'oreo', 'mcvities'], imageUrl: catPastaNoodlesImg },
      { id: 'wafers', labelAr: 'ويفر', labelEn: 'Wafers', subCategoryKey: 'ويفر', keywords: ['ويفر', 'wafers', 'wafer biscuits', 'loacker', 'chocolate wafer', 'cream wafer'], imageUrl: catPastaNoodlesImg },
      { id: 'crackers', labelAr: 'كراكر', labelEn: 'Crackers', subCategoryKey: 'كراكر', keywords: ['كراكر', 'مقرمش', 'crackers', 'salted crackers', 'tuc', 'ritz', 'savory biscuits'], imageUrl: catPastaNoodlesImg },
      { id: 'packaged-cakes-croissants', labelAr: 'كيك وكرواسون مغلف', labelEn: 'Packaged Cakes & Croissants', subCategoryKey: 'كيك وكرواسون مغلف', keywords: ['كيك', 'كرواسون', 'packaged cakes', 'croissants', '7days', 'cupcake', 'swiss roll'], imageUrl: catSugarSweetenersImg },
      { id: 'packaged-cookies-maamoul', labelAr: 'كعك ومعمول مغلف', labelEn: 'Packaged Cookies & Maamoul', subCategoryKey: 'كعك ومعمول مغلف', keywords: ['كعك', 'معمول', 'كوكيز', 'cookies', 'maamoul', 'date cookies', 'butter cookies', 'kaak'], imageUrl: catSugarSweetenersImg },
      { id: 'toast-long-life-bread', labelAr: 'توست وخبز طويل الأجل', labelEn: 'Toast & Long-life Bread', subCategoryKey: 'توست وخبز طويل الأجل', keywords: ['توست', 'خبز', 'صمون', 'toast', 'rusk', 'bread', 'tortilla', 'long life bread'], imageUrl: catPastaNoodlesImg }
    ]
  },
  // 12 Snacks & Nuts
  {
    id: 'snacks-nuts',
    order: 12,
    categoryKey: 'سناكات ومكسرات',
    labelAr: 'سناكات ومكسرات',
    labelEn: 'Snacks & Nuts',
    imageUrl: catRiceGrainsImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catRiceGrainsImg },
      { id: 'chips', labelAr: 'شيبس', labelEn: 'Chips', subCategoryKey: 'شيبس', keywords: ['شيبس', 'جبس', 'chips', 'crisps', 'potato chips', 'lays', 'pringles', 'doritos'], imageUrl: catPastaNoodlesImg },
      { id: 'popcorn', labelAr: 'فشار', labelEn: 'Popcorn', subCategoryKey: 'فشار', keywords: ['فشار', 'شامية', 'popcorn', 'microwave popcorn', 'butter popcorn', 'corn snacks'], imageUrl: catRiceGrainsImg },
      { id: 'nuts', labelAr: 'مكسرات', labelEn: 'Nuts', subCategoryKey: 'مكسرات', keywords: ['مكسرات', 'فستق', 'لوز', 'كاجو', 'nuts', 'pistachios', 'almonds', 'cashews', 'peanuts', 'mixed nuts'], imageUrl: catRiceGrainsImg },
      { id: 'seeds', labelAr: 'بذور', labelEn: 'Seeds', subCategoryKey: 'بذور', keywords: ['بذور', 'بزر', 'حب', 'seeds', 'sunflower seeds', 'pumpkin seeds', 'roasted seeds', 'watermelon seeds'], imageUrl: catRiceGrainsImg },
      { id: 'dried-fruits-dates', labelAr: 'فواكه مجففة وتمور', labelEn: 'Dried Fruits & Dates', subCategoryKey: 'فواكه مجففة وتمور', keywords: ['تمور', 'تمر', 'زبيب', 'مجففة', 'dates', 'dried fruits', 'raisins', 'figs', 'apricots', 'iraqi dates'], imageUrl: catSugarSweetenersImg },
      { id: 'healthy-snacks-energy-bars', labelAr: 'سناك صحي وألواح الطاقة', labelEn: 'Healthy Snacks & Energy Bars', subCategoryKey: 'سناك صحي وألواح الطاقة', keywords: ['صحي', 'طاقة', 'بروتين', 'healthy snacks', 'energy bars', 'protein bars', 'granola bars', 'rice cakes'], imageUrl: catSugarSweetenersImg }
    ]
  },
  // 13 Breakfast & Spreads
  {
    id: 'breakfast-spreads',
    order: 13,
    categoryKey: 'الإفطار والمربى',
    labelAr: 'الإفطار والمربى',
    labelEn: 'Breakfast & Spreads',
    imageUrl: catSugarSweetenersImg,
    row: 1,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catSugarSweetenersImg },
      { id: 'breakfast-cereals', labelAr: 'حبوب الإفطار', labelEn: 'Breakfast Cereals', subCategoryKey: 'حبوب الإفطار', keywords: ['كورن فليكس', 'حبوب الإفطار', 'cereals', 'corn flakes', 'kelloggs', 'nesquik cereal', 'breakfast'], imageUrl: catRiceGrainsImg },
      { id: 'oats-granola-muesli', labelAr: 'شوفان وجرانولا وموسلي', labelEn: 'Oats, Granola & Muesli', subCategoryKey: 'شوفان وجرانولا وموسلي', keywords: ['شوفان', 'جرانولا', 'موسلي', 'oats', 'oatmeal', 'granola', 'muesli', 'quaker'], imageUrl: catRiceGrainsImg },
      { id: 'honey', labelAr: 'عسل', labelEn: 'Honey', subCategoryKey: 'عسل', keywords: ['عسل', 'honey', 'natural honey', 'sidr honey', 'al-shifa', 'langnese'], imageUrl: catSugarSweetenersImg },
      { id: 'jam', labelAr: 'مربى', labelEn: 'Jam', subCategoryKey: 'مربى', keywords: ['مربى', 'jam', 'marmalade', 'fruit spread', 'strawberry jam', 'apricot jam', 'hero jam'], imageUrl: catSugarSweetenersImg },
      { id: 'chocolate-nut-spreads', labelAr: 'معجون الشوكولاتة والمكسرات', labelEn: 'Chocolate & Nut Spreads', subCategoryKey: 'معجون الشوكولاتة والمكسرات', keywords: ['نوتيلا', 'شوكولاتة', 'زبدة فول', 'nutella', 'chocolate spread', 'peanut butter', 'hazelnut spread', 'lotus biscoff'], imageUrl: catSugarSweetenersImg },
      { id: 'tahini-halawa-molasses', labelAr: 'طحينة وحلاوة ودبس', labelEn: 'Tahini, Halawa & Molasses', subCategoryKey: 'طحينة وحلاوة ودبس', keywords: ['راشي', 'طحينة', 'حلاوة', 'دبس', 'tahini', 'halawa', 'halva', 'date syrup', 'molasses', 'rashi'], imageUrl: catSugarSweetenersImg }
    ]
  },
  // 14 Baby Products
  {
    id: 'baby-products',
    order: 14,
    categoryKey: 'منتجات الأطفال',
    labelAr: 'منتجات الأطفال',
    labelEn: 'Baby Products',
    imageUrl: catDairyCheeseImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catDairyCheeseImg },
      { id: 'infant-formula', labelAr: 'حليب أطفال', labelEn: 'Infant Formula', subCategoryKey: 'حليب أطفال', keywords: ['حليب أطفال', 'رضع', 'infant formula', 'baby milk', 'nan', 'aptamil', 's26', 'similac'], imageUrl: catDairyCheeseImg },
      { id: 'baby-food', labelAr: 'أغذية أطفال', labelEn: 'Baby Food', subCategoryKey: 'أغذية أطفال', keywords: ['أغذية أطفال', 'سيريلاك', 'baby food', 'cerelac', 'baby puree', 'gerber', 'baby jars'], imageUrl: catDairyCheeseImg },
      { id: 'baby-cereals', labelAr: 'حبوب أطفال', labelEn: 'Baby Cereals', subCategoryKey: 'حبوب أطفال', keywords: ['حبوب أطفال', 'baby cereals', 'infant cereal', 'wheat cereal', 'rice cereal'], imageUrl: catRiceGrainsImg },
      { id: 'baby-juices-snacks', labelAr: 'عصائر وسناك أطفال', labelEn: 'Baby Juices & Snacks', subCategoryKey: 'عصائر وسناك أطفال', keywords: ['عصائر أطفال', 'سناك أطفال', 'baby snacks', 'baby juice', 'baby biscuits', 'teething rusks'], imageUrl: catTeaDrinksImg },
      { id: 'diapers-essentials', labelAr: 'حفاضات ومستلزمات', labelEn: 'Diapers & Essentials', subCategoryKey: 'حفاضات ومستلزمات', keywords: ['حفاضات', 'بامبرز', 'diapers', 'pampers', 'huggies', 'molfix', 'baby care'], imageUrl: catCleaningCareImg }
    ]
  },
  // 15 Bakery & Pastry Supplies
  {
    id: 'bakery-pastry-supplies',
    order: 15,
    categoryKey: 'مواد المخابز والحلويات التجارية',
    labelAr: 'مواد المخابز والحلويات التجارية',
    labelEn: 'Bakery & Pastry Supplies',
    imageUrl: catPastaNoodlesImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catPastaNoodlesImg },
      { id: 'specialty-flour', labelAr: 'طحين متخصص', labelEn: 'Specialty Flour', subCategoryKey: 'طحين متخصص', keywords: ['طحين', 'دقيق', 'specialty flour', 'bread flour', 'pastry flour', 'cake flour', 'semolina'], imageUrl: catRiceGrainsImg },
      { id: 'yeast-improvers', labelAr: 'خميرة ومحسنات خبز', labelEn: 'Yeast & Improvers', subCategoryKey: 'خميرة ومحسنات خبز', keywords: ['خميرة', 'محسن', 'yeast', 'instant yeast', 'bread improver', 'saf-instant', 'dough conditioner'], imageUrl: catPastaNoodlesImg },
      { id: 'cake-dough-mixes', labelAr: 'خلطات كيك وعجين', labelEn: 'Cake & Dough Mixes', subCategoryKey: 'خلطات كيك وعجين', keywords: ['كيك', 'عجين', 'خلطة', 'cake mix', 'dough mix', 'sponge mix', 'pancake mix', 'waffle mix'], imageUrl: catPastaNoodlesImg },
      { id: 'baking-chocolate-cream', labelAr: 'شوكولاتة وكريمة تصنيع', labelEn: 'Baking Chocolate & Cream', subCategoryKey: 'شوكولاتة وكريمة تصنيع', keywords: ['شوكولاتة', 'كريمة', 'baking chocolate', 'couverture', 'chocolate chips', 'whipping cream', 'cocoa butter'], imageUrl: catDairyCheeseImg },
      { id: 'fillings-dessert-sauces', labelAr: 'حشوات وصلصات حلويات', labelEn: 'Fillings & Dessert Sauces', subCategoryKey: 'حشوات وصلصات حلويات', keywords: ['حشوات', 'صلصات حلويات', 'pastry fillings', 'dessert sauces', 'caramel topping', 'chocolate topping', 'fruit filling'], imageUrl: catSugarSweetenersImg },
      { id: 'decorations', labelAr: 'مواد تزيين', labelEn: 'Decorations', subCategoryKey: 'مواد تزيين', keywords: ['تزيين', 'cake decorations', 'sprinkles', 'fondant', 'food coloring', 'edible glaze'], imageUrl: catSugarSweetenersImg }
    ]
  },
  // 16 Foodservice & Commercial Kitchen
  {
    id: 'foodservice-commercial-kitchen',
    order: 16,
    categoryKey: 'مواد المطاعم والمطابخ التجارية',
    labelAr: 'مواد المطاعم والمطابخ التجارية',
    labelEn: 'Foodservice & Commercial Kitchen',
    imageUrl: catOilsGheeImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catOilsGheeImg },
      { id: 'bulk-sauces-seasonings', labelAr: 'عبوات صلصات وتوابل مهنية', labelEn: 'Bulk Sauces & Seasonings', subCategoryKey: 'عبوات صلصات وتوابل مهنية', keywords: ['صلصات', 'توابل', 'جالون', 'bulk sauces', 'horeca sauces', 'gallon ketchup', 'bulk spices', 'foodservice'], imageUrl: catCannedGoodsImg },
      { id: 'bulk-cooking-ingredients', labelAr: 'مواد طبخ بالجملة', labelEn: 'Bulk Cooking Ingredients', subCategoryKey: 'مواد طبخ بالجملة', keywords: ['طبخ', 'جملة', 'مطاعم', 'bulk ingredients', 'commercial cooking', 'restaurant supplies', 'wholesale food'], imageUrl: catOilsGheeImg },
      { id: 'gloves-caps-aprons', labelAr: 'قفازات وأغطية رأس ومرايل', labelEn: 'Gloves, Caps & Aprons', subCategoryKey: 'قفازات وأغطية رأس ومرايل', keywords: ['قفازات', 'أغطية', 'مرايل', 'gloves', 'nitrile gloves', 'hair nets', 'aprons', 'chef caps'], imageUrl: catCleaningCareImg },
      { id: 'professional-tissues', labelAr: 'مناديل ومنشفات مهنية', labelEn: 'Professional Tissues', subCategoryKey: 'مناديل ومنشفات مهنية', keywords: ['مناديل', 'منشفات', 'professional tissues', 'maxi roll', 'paper towels', 'dispenser napkins', 'horeca paper'], imageUrl: catCleaningCareImg },
      { id: 'kitchen-supplies', labelAr: 'مستلزمات المطابخ', labelEn: 'Kitchen Supplies', subCategoryKey: 'مستلزمات المطابخ', keywords: ['مطابخ', 'مستلزمات', 'kitchen supplies', 'commercial kitchen', 'foil rolls', 'cling film', 'kitchenware'], imageUrl: catCleaningCareImg }
    ]
  },
  // 17 Cleaning Products
  {
    id: 'cleaning-products',
    order: 17,
    categoryKey: 'منظفات',
    labelAr: 'منظفات',
    labelEn: 'Cleaning Products',
    imageUrl: catCleaningCareImg,
    row: 1,
    aliases: ['منظفات وعناية'],
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCleaningCareImg },
      { id: 'laundry', labelAr: 'منظفات الغسيل', labelEn: 'Laundry', subCategoryKey: 'منظفات الغسيل', keywords: ['غسيل', 'مسحوق', 'سائل', 'منعم', 'مبيض', 'تايد', 'laundry', 'detergent', 'washing powder', 'tide', 'ariel', 'persil', 'downy', 'clorox'], imageUrl: catCleaningCareImg },
      { id: 'dishwashing', labelAr: 'منظفات الأطباق', labelEn: 'Dishwashing', subCategoryKey: 'منظفات الأطباق', keywords: ['أطباق', 'صحون', 'فيري', 'زاهي', 'dishwashing', 'dish soap', 'fairy', 'pril', 'finish', 'dishwasher tablets'], imageUrl: catCleaningCareImg },
      { id: 'floor-surface-cleaners', labelAr: 'منظفات الأرضيات والأسطح', labelEn: 'Floor & Surface Cleaners', subCategoryKey: 'منظفات الأرضيات والأسطح', keywords: ['أرضيات', 'أسطح', 'floor cleaner', 'surface cleaner', 'multi purpose cleaner', 'dac', 'mr muscle'], imageUrl: catCleaningCareImg },
      { id: 'bathroom-kitchen-cleaners', labelAr: 'منظفات الحمامات والمطابخ', labelEn: 'Bathroom & Kitchen Cleaners', subCategoryKey: 'منظفات الحمامات والمطابخ', keywords: ['حمامات', 'مطابخ', 'دهون', 'bathroom cleaner', 'kitchen cleaner', 'degreaser', 'harpic', 'cif'], imageUrl: catCleaningCareImg },
      { id: 'glass-cleaners', labelAr: 'منظفات الزجاج', labelEn: 'Glass Cleaners', subCategoryKey: 'منظفات الزجاج', keywords: ['زجاج', 'ملمع', 'جيف', 'glass cleaner', 'window cleaner', 'windex', 'glass spray'], imageUrl: catCleaningCareImg },
      { id: 'disinfectants-sanitizers', labelAr: 'مطهرات ومعقمات', labelEn: 'Disinfectants & Sanitizers', subCategoryKey: 'مطهرات ومعقمات', keywords: ['مطهر', 'معقم', 'ديتول', 'صنوبر', 'disinfectant', 'sanitizer', 'dettol', 'antiseptic', 'bleach', 'pine cleaner'], imageUrl: catCleaningCareImg },
      { id: 'air-fresheners-insecticides', labelAr: 'معطرات الجو ومبيدات الحشرات', labelEn: 'Air Fresheners & Insecticides', subCategoryKey: 'معطرات الجو ومبيدات الحشرات', keywords: ['معطر', 'مبيد', 'حشرات', 'air freshener', 'insecticide', 'bug spray', 'glade', 'air wick', 'pif paf', 'raid'], imageUrl: catCleaningCareImg },
      { id: 'institutional-cleaners', labelAr: 'منظفات المؤسسات', labelEn: 'Institutional Cleaners', subCategoryKey: 'منظفات المؤسسات', keywords: ['مطاعم', 'فنادق', 'مؤسسات', 'institutional cleaners', 'bulk detergent', 'industrial cleaner', 'hotel cleaning'], imageUrl: catCleaningCareImg },
      { id: 'cleaning-tools', labelAr: 'أدوات التنظيف', labelEn: 'Cleaning Tools', subCategoryKey: 'أدوات التنظيف', keywords: ['إسفنج', 'ممسحة', 'أدوات', 'cleaning tools', 'sponges', 'mop', 'broom', 'scourer', 'scotch brite'], imageUrl: catCleaningCareImg }
    ]
  },
  // 18 Personal Care
  {
    id: 'personal-care',
    order: 18,
    categoryKey: 'عناية شخصية',
    labelAr: 'عناية شخصية',
    labelEn: 'Personal Care',
    imageUrl: catCleaningCareImg,
    row: 1,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCleaningCareImg },
      { id: 'hair-care', labelAr: 'شامبو وبلسم', labelEn: 'Hair Care', subCategoryKey: 'شامبو وبلسم', keywords: ['شامبو', 'بلسم', 'شعر', 'shampoo', 'conditioner', 'hair care', 'head and shoulders', 'pantene', 'sunsilk'], imageUrl: catCleaningCareImg },
      { id: 'bath-soap', labelAr: 'استحمام وصابون', labelEn: 'Bath & Soap', subCategoryKey: 'استحمام وصابون', keywords: ['صابون', 'شاور', 'استحمام', 'soap', 'body wash', 'shower gel', 'lux', 'dove', 'lifebuoy'], imageUrl: catCleaningCareImg },
      { id: 'oral-care', labelAr: 'العناية بالفم', labelEn: 'Oral Care', subCategoryKey: 'العناية بالفم', keywords: ['معجون أسنان', 'فرشاة', 'فم', 'toothpaste', 'toothbrush', 'oral care', 'colgate', 'signal', 'sensodyne'], imageUrl: catCleaningCareImg },
      { id: 'deodorants', labelAr: 'مزيلات العرق', labelEn: 'Deodorants', subCategoryKey: 'مزيلات العرق', keywords: ['مزيل عرق', 'ديودرنت', 'deodorant', 'antiperspirant', 'body spray', 'rexona', 'nivea', 'axe'], imageUrl: catCleaningCareImg },
      { id: 'shaving', labelAr: 'حلاقة', labelEn: 'Shaving', subCategoryKey: 'حلاقة', keywords: ['حلاقة', 'شفرات', 'shaving', 'razors', 'shaving foam', 'gillette', 'bic'], imageUrl: catCleaningCareImg },
      { id: 'skin-care', labelAr: 'العناية بالبشرة', labelEn: 'Skin Care', subCategoryKey: 'العناية بالبشرة', keywords: ['بشرة', 'كريم', 'لوشن', 'skin care', 'cream', 'lotion', 'moisturizer', 'vaseline', 'nivea cream'], imageUrl: catCleaningCareImg },
      { id: 'feminine-hygiene', labelAr: 'النظافة النسائية', labelEn: 'Feminine Hygiene', subCategoryKey: 'النظافة النسائية', keywords: ['نسائية', 'فوط', 'feminine hygiene', 'sanitary pads', 'always', 'kotex', 'panty liners'], imageUrl: catCleaningCareImg },
      { id: 'wet-wipes', labelAr: 'مناديل مبللة', labelEn: 'Wet Wipes', subCategoryKey: 'مناديل مبللة', keywords: ['مبللة', 'وايبس', 'wet wipes', 'baby wipes', 'cleansing wipes', 'pocket wipes'], imageUrl: catCleaningCareImg }
    ]
  },
  // 19 Paper Products
  {
    id: 'paper-products',
    order: 19,
    categoryKey: 'ورقيات',
    labelAr: 'ورقيات',
    labelEn: 'Paper Products',
    imageUrl: catCleaningCareImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCleaningCareImg },
      { id: 'toilet-paper', labelAr: 'ورق تواليت', labelEn: 'Toilet Paper', subCategoryKey: 'ورق تواليت', keywords: ['تواليت', 'رول', 'toilet paper', 'toilet roll', 'bathroom tissue', 'fine', 'sanita'], imageUrl: catCleaningCareImg },
      { id: 'facial-tissues', labelAr: 'مناديل وجه', labelEn: 'Facial Tissues', subCategoryKey: 'مناديل وجه', keywords: ['كلينكس', 'مناديل وجه', 'facial tissues', 'kleenex', 'tissue box', 'pocket tissues', 'fine tissues'], imageUrl: catCleaningCareImg },
      { id: 'kitchen-towels', labelAr: 'مناديل مطبخ', labelEn: 'Kitchen Towels', subCategoryKey: 'مناديل مطبخ', keywords: ['مناديل مطبخ', 'رول مطبخ', 'kitchen towels', 'paper towels', 'kitchen roll', 'maxi roll'], imageUrl: catCleaningCareImg },
      { id: 'napkins', labelAr: 'مناديل سفرة', labelEn: 'Napkins', subCategoryKey: 'مناديل سفرة', keywords: ['سفرة', 'مناديل', 'napkins', 'table napkins', 'dinner napkins', 'paper napkins'], imageUrl: catCleaningCareImg },
      { id: 'foil-wrap-baking-paper', labelAr: 'ورق ألمنيوم وتغليف وورق زبدة', labelEn: 'Foil, Wrap & Baking Paper', subCategoryKey: 'ورق ألمنيوم وتغليف وورق زبدة', keywords: ['سليفون', 'ألمنيوم', 'قصدير', 'ورق زبدة', 'aluminum foil', 'cling film', 'plastic wrap', 'baking paper', 'parchment paper'], imageUrl: catCleaningCareImg },
      { id: 'food-storage-bags', labelAr: 'أكياس حفظ الطعام', labelEn: 'Food Storage Bags', subCategoryKey: 'أكياس حفظ الطعام', keywords: ['أكياس حفظ', 'تفريز', 'food storage bags', 'freezer bags', 'ziplock', 'sandwich bags'], imageUrl: catCleaningCareImg }
    ]
  },
  // 20 Packaging & Disposables
  {
    id: 'packaging-disposables',
    order: 20,
    categoryKey: 'تعبئة وتغليف',
    labelAr: 'تعبئة وتغليف',
    labelEn: 'Packaging & Disposables',
    imageUrl: catCleaningCareImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCleaningCareImg },
      { id: 'shopping-bags', labelAr: 'أكياس تسوق', labelEn: 'Shopping Bags', subCategoryKey: 'أكياس تسوق', keywords: ['أكياس تسوق', 'علاكة', 'shopping bags', 'carrier bags', 'plastic bags', 'paper bags'], imageUrl: catCleaningCareImg },
      { id: 'trash-bags', labelAr: 'أكياس نفايات', labelEn: 'Trash Bags', subCategoryKey: 'أكياس نفايات', keywords: ['أكياس نفايات', 'trash bags', 'garbage bags', 'bin liners', 'heavy duty bags'], imageUrl: catCleaningCareImg },
      { id: 'food-containers', labelAr: 'علب طعام وحافظات', labelEn: 'Food Containers', subCategoryKey: 'علب طعام وحافظات', keywords: ['علب', 'حافظات', 'food containers', 'takeout boxes', 'plastic containers', 'foil trays'], imageUrl: catCannedGoodsImg },
      { id: 'cups-lids', labelAr: 'أكواب وأغطية', labelEn: 'Cups & Lids', subCategoryKey: 'أكواب وأغطية', keywords: ['أكواب', 'أغطية', 'cups', 'lids', 'paper cups', 'plastic cups', 'disposable cups'], imageUrl: catTeaDrinksImg },
      { id: 'plates', labelAr: 'أطباق', labelEn: 'Plates', subCategoryKey: 'أطباق', keywords: ['أطباق', 'صحون سفري', 'plates', 'disposable plates', 'paper plates', 'foam plates'], imageUrl: catCannedGoodsImg },
      { id: 'cutlery', labelAr: 'أدوات مائدة', labelEn: 'Cutlery', subCategoryKey: 'أدوات مائدة', keywords: ['ملاعق', 'شوك', 'سكاكين', 'cutlery', 'spoons', 'forks', 'knives', 'disposable cutlery'], imageUrl: catCleaningCareImg },
      { id: 'boxes-packing-materials', labelAr: 'كراتين ومواد تغليف', labelEn: 'Boxes & Packing Materials', subCategoryKey: 'كراتين ومواد تغليف', keywords: ['كراتين', 'تغليف', 'لاصق', 'boxes', 'cartons', 'packing tape', 'stretch film', 'packaging materials'], imageUrl: catCleaningCareImg }
    ]
  },
  // 21 Supermarket Supplies
  {
    id: 'supermarket-supplies',
    order: 21,
    categoryKey: 'مستلزمات السوبر ماركت',
    labelAr: 'مستلزمات السوبر ماركت',
    labelEn: 'Supermarket Supplies',
    imageUrl: catCleaningCareImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: catCleaningCareImg },
      { id: 'receipt-rolls-bags', labelAr: 'رول كاشير وأكياس', labelEn: 'Receipt Rolls & Bags', subCategoryKey: 'رول كاشير وأكياس', keywords: ['رول كاشير', 'ورق حراري', 'receipt rolls', 'thermal paper', 'pos rolls', 'cashier paper'], imageUrl: catCleaningCareImg },
      { id: 'price-tags-barcode-labels', labelAr: 'بطاقات أسعار وملصقات باركود', labelEn: 'Price Tags & Barcode Labels', subCategoryKey: 'بطاقات أسعار وملصقات باركود', keywords: ['باركود', 'أسعار', 'ملصقات', 'price tags', 'barcode labels', 'price gun', 'stickers', 'shelf labels'], imageUrl: catCleaningCareImg },
      { id: 'baskets-trolleys', labelAr: 'سلال وعربات', labelEn: 'Baskets & Trolleys', subCategoryKey: 'سلال وعربات', keywords: ['سلال', 'عربات', 'shopping baskets', 'trolleys', 'shopping carts', 'supermarket baskets'], imageUrl: catCleaningCareImg },
      { id: 'shelving-display', labelAr: 'رفوف وحوامل عرض', labelEn: 'Shelving & Display', subCategoryKey: 'رفوف وحوامل عرض', keywords: ['رفوف', 'عرض', 'shelving', 'display stands', 'gondola racks', 'store shelves'], imageUrl: catCleaningCareImg },
      { id: 'shelf-organization', labelAr: 'أدوات تنظيم الرفوف', labelEn: 'Shelf Organization', subCategoryKey: 'أدوات تنظيم الرفوف', keywords: ['تنظيم', 'رفوف', 'shelf dividers', 'shelf pushers', 'shelf organization', 'retail organizers'], imageUrl: catCleaningCareImg },
      { id: 'cashier-supplies', labelAr: 'مستلزمات الكاشير', labelEn: 'Cashier Supplies', subCategoryKey: 'مستلزمات الكاشير', keywords: ['كاشير', 'cashier supplies', 'pos supplies', 'cash drawer', 'checkout supplies'], imageUrl: catCleaningCareImg }
    ]
  },
  // 22 Café & Restaurant Supplies
  {
    id: 'cafe-restaurant-supplies',
    order: 22,
    categoryKey: 'مستلزمات المقاهي والمطاعم',
    labelAr: 'مستلزمات المقاهي والمطاعم',
    labelEn: 'Café & Restaurant Supplies',
    imageUrl: subcatAllCoffeeImg,
    row: 2,
    branches: [
      { id: 'all', labelAr: 'جميع الفروع', labelEn: 'All Branches', imageUrl: subcatAllCoffeeImg },
      { id: 'takeaway-cups-lids', labelAr: 'أكواب وأغطية Takeaway', labelEn: 'Takeaway Cups & Lids', subCategoryKey: 'أكواب وأغطية Takeaway', keywords: ['أكواب', 'أغطية', 'takeaway', 'coffee cups', 'cup lids', 'double wall cups', 'cup sleeves'], imageUrl: subcatAllCoffeeImg },
      { id: 'straws-stirrers', labelAr: 'شفاطات وعيدان تحريك', labelEn: 'Straws & Stirrers', subCategoryKey: 'شفاطات وعيدان تحريك', keywords: ['شفاطات', 'عيدان', 'تحريك', 'straws', 'stirrers', 'wooden stirrers', 'paper straws', 'cafe sticks'], imageUrl: subcatAllCoffeeImg },
      { id: 'cafe-sugar-creamers-sweeteners', labelAr: 'سكر وكريمة ومحليات للمقاهي', labelEn: 'Café Sugar, Creamers & Sweeteners', subCategoryKey: 'سكر وكريمة ومحليات للمقاهي', keywords: ['أصابع سكر', 'كريمة', 'مبيض', 'sugar sticks', 'coffee creamer', 'coffee mate', 'sweetener sachets', 'cafe sugar'], imageUrl: catSugarSweetenersImg },
      { id: 'takeaway-packaging', labelAr: 'عبوات Takeaway', labelEn: 'Takeaway Packaging', subCategoryKey: 'عبوات Takeaway', keywords: ['عبوات', 'سفري', 'takeaway', 'takeaway boxes', 'kraft boxes', 'burger boxes', 'pizza boxes', 'delivery packaging'], imageUrl: catCannedGoodsImg },
      { id: 'serving-supplies', labelAr: 'مستلزمات التقديم', labelEn: 'Serving Supplies', subCategoryKey: 'مستلزمات التقديم', keywords: ['تقديم', 'صواني', 'serving trays', 'cup carriers', 'tableware', 'cafe serving', 'coasters'], imageUrl: subcatAllCoffeeImg }
    ]
  }
];

/**
 * Lookup map of branches by categoryKey (supports all 22 new departments AND all 9 legacy alias keys).
 */
export const CATEGORY_BRANCHES_MAP: Record<string, CategoryBranchItem[]> = (() => {
  const map: Record<string, CategoryBranchItem[]> = {};
  for (const dept of GROCERY_DEPARTMENTS) {
    map[dept.categoryKey] = dept.branches;
    if (dept.aliases) {
      for (const alias of dept.aliases) {
        map[alias] = dept.branches;
      }
    }
  }
  return map;
})();

/**
 * Case-insensitive bilingual (Arabic & English) search across all 22 departments and 153 branches.
 * Matches labelAr, labelEn, aliases, subCategoryKey, and keywords.
 */
export interface CategorySearchMatch {
  department: GroceryDepartment;
  matchedBranches: CategoryBranchItem[];
  matchedDepartmentDirect: boolean;
}

export function searchCategoriesAndBranches(query: string): CategorySearchMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches: CategorySearchMatch[] = [];
  for (const dept of GROCERY_DEPARTMENTS) {
    const deptMatch =
      dept.labelAr.toLowerCase().includes(q) ||
      dept.labelEn.toLowerCase().includes(q) ||
      dept.categoryKey.toLowerCase().includes(q) ||
      (dept.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false);

    const matchedBranches = dept.branches.filter((b) => {
      if (b.id === 'all') return false;
      return (
        b.labelAr.toLowerCase().includes(q) ||
        b.labelEn.toLowerCase().includes(q) ||
        (b.subCategoryKey?.toLowerCase().includes(q) ?? false) ||
        (b.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false)
      );
    });

    if (deptMatch || matchedBranches.length > 0) {
      matches.push({
        department: dept,
        matchedBranches,
        matchedDepartmentDirect: deptMatch
      });
    }
  }
  return matches;
}

/**
 * Checks whether a product's department or sub-category matches a bilingual search query
 * via labelAr, labelEn, aliases, or branch keywords (case-insensitive).
 */
export function matchesProductCategoryKeywords(
  category: string,
  subCategory: string | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  const canonical = resolveCategoryKey(category);
  const dept = GROCERY_DEPARTMENTS.find((d) => d.categoryKey === canonical);
  if (!dept) return false;

  if (
    dept.labelAr.toLowerCase().includes(q) ||
    dept.labelEn.toLowerCase().includes(q) ||
    (dept.aliases?.some((a) => a.toLowerCase().includes(q)) ?? false)
  ) {
    return true;
  }

  if (subCategory) {
    const branch = dept.branches.find(
      (b) => b.id !== 'all' && b.subCategoryKey === subCategory
    );
    if (branch) {
      return (
        branch.labelAr.toLowerCase().includes(q) ||
        branch.labelEn.toLowerCase().includes(q) ||
        (branch.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false)
      );
    }
  }

  return false;
}

export { subcatInstantCoffeeImg };
