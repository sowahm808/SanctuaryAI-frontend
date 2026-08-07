export const THEME_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type ThemeTone = "pastoral" | "prophetic" | "teaching" | "evangelistic";
export type ThemeAudience =
  "whole-church" | "adults" | "youth" | "families" | "leaders";

export interface ThemeFormModel {
  month: number;
  year: number;
  topic: string;
  mainScripture: string;
  supportingScriptures: string[];
  spiritualEmphasis: string;
  pastorNotes: string;
  previousTheme: string;
  upcomingEvents: string[];
  tone: ThemeTone;
  intendedAudience: ThemeAudience[];
}

export interface GeneratedTheme {
  title?: string;
  themeTitle?: string;
  subtitle?: string;
  scriptures?: readonly string[];
  explanation?: string;
  pastoralIntroduction?: string;
  objectives?: readonly string[];
  weeklyTeachingDirection?: readonly string[];
  monthlyConfession?: string;
  propheticDeclaration?: string;
  hashtags?: readonly string[];
  flyerHeadline?: string;
  designConcept?: string;
}
