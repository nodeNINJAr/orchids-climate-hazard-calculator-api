export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface IEntry {
  _id: string;
  division: string;
  climateHazardCategory: string;
}

export interface ICriteria {
  _id: string;
  name: string;
  weight: number;
  entryId: string;
}

export enum DamageLevel {
  SEVERELY_DAMAGE = 'Severely Damage',
  MODERATELY_DAMAGE = 'Moderately Damage',
  SLIGHTLY_DAMAGE = 'Slightly Damage',
  NO_DAMAGE = 'No Damage'
}

export const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

export interface IConfig {
  _id: string;
  name: DamageLevel;
  value: number;
}

export interface ICalculationResult {
  totalScore: number;
  averageScore: number;
  riskLevel: string;
}

export interface ICriteriaSelection {
  criteriaId: string;
  value: number;
}
