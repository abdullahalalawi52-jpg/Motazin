import React, { memo } from 'react';
import { Heart, Info, Zap, Shield, Target } from 'lucide-react';
import { useLanguage } from '../i18n';

export const AboutUsView: React.FC = memo(() => {
  const { t, dir } = useLanguage();
  return (
    <div className="animate-fade-in space-y-10" dir={dir}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden glass-card p-10 md:p-16 text-center border-t-4 border-emerald-500">
        <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, #10b981 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-3xl border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Heart className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
            {t('aboutTitle')}
          </h1>
          <p className="text-lg dark:text-slate-300 text-slate-600 max-w-2xl mx-auto">
            {t('aboutSubtitle')}
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="glass-card p-8 md:p-12">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-5 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          {t('ourStory')}
        </h2>
        <p className="dark:text-slate-300 text-slate-700 leading-relaxed text-base md:text-lg">
          {t('storyText')}
        </p>
      </div>

      {/* Core Values */}
      <div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-6 text-center">
          {t('coreValues')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Value 1 */}
          <div className="glass-card p-8 text-center border-t-4 border-emerald-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Zap className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value1Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value1Desc')}
            </p>
          </div>
          {/* Value 2 */}
          <div className="glass-card p-8 text-center border-t-4 border-indigo-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 mb-5 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Shield className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value2Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value2Desc')}
            </p>
          </div>
          {/* Value 3 */}
          <div className="glass-card p-8 text-center border-t-4 border-amber-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-2xl border border-amber-500/30 mb-5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Target className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value3Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value3Desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
