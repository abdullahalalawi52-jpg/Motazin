import React, { useState, memo } from 'react';
import { Mail, Send, CheckCircle2, Info, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export const ContactUsView: React.FC = memo(() => {
  const { t, dir, language } = useLanguage();
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Save to Firebase
      await addDoc(collection(db, 'messages'), {
        name: formName,
        email: formEmail,
        message: formMessage,
        createdAt: new Date().toISOString()
      });

      setIsSent(true);
      setFormName('');
      setFormEmail('');
      setFormMessage('');
      setTimeout(() => setIsSent(false), 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t('errorSendingMessage') || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8" dir={dir}>
      {/* Hero */}
      <div className="relative overflow-hidden glass-card p-10 text-center border-t-4 border-indigo-500">
        <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, #6366f1 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-3xl border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Mail className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
            {t('contactTitle')}
          </h1>
          <p className="text-lg dark:text-slate-300 text-slate-600 max-w-2xl mx-auto">
            {t('contactSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-3 glass-card p-8">
          <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Send className="w-5 h-5 text-indigo-400" />
            </div>
            {t('sendMessage')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="contact-name" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('fullName')}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('emailAddress')}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('yourMessage')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                value={formMessage}
                onChange={e => setFormMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSent ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSending ? t('sending') : isSent ? `✓ ${t('successSent')}` : t('sendButton')}
            </button>
          </form>
        </div>

        {/* Contact Info + Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Info className="w-5 h-5 text-emerald-400" />
              </div>
              {t('contactInfo')}
            </h2>
            <div className="space-y-5">
              <a
                href="mailto:abdullahalalawi52@gmail.com"
                className="flex items-center gap-4 p-4 rounded-2xl dark:bg-white/5 bg-slate-100 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors group"
              >
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex-shrink-0">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest dark:text-slate-400 text-slate-500 mb-0.5">{t('emailLabel')}</p>
                  <p className="dark:text-white text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors" dir="ltr">
                    abdullahalalawi52@gmail.com
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 rounded-2xl dark:bg-white/5 bg-slate-100">
                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest dark:text-slate-400 text-slate-500 mb-0.5">{t('addressLabel')}</p>
                  <p className="dark:text-white text-slate-900 font-bold text-sm">{t('addressValue')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-bold dark:text-white text-slate-900">{t('addressValue')}</span>
            </div>
            <iframe
              title="location-map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(t('addressValue'))}&hl=${language}&output=embed`}
              width="100%"
              height="220"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale dark:opacity-80 hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
