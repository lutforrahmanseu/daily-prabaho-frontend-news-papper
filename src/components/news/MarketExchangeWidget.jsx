import React from 'react';
import { useSelector } from 'react-redux';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import { TrendingUp, DollarSign } from 'lucide-react';

export function MarketExchangeWidget() {
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const rates = [
    { currency: 'USD ($)', rate: 122.50, change: '+0.15%' },
    { currency: 'EUR (€)', rate: 132.80, change: '-0.20%' },
    { currency: 'SAR (﷼)', rate: 32.65, change: '+0.05%' },
    { currency: 'GBP (£)', rate: 154.20, change: '+0.30%' }
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-stone-900 font-serif-bn">
            {isBn ? 'মুদ্রা ও বাজার দর' : 'Currency & Markets'}
          </h3>
        </div>
        <span className="text-[11px] text-stone-500 font-mono">
          BDT (৳)
        </span>
      </div>

      <div className="space-y-2.5">
        {rates.map((item) => (
          <div key={item.currency} className="flex items-center justify-between text-xs py-1 border-b border-stone-50 last:border-b-0">
            <span className="font-semibold text-stone-700">{item.currency}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-stone-900">
                ৳{isBn ? toBengaliNumber(item.rate.toFixed(2)) : item.rate.toFixed(2)}
              </span>
              <span className={`text-[10px] font-mono ${item.change.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-stone-700">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold">DSEX:</span>
          <span className="font-mono font-bold text-stone-900">
            {isBn ? toBengaliNumber('5,842.10') : '5,842.10'}
          </span>
        </div>
        <span className="text-emerald-600 font-mono text-[11px] font-semibold">+18.4 pts</span>
      </div>
    </div>
  );
}

export default MarketExchangeWidget;
