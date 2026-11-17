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

export const CATEGORY_BRANCHES_MAP: Record<string, CategoryBranchItem[]> = {
  'قهوة ومشروبات ساخنة': [
    {
      id: 'all',
      labelAr: 'جميع الفروع',
      labelEn: 'All Branches',
      imageUrl: subcatAllCoffeeImg
    },
    {
      id: 'drip',
      labelAr: 'القهوة المقطرة',
      labelEn: 'Drip Coffee',
      subCategoryKey: 'القهوة المقطرة',
      imageUrl: subcatDripCoffeeImg
    },
    {
      id: 'arabica',
      labelAr: 'أرابيكا 100%',
      labelEn: 'Arabica 100%',
      subCategoryKey: 'أرابيكا',
      imageUrl: subcatArabicaBeansImg
    },
    {
      id: 'whole_beans',
      labelAr: 'حبوب كاملة',
      labelEn: 'Whole Beans',
      subCategoryKey: 'حبوب كاملة',
      imageUrl: subcatArabicaBeansImg
    },
    {
      id: 'pods',
      labelAr: 'كبسولات سريعة',
      labelEn: 'Coffee Capsules',
      subCategoryKey: 'كبسولات سريعة',
      imageUrl: subcatCoffeePodsImg
    },
    {
      id: 'instant',
      labelAr: 'سريعة التحضير',
      labelEn: 'Instant Coffee',
      subCategoryKey: 'سريعة التحضير',
      imageUrl: subcatInstantCoffeeImg
    }
  ],
  'أرز وحبوب': [
    {
      id: 'all',
      labelAr: 'جميع الحبوب',
      labelEn: 'All Grains',
      imageUrl: catRiceGrainsImg
    },
    {
      id: 'basmati',
      labelAr: 'أرز بسمتي وعنبر',
      labelEn: 'Basmati & Amber',
      keywords: ['أرز', 'بسمتي', 'عنبر'],
      imageUrl: catRiceGrainsImg
    },
    {
      id: 'lentils',
      labelAr: 'عدس وبقوليات',
      labelEn: 'Lentils & Pulses',
      keywords: ['عدس', 'حمص', 'فاصوليا', 'حبوب'],
      imageUrl: catCannedGoodsImg
    },
    {
      id: 'bulgur',
      labelAr: 'برغل وحنطة',
      labelEn: 'Bulgur & Wheat',
      keywords: ['برغل', 'قمح', 'شوال'],
      imageUrl: catPastaNoodlesImg
    }
  ],
  'زيوت وسمن': [
    {
      id: 'all',
      labelAr: 'جميع الزيوت',
      labelEn: 'All Oils & Ghee',
      imageUrl: catOilsGheeImg
    },
    {
      id: 'sunflower',
      labelAr: 'زيت دوار الشمس',
      labelEn: 'Sunflower Oil',
      keywords: ['دوار', 'نباتي', 'عافية'],
      imageUrl: catOilsGheeImg
    },
    {
      id: 'olive',
      labelAr: 'زيت الزيتون',
      labelEn: 'Olive Oil',
      keywords: ['زيتون'],
      imageUrl: catOilsGheeImg
    },
    {
      id: 'ghee',
      labelAr: 'سمن الطبخ',
      labelEn: 'Cooking Ghee',
      keywords: ['سمن', 'دهن'],
      imageUrl: catDairyCheeseImg
    }
  ],
  'ألبان وأجبان': [
    {
      id: 'all',
      labelAr: 'جميع الألبان',
      labelEn: 'All Dairy',
      imageUrl: catDairyCheeseImg
    },
    {
      id: 'milk_powder',
      labelAr: 'حليب بودرة وسائـل',
      labelEn: 'Milk & Powder',
      keywords: ['حليب', 'بودرة'],
      imageUrl: catDairyCheeseImg
    },
    {
      id: 'cheese_butter',
      labelAr: 'أجبان وزبدة',
      labelEn: 'Cheese & Butter',
      keywords: ['جبن', 'زبدة'],
      imageUrl: catDairyCheeseImg
    },
    {
      id: 'cream_yogurt',
      labelAr: 'قشطة وألبان طازجة',
      labelEn: 'Cream & Yogurt',
      keywords: ['قشطة', 'لبن'],
      imageUrl: catDairyCheeseImg
    },
    {
      id: 'condensed_milk',
      labelAr: 'حليب مكثف ومبخر',
      labelEn: 'Condensed Milk',
      keywords: ['مكثف', 'مبخر'],
      imageUrl: catDairyCheeseImg
    }
  ],
  'معلبات ومخللات': [
    {
      id: 'all',
      labelAr: 'جميع المعلبات',
      labelEn: 'All Canned',
      imageUrl: catCannedGoodsImg
    },
    {
      id: 'tomato_paste',
      labelAr: 'معجون وصلصات',
      labelEn: 'Tomato Paste',
      keywords: ['معجون', 'طماطم'],
      imageUrl: catCannedGoodsImg
    },
    {
      id: 'tuna',
      labelAr: 'تونة وأسماك',
      labelEn: 'Tuna & Seafood',
      keywords: ['تونة', 'سمك'],
      imageUrl: catCannedGoodsImg
    },
    {
      id: 'beans_canned',
      labelAr: 'فول وبقوليات معلبة',
      labelEn: 'Canned Beans',
      keywords: ['فول', 'حمص', 'فاصوليا'],
      imageUrl: catCannedGoodsImg
    },
    {
      id: 'pickles_olives',
      labelAr: 'مخللات وزيتون',
      labelEn: 'Pickles & Olives',
      keywords: ['مخلل', 'زيتون'],
      imageUrl: catCannedGoodsImg
    }
  ],
  'سكر ومحليات': [
    {
      id: 'all',
      labelAr: 'جميع المحليات',
      labelEn: 'All Sweeteners',
      imageUrl: catSugarSweetenersImg
    },
    {
      id: 'white_sugar',
      labelAr: 'سكر أبيض وأكياس',
      labelEn: 'Refined Sugar',
      keywords: ['سكر'],
      imageUrl: catSugarSweetenersImg
    },
    {
      id: 'honey',
      labelAr: 'عسل طبيعي',
      labelEn: 'Natural Honey',
      keywords: ['عسل'],
      imageUrl: catSugarSweetenersImg
    },
    {
      id: 'brown_sugar',
      labelAr: 'سكر بني ودايت',
      labelEn: 'Brown & Diet Sugar',
      keywords: ['بني', 'دايت'],
      imageUrl: catSugarSweetenersImg
    },
    {
      id: 'syrups',
      labelAr: 'دبس وشراب محلي',
      labelEn: 'Syrups & Molasses',
      keywords: ['دبس', 'شراب'],
      imageUrl: catSugarSweetenersImg
    }
  ],
  'مشروبات وشاي': [
    {
      id: 'all',
      labelAr: 'جميع المشروبات',
      labelEn: 'All Beverages',
      imageUrl: catTeaDrinksImg
    },
    {
      id: 'ceylon_tea',
      labelAr: 'شاي سيلاني وأسود',
      labelEn: 'Ceylon Black Tea',
      keywords: ['شاي', 'سيلاني'],
      imageUrl: catTeaDrinksImg
    },
    {
      id: 'juices',
      labelAr: 'عصائر ومشروبات',
      labelEn: 'Juices & Drinks',
      keywords: ['عصير', 'مشروب'],
      imageUrl: catTeaDrinksImg
    },
    {
      id: 'green_herbal',
      labelAr: 'شاي أخضر وأعشاب',
      labelEn: 'Green & Herbal Tea',
      keywords: ['أخضر', 'أعشاب'],
      imageUrl: catTeaDrinksImg
    },
    {
      id: 'water_soft',
      labelAr: 'مياه ومشروبات غازية',
      labelEn: 'Water & Soft Drinks',
      keywords: ['مياه', 'غازية'],
      imageUrl: catTeaDrinksImg
    }
  ],
  'مكرونة وشعرية': [
    {
      id: 'all',
      labelAr: 'جميع المعكرونة',
      labelEn: 'All Pasta',
      imageUrl: catPastaNoodlesImg
    },
    {
      id: 'spaghetti',
      labelAr: 'سباغيتي وباستا',
      labelEn: 'Spaghetti & Penne',
      keywords: ['معكرونة', 'سباغيتي'],
      imageUrl: catPastaNoodlesImg
    },
    {
      id: 'vermicelli',
      labelAr: 'شعرية ونودلز',
      labelEn: 'Vermicelli & Noodles',
      keywords: ['شعرية', 'نودلز'],
      imageUrl: catPastaNoodlesImg
    },
    {
      id: 'lasagna',
      labelAr: 'لازانيا ومعكرونة سريعة',
      labelEn: 'Lasagna & Quick Pasta',
      keywords: ['لازانيا', 'سريعة'],
      imageUrl: catPastaNoodlesImg
    },
    {
      id: 'bulgur_semolina',
      labelAr: 'سميد ودقيق الباستا',
      labelEn: 'Semolina & Flour',
      keywords: ['سميد', 'دقيق'],
      imageUrl: catPastaNoodlesImg
    }
  ],
  'منظفات وعناية': [
    {
      id: 'all',
      labelAr: 'جميع المنظفات',
      labelEn: 'All Cleaning',
      imageUrl: catCleaningCareImg
    },
    {
      id: 'dish_liquid',
      labelAr: 'المنظفات السائلة',
      labelEn: 'Liquid Detergents',
      keywords: ['منظف', 'سائل', 'أطباق'],
      imageUrl: catCleaningCareImg
    },
    {
      id: 'disinfectants',
      labelAr: 'المعقمات والمطهرات',
      labelEn: 'Disinfectants',
      keywords: ['معقم', 'مطهر', 'صنوبر'],
      imageUrl: catCleaningCareImg
    },
    {
      id: 'laundry',
      labelAr: 'منظفات الغسيل',
      labelEn: 'Laundry Care',
      keywords: ['غسيل', 'ملابس', 'أتوماتيك'],
      imageUrl: catCleaningCareImg
    },
    {
      id: 'glass_surface',
      labelAr: 'ملمعات الزجاج والأسطح',
      labelEn: 'Glass & Surfaces',
      keywords: ['زجاج', 'أسطح', 'بخاخ'],
      imageUrl: catCleaningCareImg
    }
  ]
};

export { subcatInstantCoffeeImg };
