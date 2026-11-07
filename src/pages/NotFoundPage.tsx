import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="container-page flex min-h-[calc(100vh-72px)] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-[#14603d]">
        <Compass size={24} />
      </span>
      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">404</p>
      <h1 className="mt-2 text-[30px] tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        {t('notFound.copy')}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          {t('auth.backHome')}
        </Link>
        <Link to="/donations" className="btn btn-secondary">
          {t('notFound.browse')}
        </Link>
      </div>
    </div>
  );
}
