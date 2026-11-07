import { daysUntil } from './format';
import type { AssistanceRequest, Donation } from './types';
import { categoryLabel } from './types';

export interface MatchScore {
  score: number;
  reasons: string[];
  breakdown: { label: string; points: number; max: number }[];
}

const URGENCY_POINTS: Record<string, number> = {
  critical: 10,
  high: 7,
  normal: 4,
  low: 2,
};

/**
 * Rule-based compatibility score (no external services, no AI).
 * Weighting: category 40, quantity 20, expiry urgency 15, location 15, request urgency 10.
 */
export function scoreMatch(donation: Donation, request: AssistanceRequest): MatchScore {
  const reasons: string[] = [];
  const breakdown: MatchScore['breakdown'] = [];

  let category = 0;
  if (request.food_type === 'any') {
    category = 20;
    reasons.push('Beneficiary accepts any food category');
  } else if (donation.category === request.food_type) {
    category = 40;
    reasons.push(`Category match: ${categoryLabel(donation.category)}`);
  } else {
    reasons.push(`Category differs (${categoryLabel(donation.category)} offered)`);
  }
  breakdown.push({ label: 'Category fit', points: category, max: 40 });

  const available = Number(donation.quantity);
  const needed = Number(request.quantity);
  let quantity = 0;
  if (available >= needed) {
    quantity = 20;
    reasons.push(`Covers the full request (${available} available vs ${needed} needed)`);
  } else if (available >= needed * 0.5) {
    quantity = 12;
    reasons.push(`Covers part of the request (${available} of ${needed})`);
  } else {
    quantity = 4;
    reasons.push(`Limited quantity (${available} available)`);
  }
  breakdown.push({ label: 'Quantity', points: quantity, max: 20 });

  const days = daysUntil(donation.expiry_date) ?? 0;
  let expiry = 0;
  if (days < 0) {
    expiry = 0;
    reasons.push('Past its expiry date');
  } else if (days <= 3) {
    expiry = 15;
    reasons.push('Expires within 3 days — rescue priority');
  } else if (days <= 7) {
    expiry = 10;
    reasons.push(`Expires in ${days} days`);
  } else {
    expiry = 5;
    reasons.push(`Expires in ${days} days`);
  }
  breakdown.push({ label: 'Expiry urgency', points: expiry, max: 15 });

  let location = 0;
  if (donation.city && request.city && donation.city === request.city) {
    location = 15;
    reasons.push(`Same area: ${donation.city}`);
  } else if (donation.city && request.city) {
    location = 5;
    reasons.push(`Different area: ${donation.city} → ${request.city}`);
  } else {
    location = 3;
  }
  breakdown.push({ label: 'Location', points: location, max: 15 });

  const urgency = URGENCY_POINTS[request.urgency] ?? 0;
  if (request.urgency === 'critical' || request.urgency === 'high') {
    reasons.push(`${request.urgency === 'critical' ? 'Critical' : 'High'} urgency request prioritised`);
  }
  breakdown.push({ label: 'Urgency', points: urgency, max: 10 });

  const score = Math.min(100, category + quantity + expiry + location + urgency);
  return { score, reasons, breakdown };
}

export interface RankedCandidate {
  donation: Donation;
  score: number;
  reasons: string[];
}

export function rankDonations(
  donations: Donation[],
  request: AssistanceRequest,
): RankedCandidate[] {
  return donations
    .filter((d) => d.status === 'approved' || d.status === 'matched')
    .map((donation) => {
      const result = scoreMatch(donation, request);
      return { donation, score: result.score, reasons: result.reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function urgencyRank(urgency: string): number {
  return URGENCY_POINTS[urgency] ?? 0;
}
