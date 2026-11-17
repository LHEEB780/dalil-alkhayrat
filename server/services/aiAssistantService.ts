import { GoogleGenAI } from '@google/genai';
import { db } from '../db/store.ts';

// Server-side Gemini client initialized lazily when GEMINI_API_KEY is present

export async function askStoreAssistant(params: {
  storeId: string;
  question: string;
}): Promise<{ answer: string; calculatedStats: Record<string, unknown> }> {
  const store = db.stores.find(s => s.id === params.storeId) || db.stores[0];
  const creditAccounts = db.getStoreCreditAccounts(store.id);
  const inventory = db.storeInventory.filter(s => s.storeId === store.id);
  const subOrders = db.subOrders.filter(o => o.storeId === store.id);

  // 1. DETERMINISTIC DATABASE CALCULATIONS (AI NEVER guesses figures)
  const totalOutstandingDebtIQD = creditAccounts.reduce((sum, c) => sum + c.currentUsedCreditIQD, 0);
  const totalCreditLimitIQD = creditAccounts.reduce((sum, c) => sum + c.creditLimitIQD, 0);
  const totalAvailableCreditIQD = creditAccounts.reduce((sum, c) => sum + c.availableCreditIQD, 0);
  
  const totalOverdueDebtIQD = creditAccounts.reduce(
    (sum, c) => sum + c.aging.bucket31_60 + c.aging.bucket61_90 + c.aging.bucket90Plus,
    0
  );

  const blockedAccounts = creditAccounts.filter(c => c.isBlocked).map(c => ({
    supplierName: db.suppliers.find(s => s.id === c.supplierId)?.companyName || c.supplierId,
    reason: c.blockReason,
    usedCreditIQD: c.currentUsedCreditIQD
  }));

  const lowStockItems = inventory.filter(i => i.isLowStock).map(i => ({
    name: i.productName,
    currentStock: i.stockQuantity,
    reorderLevel: i.reorderLevel,
    unit: i.unit,
    costPriceIQD: i.costPriceIQD
  }));

  const nearExpiryItems = inventory.filter(i => i.isNearExpiry).map(i => ({
    name: i.productName,
    stock: i.stockQuantity,
    unit: i.unit,
    expiryDate: i.expiryDate,
    capitalAtRiskIQD: i.stockQuantity * i.costPriceIQD
  }));

  const totalSpentThisMonthIQD = subOrders.reduce((sum, o) => sum + o.subtotalIQD, 0);
  const pendingOrdersCount = subOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const calculatedStats = {
    storeName: store.name,
    city: store.city,
    totalSpentThisMonthIQD,
    totalOutstandingDebtIQD,
    totalCreditLimitIQD,
    totalAvailableCreditIQD,
    totalOverdueDebtIQD,
    blockedAccountsCount: blockedAccounts.length,
    blockedAccounts,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    nearExpiryCount: nearExpiryItems.length,
    nearExpiryItems,
    pendingOrdersCount
  };

  // 2. Pass database-calculated figures to Gemini 3.8 Flash for explanation and actionable advice
  const systemInstruction = `
أنت المساعد المالي والتشغيلي الذكي لمتجر "${store.name}" في منصة "سوق الجملة" (B2B) في العراق.
القاعدة الصارمة: جميع الأرقام المالية والمخزنية تم حسابها مسبقاً بدقة بواسطة قاعدة البيانات ومرفقة أدناه.
مهمتك:
1. الإجابة باللغة العربية بأسلوب عراقي مهني ومباشر وودود.
2. عدم اختراع أو تخمين أي مبالغ أو تواريخ؛ اعتمد حصرياً على البيانات المحسوبة المرفقة.
3. تقديم نصائح تجارية عملية (مثلاً: تنبيه بالبضائع التي اقترب انتهاء صلاحيتها وتخفيض سعرها، أو تسديد الموردين المحظورين لفتح خط الائتمان، أو الأصناف التي نفدت).
4. استخدم تنسيق نقاط واضحة ومختصرة مناسبة لشاشة الهاتف المحمول.
`;

  const contextData = JSON.stringify(calculatedStats, null, 2);
  const prompt = `
بيانات المتجر المالية والمخزنية الموثقة:
${contextData}

سؤال تاجر التجزئة صاحب المتجر:
"${params.question}"

قدم إجابة دقيقة ونصائح عملية مستندة حصراً إلى الأرقام أعلاه.
`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction
        }
      });

      return {
        answer: response.text || 'عذراً، لم أتمكن من استخراج الإجابة. يرجى مراجعة المؤشرات المالية أدناه.',
        calculatedStats
      };
    }
  } catch (err) {
    console.warn('Gemini API call warning, falling back to rule-based explanation:', err);
  }

  // Graceful rule-based response if API key is not configured yet
  let fallbackAnswer = `أهلاً بك في متجر ${store.name}!\n\n`;
  if (params.question.includes('صرف') || params.question.includes('مشتريات') || params.question.includes('شكد') || params.question.includes('شهر')) {
    fallbackAnswer += `📊 **إجمالي مشترياتك هذا الشهر:** ${totalSpentThisMonthIQD.toLocaleString()} دينار عراقي عبر ${subOrders.length} طلبات.\n`;
    fallbackAnswer += `💳 **الديون الآجلة المستحقة عليك للموردين:** ${totalOutstandingDebtIQD.toLocaleString()} د.ع من أصل سقف ائتماني ${totalCreditLimitIQD.toLocaleString()} د.ع.\n`;
    if (blockedAccounts.length > 0) {
      fallbackAnswer += `⚠️ **تنبيه:** لديك حساب موقوف لدى (${blockedAccounts[0].supplierName}) بسبب: ${blockedAccounts[0].reason}.\n`;
    }
  } else if (params.question.includes('صلاحية') || params.question.includes('ينتهي') || params.question.includes('تاريخ')) {
    fallbackAnswer += `⏳ **المواد القريبة من انتهاء الصلاحية:**\n`;
    if (nearExpiryItems.length === 0) {
      fallbackAnswer += `✅ لا توجد أصناف قريبة من الانتهاء حالياً. مخزونك سليم.\n`;
    } else {
      nearExpiryItems.forEach(item => {
        fallbackAnswer += `• ${item.name} (${item.stock} ${item.unit}) - تنتهي في ${item.expiryDate} (قيمة رأس المال المعرض للخطر: ${item.capitalAtRiskIQD.toLocaleString()} د.ع).\nنصيحة: اعرضها في قسم تصريف المخزون أو بخصم في المتجر!\n`;
      });
    }
  } else {
    fallbackAnswer += `📌 **الملخص المالي والمخزني لمتجرك:**\n`;
    fallbackAnswer += `• مشتريات الشهر: ${totalSpentThisMonthIQD.toLocaleString()} د.ع\n`;
    fallbackAnswer += `• الائتمان المستخدم: ${totalOutstandingDebtIQD.toLocaleString()} د.ع (المتاح: ${totalAvailableCreditIQD.toLocaleString()} د.ع)\n`;
    fallbackAnswer += `• الأصناف منخفضة المخزون: ${lowStockItems.length} صنف تحتاج لإعادة طلب.\n`;
    fallbackAnswer += `• الأصناف قريبة الانتهاء: ${nearExpiryItems.length} صنف.\n`;
  }

  return {
    answer: fallbackAnswer,
    calculatedStats
  };
}
