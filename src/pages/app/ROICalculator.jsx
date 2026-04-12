import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import { fmtMoney } from '../../utils';

export default function ROICalculator() {
  const navigate  = useNavigate();
  const [plots,   setPlots]   = useState(1);
  const [price,   setPrice]   = useState(2000000);
  const [appPct,  setAppPct]  = useState(15);
  const [years,   setYears]   = useState(5);

  const investment = useMemo(() => plots * price, [plots, price]);

  const yearlyData = useMemo(() => {
    return Array.from({ length: years }, (_, i) => {
      const yr  = i + 1;
      const val = investment * Math.pow(1 + appPct / 100, yr);
      return { year: yr, value: val, profit: val - investment };
    });
  }, [investment, appPct, years]);

  const finalVal    = yearlyData[yearlyData.length - 1]?.value || investment;
  const finalProfit = finalVal - investment;
  const roi         = investment > 0 ? Math.round((finalProfit / investment) * 100) : 0;

  return (
    <Layout>
      <TopHeader title="ROI Calculator" showBack />
      <div className="px-4 py-4 overflow-y-auto">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <p className="font-800 text-textmain text-sm mb-4">Investment Parameters</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-700 text-textsub uppercase">Number of Plots</label>
                <span className="text-sm font-900 text-red">{plots}</span>
              </div>
              <input type="range" min={1} max={20} value={plots} onChange={e => setPlots(Number(e.target.value))} className="w-full accent-red" />
              <div className="flex justify-between text-[10px] text-textmuted mt-1"><span>1</span><span>20</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-700 text-textsub uppercase">Price per Plot</label>
                <span className="text-sm font-900 text-red">{fmtMoney(price)}</span>
              </div>
              <input type="range" min={1000000} max={10000000} step={500000} value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full accent-red" />
              <div className="flex justify-between text-[10px] text-textmuted mt-1"><span>₦1M</span><span>₦10M</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-700 text-textsub uppercase">Annual Appreciation</label>
                <span className="text-sm font-900 text-red">{appPct}%</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={appPct} onChange={e => setAppPct(Number(e.target.value))} className="w-full accent-red" />
              <div className="flex justify-between text-[10px] text-textmuted mt-1"><span>5%</span><span>50%</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-700 text-textsub uppercase">Projection Years</label>
                <span className="text-sm font-900 text-red">{years} yrs</span>
              </div>
              <input type="range" min={1} max={20} value={years} onChange={e => setYears(Number(e.target.value))} className="w-full accent-red" />
              <div className="flex justify-between text-[10px] text-textmuted mt-1"><span>1 yr</span><span>20 yrs</span></div>
            </div>
          </div>
        </div>

        {/* Results card */}
        <div className="bg-navy rounded-2xl p-5 mb-4">
          <p className="text-white/60 text-xs font-700 uppercase tracking-wide mb-4">Projected Results ({years} Years)</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-white/50 text-[10px] font-700 mb-1">YOUR INVESTMENT</p>
              <p className="text-white font-900 text-base">{fmtMoney(investment)}</p>
            </div>
            <div className="bg-red/20 rounded-xl p-3 border border-red/30">
              <p className="text-red/80 text-[10px] font-700 mb-1">PROJECTED VALUE</p>
              <p className="text-white font-900 text-base">{fmtMoney(Math.round(finalVal))}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-white/50 text-[10px] font-700 mb-1">TOTAL PROFIT</p>
              <p className="text-success font-900 text-base">+{fmtMoney(Math.round(finalProfit))}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-white/50 text-[10px] font-700 mb-1">ROI</p>
              <p className="text-success font-900 text-base">+{roi}%</p>
            </div>
          </div>
          <p className="text-white/40 text-[10px] text-center">* Projections based on historical appreciation rates. Not financial advice.</p>
        </div>

        {/* Year by year table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-5">
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-surface-2 border-b border-border">
            {['Year', 'Value', 'Profit', 'ROI'].map(h => (
              <span key={h} className="text-[10px] font-800 text-textmuted uppercase">{h}</span>
            ))}
          </div>
          {yearlyData.map(r => (
            <div key={r.year} className={`grid grid-cols-4 gap-2 px-4 py-3 border-b border-border last:border-0 ${r.year === years ? 'bg-success-bg' : ''}`}>
              <span className="text-xs font-700 text-textsub">Y{r.year}</span>
              <span className="text-xs font-700 text-textmain">{fmtMoney(Math.round(r.value / 1000))}K</span>
              <span className="text-xs font-700 text-success">+{fmtMoney(Math.round(r.profit / 1000))}K</span>
              <span className="text-xs font-700 text-success">+{Math.round((r.profit / investment) * 100)}%</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/estates')}
          className="w-full bg-red text-white py-4 rounded-2xl font-800 text-sm flex items-center justify-between px-5 mb-4"
        >
          <span>Reserve Your Plot →</span>
          <span className="text-lg">🏘</span>
        </button>

        <div className="h-4" />
      </div>
    </Layout>
  );
}
