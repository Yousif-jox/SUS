import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Eye,
  Recycle,
  Utensils,
  MapPin,
  ShieldCheck,
  Clock,
  Users,
} from 'lucide-react';
import { SectionHeading } from '../components/ui/Primitives';
import { useLang } from '../i18n/LanguageContext';

const PROBLEMS = [
  {
    icon: Recycle,
    stat: '1/3',
    titleKey: 'about.p1Title',
    copyKey: 'about.p1Copy',
  },
  {
    icon: Utensils,
    stat: '733M',
    titleKey: 'about.p2Title',
    copyKey: 'about.p2Copy',
  },
  {
    icon: Clock,
    stat: '24h',
    titleKey: 'about.p3Title',
    copyKey: 'about.p3Copy',
  },
];

const SOLUTIONS = [
  {
    icon: MapPin,
    titleKey: 'about.s1Title',
    copyKey: 'about.s1Copy',
  },
  {
    icon: ShieldCheck,
    titleKey: 'about.s2Title',
    copyKey: 'about.s2Copy',
  },
  {
    icon: Users,
    titleKey: 'about.s3Title',
    copyKey: 'about.s3Copy',
  },
  {
    icon: Recycle,
    titleKey: 'about.s4Title',
    copyKey: 'about.s4Copy',
  },
];

export default function AboutPage() {
  const { t } = useLang();
  return (
    <div>
      <section className="border-b border-line bg-[#f6f8f7]" data-component="about-hero">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {t('about.eyebrow')}
            </p>
            <h1 className="mt-3 text-[34px] leading-[1.1] tracking-tight sm:text-[42px]">
              {t('about.title')}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              {t('about.intro')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register?role=donor" className="btn btn-primary">
                {t('home.donate')}
                <ArrowRight size={16} />
              </Link>
              <Link to="/donations" className="btn btn-secondary">
                {t('nav.donations')}
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-lg">
            <img
              src="/assets/images/about-distribution.jpg"
              alt={t('about.solutionTitle')}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16" data-component="about-problem">
        <SectionHeading
          eyebrow={t('about.problemEyebrow')}
          title={t('about.problemTitle')}
          description={t('about.problemSubtitle')}
        />
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {PROBLEMS.map((item) => (
            <article key={item.titleKey} className="card card-pad">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fdf3e3] text-[#8a5305]">
                  <item.icon size={19} />
                </span>
                <span className="text-[22px] font-semibold tracking-tight text-[#cbd8d0]">
                  {item.stat}
                </span>
              </div>
              <h3 className="mt-4 text-[16px] font-semibold">{t(item.titleKey)}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{t(item.copyKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f6f8f7] py-16" data-component="about-solution">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('about.solutionEyebrow')}
            title={t('about.solutionTitle')}
            description={t('about.solutionSubtitle')}
          />
          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {SOLUTIONS.map((item) => (
              <div key={item.titleKey} className="card card-pad flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-[#14603d]">
                  <item.icon size={18} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{t(item.titleKey)}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{t(item.copyKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16" data-component="about-mission">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card card-pad">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-[#14603d]">
              <Target size={20} />
            </span>
            <h2 className="mt-4 text-[22px] font-semibold">{t('about.mission')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {t('about.missionCopy')}
            </p>
          </div>
          <div className="card card-pad">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#e7f2f4] text-[#0d5463]">
              <Eye size={20} />
            </span>
            <h2 className="mt-4 text-[22px] font-semibold">{t('about.vision')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {t('about.visionCopy')}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h3 className="text-[18px] font-semibold">{t('about.orgTitle')}</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [t('about.orgDonors'), t('about.orgDonorsCopy')],
              [t('about.orgBeneficiaries'), t('about.orgBeneficiariesCopy')],
              [t('about.orgVolunteers'), t('about.orgVolunteersCopy')],
              [t('about.orgAdmins'), t('about.orgAdminsCopy')],
            ].map(([title, copy]) => (
              <div key={title}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">{title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
