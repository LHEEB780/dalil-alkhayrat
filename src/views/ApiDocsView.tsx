import React, { useState, useEffect } from 'react';
import { FileCode2, Play, Copy, Check, ExternalLink, Code2, Server } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [apiSpec, setApiSpec] = useState<any>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/products');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/openapi.json')
      .then(res => res.json())
      .then(data => setApiSpec(data));
  }, []);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/products',
      summary: 'الكتالوج الموحد ومقارنة أسعار الموردين حسب الباركود (EAN / GTIN)',
      sampleQuery: '?category=أرز وحبوب'
    },
    {
      method: 'POST',
      path: '/api/orders',
      summary: 'تقسيم سلة الشراء تلقائياً إلى طلبات فرعية لكل مورد مع فحص الائتمان',
      sampleBody: {
        storeId: 'store_almansoor',
        items: [{ offerId: 'off_rice_rafidain', barcode: '6281007000123', quantity: 5 }],
        paymentMethod: 'credit'
      }
    },
    {
      method: 'GET',
      path: '/api/credit/accounts',
      summary: 'استعلام حسابات الائتمان وتقسيم أعمار الديون (Aging 0-30, 31-60, 61-90, 90+)',
      sampleQuery: '?storeId=store_almansoor'
    },
    {
      method: 'POST',
      path: '/api/credit/ledger/payment',
      summary: 'تسجيل سند قبض وسداد في دفتر الأستاذ وتطبيق الدفعة على أقدم فاتورة (FIFO)',
      sampleBody: {
        creditAccountId: 'cred_almansoor_rafidain',
        amountIQD: 500000,
        receiptNumber: 'REC-9941'
      }
    },
    {
      method: 'POST',
      path: '/api/credit/ledger/reversal',
      summary: 'تسجيل قيد عكسي لتصحيح قيود دفتر الأستاذ دون مسح السجل التاريخي',
      sampleBody: {
        entryId: 'led_3',
        reason: 'تصحيح خطأ محاسبي في كمية المواد المستلمة'
      }
    },
    {
      method: 'GET',
      path: '/api/van/inventory/drv_ahmed_baghdad',
      summary: 'استعلام مخزون سيارة التوزيع (مستودع الفان المتنقل)',
      sampleQuery: ''
    },
    {
      method: 'POST',
      path: '/api/van/direct-sale',
      summary: 'البيع الفوري المباشر من سيارة التوزيع لمتجر تجزئة',
      sampleBody: {
        driverId: 'drv_ahmed_baghdad',
        storeId: 'store_almansoor',
        barcode: '6281007000123',
        quantity: 2,
        paymentType: 'cash'
      }
    },
    {
      method: 'POST',
      path: '/api/assistant/ask',
      summary: 'المساعد المالي والتشغيلي (Gemini 3.8 Flash + Database Metrics)',
      sampleBody: {
        storeId: 'store_almansoor',
        question: 'كم صرفت على مشتريات الجملة هذا الشهر وما هو سقف الائتمان المتبقي؟'
      }
    }
  ];

  const handleTestEndpoint = async (ep: typeof endpoints[0]) => {
    setTesting(true);
    setTestResult(null);

    try {
      const url = ep.path + (ep.sampleQuery || '');
      const options: RequestInit = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (ep.method === 'POST' && ep.sampleBody) {
        options.body = JSON.stringify(ep.sampleBody);
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setTestResult({
        status: res.status,
        ok: res.ok,
        data
      });
    } catch (err: any) {
      setTestResult({
        status: 'Error',
        ok: false,
        data: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySpec = () => {
    if (!apiSpec) return;
    navigator.clipboard.writeText(JSON.stringify(apiSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* OpenAPI Header */}
      <div className="bg-[#1F2328] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-600 text-white px-2.5 py-0.5 rounded-md font-bold">
              OpenAPI 3.0.3
            </span>
            <span className="text-xs text-gray-400">جاهز للتكامل مع تطبيقات Android & iOS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2">
            واجهة برمجة التطبيقات لمنصة سوق الجملة (REST API)
          </h1>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            تم عزل المنطق المالي والمخزني بالكامل في طبقة الخدمات الخلفية (Backend Service Layer) لتسمح لتطبيق الموبايل بالعمل مباشرة دون تكرار أي كود محاسبي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySpec}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-medium transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ JSON' : 'نسخ مواصفة OpenAPI'}</span>
          </button>
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-xs font-bold transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>عرض JSON الخام</span>
          </a>
        </div>
      </div>

      {/* Endpoints Explorer and Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Endpoints Menu */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-bold text-xs text-[#6B7280] mb-2">قائمة المسارات (Endpoints):</h3>
          
          {endpoints.map((ep, idx) => {
            const isSelected = activeEndpoint === ep.path;
            const methodColor = ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800';

            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveEndpoint(ep.path);
                  handleTestEndpoint(ep);
                }}
                className={`p-3 rounded-xl border text-right cursor-pointer transition ${
                  isSelected
                    ? 'border-[#00A046] bg-white shadow-xs ring-1 ring-[#00A046]'
                    : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${methodColor}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1F2328]">{ep.path}</span>
                </div>
                <p className="text-[11px] text-[#6B7280] line-clamp-1">{ep.summary}</p>
              </div>
            );
          })}
        </div>

        {/* Live Interactive Request & Response Viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <span className="text-xs text-[#6B7280]">المسار النشط:</span>
              <div className="font-mono font-bold text-sm text-[#1F2328]">{activeEndpoint}</div>
            </div>

            <button
              onClick={() => {
                const ep = endpoints.find(e => e.path === activeEndpoint);
                if (ep) handleTestEndpoint(ep);
              }}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00A046] text-white rounded-lg text-xs font-bold hover:bg-[#008a3c] transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{testing ? 'جاري التنفيذ...' : 'اختبار الطلب المباشر'}</span>
            </button>
          </div>

          {/* Test Response Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>استجابة الخادم الحقيقية (Response JSON):</span>
              {testResult && (
                <span className={`font-mono font-bold ${testResult.ok ? 'text-[#15803D]' : 'text-red-600'}`}>
                  HTTP Status: {testResult.status}
                </span>
              )}
            </div>

            <pre className="bg-[#1F2328] text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed" dir="ltr">
              {testing ? '// Executing API call on live Express server...' : testResult ? JSON.stringify(testResult.data, null, 2) : '// اضغط على "اختبار الطلب المباشر" لفحص الرد الفعلي من الخادم'}
            </pre>
          </div>

          <div className="bg-[#F7F8FA] p-3 rounded-lg text-xs text-[#6B7280]">
            💡 ملاحظة لتطوير تطبيق Android: استجابات API مصممة بنمط RESTful معرمزة كـ JSON موحد، وتحتوي الحقول المالية على دقة كاملة بالأرقام الصحيحة لتفادي مشاكل الفواصل العشرية في العملات.
          </div>
        </div>

      </div>

    </div>
  );
};
