import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CITIES, FOOD_CATEGORIES, regionLabel } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export interface FilterState {
  search: string;
  category: string;
  city: string;
}

export function DonationFilters({
  value,
  onChange,
  cities = CITIES,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  cities?: string[];
}) {
  const { t } = useLang();
  const active = Boolean(value.search || value.category !== 'all' || value.city !== 'all');
  const cityOptions = Array.from(new Set([...cities])).sort();

  return (
    <div className="card card-pad" data-component="donation-filters">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="field-label" htmlFor="donation-search">
            {t('donationsPage.searchLabel')}
          </label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="donation-search"
              type="search"
              value={value.search}
              onChange={(e) => onChange({ ...value, search: e.target.value })}
              placeholder={t('donationsPage.searchPlaceholder')}
              className="input pl-9"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
          <div>
            <label className="field-label" htmlFor="filter-category">
              {t('donationsPage.categoryLabel')}
            </label>
            <select
              id="filter-category"
              className="input"
              value={value.category}
              onChange={(e) => onChange({ ...value, category: e.target.value })}
            >
              <option value="all">{t('donationsPage.allCategories')}</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="filter-city">
              {t('donationsPage.locationLabel')}
            </label>
            <select
              id="filter-city"
              className="input"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
            >
              <option value="all">{t('donationsPage.allLocations')}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {regionLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {active && (
          <button
            type="button"
            className="btn btn-ghost shrink-0"
            onClick={() => onChange({ search: '', category: 'all', city: 'all' })}
          >
            <X size={15} />
            {t('donationsPage.clear')}
          </button>
        )}
      </div>

      {active && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
          <SlidersHorizontal size={13} />
          {t('donationsPage.filtersApplied')}
        </p>
      )}
    </div>
  );
}

export function filterDonations<T extends { food_name: string; category: string; city: string; donor_name: string; description: string | null }>(
  items: T[],
  filters: FilterState,
): T[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    const matchQuery =
      !q ||
      item.food_name.toLowerCase().includes(q) ||
      item.donor_name.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q);
    const matchCategory = filters.category === 'all' || item.category === filters.category;
    const matchCity = filters.city === 'all' || item.city === filters.city;
    return matchQuery && matchCategory && matchCity;
  });
}
