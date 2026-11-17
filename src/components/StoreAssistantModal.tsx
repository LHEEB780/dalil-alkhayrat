import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Currency, Language } from '../types/index.ts';

interface StoreAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  language?: Language;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  stats?: any;
  timestamp: string;
}

export const StoreAssistantModal: React.FC<StoreAssistantModalProps> = ({
  isOpen,
  onClose,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: isAr
        ? 'أهلاً بك يا عمار! أنا المستشار المالي والتشغيلي لمتجرك (سوبرماركت المنصور المركزي). جميع الحسابات والمؤشرات المالية تُحسب مباشرة من قاعدة البيانات. كيف أساعدك اليوم في إدارة أرباحك ومخزونك؟'
        : 'Welcome Ammar! I am the AI Financial & Operational Advisor for your store (Al-Mansoor Central Supermarket). All calculations are queried directly from the database. How can I assist you with your finances and stock today?',
      timestamp: isAr ? 'الآن' : 'Now'
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = isAr ? [
    'شكد صرفت على مشتريات الجملة هذا الشهر؟',
    'شنو المواد القريبة من انتهاء الصلاحية هذا الأسبوع؟',
    'هل عليّ ديون متأخرة أو حسابات ائتمان موقوفة؟',
    'أي أصناف محتاجة إعادة طلب عاجلة بسبب نفاد المخزون؟'
  ] : [
    'How much did I spend on wholesale purchases this month?',
    'Which items are near expiry this week?',
    'Do I have any overdue debts or blocked credit lines?',
    'Which products need urgent reordering due to low stock?'
  ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store_almansoor',
          question: questionText
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'فشلت معالجة الاستفسار');
      }

      const assistantMsg: Message = {
        sender: 'assistant',
        text: data.data.answer,
        stats: data.data.calculatedStats,
        timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `عذراً، حدث خطأ أثناء جلب المؤشرات: ${err.message}`,
          timestamp: 'الآن'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#E5E7EB]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-gradient-to-r from-emerald-900 to-[#00A046] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">المساعد المالي والتشغيلي للمتجر</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                حسابات قاعدة البيانات الدقيقة + استشارات الذكاء الاصطناعي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-[#F7F8FA] p-3 border-b border-[#E5E7EB] overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#6B7280] whitespace-nowrap">أسئلة سريعة:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              className="text-xs bg-white border border-[#E5E7EB] hover:border-[#00A046] hover:text-[#00A046] px-3 py-1.5 rounded-full text-[#1F2328] whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-[#1F2328] text-white'
                    : 'bg-[#00A046] text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#00A046] text-white rounded-tr-xs'
                    : 'bg-white text-[#1F2328] border border-[#E5E7EB] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.text}</div>

                {/* Render database verifiable facts card if present */}
                {msg.stats && (
                  <div className="mt-3 pt-3 border-t border-gray-200/60 bg-[#F7F8FA] rounded-xl p-3 text-xs space-y-1.5 text-gray-700">
                    <div className="flex items-center gap-1.5 font-bold text-[#00A046]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مؤشرات موثقة من قاعدة بيانات سوق الجملة:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div>مشتريات الشهر: {Number(msg.stats.totalSpentThisMonthIQD).toLocaleString()} د.ع</div>
                      <div>الديون الآجلة: {Number(msg.stats.totalOutstandingDebtIQD).toLocaleString()} د.ع</div>
                      <div>سقف الائتمان المتاح: {Number(msg.stats.totalAvailableCreditIQD).toLocaleString()} د.ع</div>
                      <div>أصناف منخفضة: {msg.stats.lowStockCount}</div>
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#00A046] bg-white border border-[#E5E7EB] rounded-xl p-3 max-w-xs shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري استعلام مؤشرات قاعدة البيانات وصياغة النصيحة...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(inputQuestion);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="اسأل المستشار: كم أنفقت؟ ما الذي ينتهي هذا الأسبوع؟ كيف أخفض مصاريفي؟"
              className="flex-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A046]"
            />
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="p-2.5 bg-[#00A046] text-white rounded-xl hover:bg-[#008a3c] disabled:bg-gray-300 transition shadow-xs"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
