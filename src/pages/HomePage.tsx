import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Utensils,
  Truck,
  HeartHandshake,
  Leaf,
  Users,
  PackageCheck,
  Sparkles,
  Store,
  HandHeart,
  ShieldCheck,
} from 'lucide-react';
import { DonationCard } from '../components/donations/DonationCard';
import { StatCard, SectionHeading, Spinner } from '../components/ui/Primitives';
import { fetchPlatformStats, listAvailableDonations } from '../lib/api';
import { formatNumber } from '../lib/format';
import { useLang } from '../i18n/LanguageContext';
import type { Donation, PlatformStats } from '../lib/types';

export default function HomePage() {
  const { t } = useLang();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchPlatformStats(), listAvailableDonations()])
      .then(([s, d]) => {
        if (!alive) return;
        setStats(s);
        setDonations(d.slice(0, 4));
      })
      .catch(() => {
        if (alive) setStats(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const steps = [
    { icon: Store, title: t('home.step1'), copy: t('home.step1Copy') },
    { icon: Sparkles, title: t('home.step2'), copy: t('home.step2Copy') },
    { icon: Truck, title: t('home.step3'), copy: t('home.step3Copy') },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0f2a1e]" data-component="hero-section">
        <img
          src="/assets/images/hero-community-hub.jpg"
          alt={t('home.badge')}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2318]/95 via-[#0f2a1e]/78 to-[#0f2a1e]/35" />
        <div className="container-page relative py-20 sm:py-24 lg:py-28">
          <div className="max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/90 backdrop-blur">
              <Leaf size={13} />
              {t('home.badge')}
            </span>
            <h1 className="mt-6 text-[34px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[46px] lg:text-[56px]">
              {t('home.title1')}
              <br />
              {t('home.title2')}
              <br />
              <span className="text-[#8ad8ac]">{t('home.title3')}</span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
              {t('home.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register?role=donor" className="btn btn-primary h-12 px-6 text-[15px]">
                {t('home.donate')}
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/register?role=beneficiary"
                className="btn h-12 border border-white/30 bg-white/10 px-6 text-[15px] text-white backdrop-blur transition hover:bg-white/18"
              >
                {t('home.getHelp')}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/65">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} /> {t('home.verified')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HandHeart size={14} /> {t('home.free')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10" data-component="stats-section">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('home.statMeals')}
              value={stats ? formatNumber(stats.meals_distributed) : '—'}
              hint={t('home.statMealsHint')}
              icon={<Utensils size={18} />}
            />
            <StatCard
              label={t('home.statFamilies')}
              value={stats ? formatNumber(stats.families_helped) : '—'}
              hint={t('home.statFamiliesHint')}
              icon={<Users size={18} />}
              tone="neutral"
            />
            <StatCard
              label={t('home.statDonations')}
              value={stats ? formatNumber(stats.total_donations) : '—'}
              hint={t('home.statDonationsHint')}
              icon={<PackageCheck size={18} />}
              tone="neutral"
            />
            <StatCard
              label={t('home.statDeliveries')}
              value={stats ? formatNumber(stats.completed_deliveries) : '—'}
              hint={t('home.statDeliveriesHint')}
              icon={<Truck size={18} />}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20" data-component="how-it-works">
        <SectionHeading eyebrow={t('footer.howItWorks')} title={t('home.howTitle')} description={t('home.howSubtitle')} />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="card card-pad relative">
              <span className="absolute end-5 top-5 text-[13px] font-semibold text-[#cbd8d0]">0{index + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-[#14603d]">
                <step.icon size={20} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f6f8f7] py-16 sm:py-20" data-component="latest-donations">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('donationsPage.eyebrow')}
            title={t('home.latest')}
            description={t('home.latestSubtitle')}
            action={
              <Link to="/donations" className="btn btn-secondary">
                {t('common.viewAll')}
                <ArrowRight size={16} />
              </Link>
            }
          />
          <div className="mt-8">
            {loading ? (
              <Spinner label={t('common.loading')} />
            ) : donations.length === 0 ? (
              <div className="card card-pad text-center">
                <p className="text-[15px] font-semibold">{t('home.noDonations')}</p>
                <p className="mt-1.5 text-sm text-muted">{t('home.noDonationsCopy')}</p>
                <Link to="/register?role=donor" className="btn btn-primary mt-5">
                  {t('footer.becomeDonor')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {donations.map((donation) => (
                  <DonationCard key={donation.donation_id} donation={donation} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20" data-component="sdg-section">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/assets/images/about-distribution.jpg"
              alt={t('about.solutionTitle')}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <SectionHeading eyebrow={t('about.problemEyebrow')} title={t('home.sdgTitle')} />
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-line bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="badge bg-[#fdf3e3] text-[#8a5305]">{t('home.sdg1Badge')}</span>
                  <h3 className="text-[16px] font-semibold">{t('home.sdg1Title')}</h3>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{t('home.sdg1')}</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="badge bg-[#e8f5ec] text-[#14603d]">{t('home.sdg2Badge')}</span>
                  <h3 className="text-[16px] font-semibold">{t('home.sdg2Title')}</h3>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{t('home.sdg2')}</p>
              </div>
            </div>
            <Link to="/impact" className="btn btn-secondary mt-6">
              {t('home.seeImpact')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page pb-20" data-component="cta-section">
        <div className="overflow-hidden rounded-2xl bg-[#0f2a1e] px-6 py-12 sm:px-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-[26px] font-semibold leading-tight text-white sm:text-[32px]">
                {t('home.ctaTitle')}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">{t('home.ctaCopy')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary h-12 px-6">
                <HeartHandshake size={17} />
                {t('home.createAccount')}
              </Link>
              <Link
                to="/about"
                className="btn h-12 border border-white/30 bg-transparent px-6 text-white transition hover:bg-white/10"
              >
                {t('home.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
