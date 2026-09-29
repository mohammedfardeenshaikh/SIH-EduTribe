/**
 * EduTribe — Eligibility Engine
 * ---------------------------------------------------------------
 * Pure rule-based evaluator. Takes a student profile and checks it
 * against every MoTA scheme. No side effects, no API calls.
 *
 * Statuses:
 *   'Eligible'           — all conditions met
 *   'Partially Eligible' — close but one soft condition fails
 *   'Not Eligible'       — hard condition fails (level, destination, etc.)
 * ---------------------------------------------------------------
 */

import { instituteNames } from '../data/instituteList';

// Education levels mapped to scheme level arrays
const LEVEL_MAP = {
  'Class IX': ['Class IX'],
  'Class X': ['Class X'],
  'Class XI': ['Class XI'],
  'Class XII': ['Class XII'],
  'Diploma': ['Diploma'],
  'ITI/Vocational': ['ITI/Vocational'],
  'Graduate': ['Graduate'],
  'Post-Graduate': ['Post-Graduate'],
  'MPhil': ['MPhil', 'MPhil+PhD'],
  'PhD': ['PhD', 'MPhil+PhD'],
  "Master's (abroad)": ["Master's (abroad)"],
  "PhD (abroad)": ["PhD (abroad)"],
  "Post-Doctoral (abroad)": ["Post-Doctoral (abroad)"],
};

function checkLevelMatch(profileLevel, schemeLevel) {
  const mapped = LEVEL_MAP[profileLevel] || [profileLevel];
  return schemeLevel.some(sl => mapped.includes(sl));
}

function isInTopClassList(instituteName) {
  if (!instituteName) return false;
  return instituteNames.some(
    name => name.toLowerCase() === instituteName.toLowerCase()
  );
}

/**
 * Evaluate one profile against one scheme.
 * Returns { status, failingCondition }
 */
function evaluateScheme(profile, scheme) {
  // 1. Level match
  if (!checkLevelMatch(profile.educationLevel, scheme.level)) {
    return {
      status: 'Not Eligible',
      failingCondition: `Education level "${profile.educationLevel}" does not match this scheme's target levels: ${scheme.level.join(', ')}.`,
    };
  }

  // 2. NOS: study destination must be Abroad
  if (scheme.id === 'nos_overseas' && profile.studyDestination !== 'Abroad') {
    return {
      status: 'Not Eligible',
      failingCondition: 'This scheme is exclusively for studies abroad. Your study destination is set to India.',
    };
  }

  // 3. Top Class institute requirement / exclusion
  const inTopClass = isInTopClassList(profile.institute);

  if (scheme.requires && scheme.requires.includes('admission_in_notified_252_institute')) {
    if (!inTopClass) {
      return {
        status: 'Not Eligible',
        failingCondition: 'This scheme requires admission in one of the 252 MoTA-notified Top Class institutes (IITs, IIMs, NITs, AIIMS, NLUs, etc.). Your institute is not on the list.',
      };
    }
  }

  if (scheme.excludes_if && scheme.excludes_if.includes('admitted_in_top_class_252_institute')) {
    if (inTopClass) {
      return {
        status: 'Not Eligible',
        failingCondition: 'Students admitted to a Top Class (252-list) institute should apply under the National Scholarship (Top Class) scheme instead. This scheme excludes them to avoid duplication.',
      };
    }
  }

  // 4. Income check
  if (scheme.income_ceiling_annual !== null && scheme.income_ceiling_annual !== undefined) {
    const ceiling = scheme.income_ceiling_annual;
    if (profile.income > ceiling) {
      const overBy = profile.income - ceiling;
      const overPercent = (overBy / ceiling) * 100;

      if (overPercent <= 20) {
        return {
          status: 'Partially Eligible',
          failingCondition: `Annual family income (₹${profile.income.toLocaleString('en-IN')}) exceeds the ceiling of ₹${ceiling.toLocaleString('en-IN')} by ₹${overBy.toLocaleString('en-IN')} (${overPercent.toFixed(0)}%). You're close — verify if any relaxation applies.`,
        };
      }
      return {
        status: 'Not Eligible',
        failingCondition: `Annual family income (₹${profile.income.toLocaleString('en-IN')}) exceeds the scheme ceiling of ₹${ceiling.toLocaleString('en-IN')}.`,
      };
    }
  }

  // 5. Age check
  if (scheme.age_limit_years && profile.age > scheme.age_limit_years) {
    const overBy = profile.age - scheme.age_limit_years;
    if (overBy <= 2) {
      return {
        status: 'Partially Eligible',
        failingCondition: `Age (${profile.age}) exceeds the limit of ${scheme.age_limit_years} years by ${overBy} year(s). Check if age relaxation applies for your category.`,
      };
    }
    return {
      status: 'Not Eligible',
      failingCondition: `Age (${profile.age}) exceeds the scheme's age limit of ${scheme.age_limit_years} years.`,
    };
  }

  if (scheme.age_limit_by_course) {
    let applicableLimit = null;
    if (profile.educationLevel.includes("Master's")) applicableLimit = scheme.age_limit_by_course["Master's"];
    else if (profile.educationLevel.includes('PhD')) applicableLimit = scheme.age_limit_by_course['PhD'];
    else if (profile.educationLevel.includes('Post-Doctoral')) applicableLimit = scheme.age_limit_by_course['Post-Doctoral'];

    if (applicableLimit && profile.age > applicableLimit) {
      return {
        status: 'Not Eligible',
        failingCondition: `Age (${profile.age}) exceeds the limit of ${applicableLimit} years for this course level.`,
      };
    }
  }

  // 6. Min marks check (NFST and NOS)
  if (scheme.min_marks_percent_pg && profile.marksPercent < scheme.min_marks_percent_pg) {
    if (profile.marksPercent >= scheme.min_marks_percent_pg - 5) {
      return {
        status: 'Partially Eligible',
        failingCondition: `PG marks (${profile.marksPercent}%) are just below the required ${scheme.min_marks_percent_pg}%. Check if relaxation for ST category applies.`,
      };
    }
    return {
      status: 'Not Eligible',
      failingCondition: `PG marks (${profile.marksPercent}%) are below the minimum ${scheme.min_marks_percent_pg}% required.`,
    };
  }

  if (scheme.min_marks_percent && profile.marksPercent < scheme.min_marks_percent) {
    return {
      status: 'Not Eligible',
      failingCondition: `Marks (${profile.marksPercent}%) are below the minimum ${scheme.min_marks_percent}% required for this scheme.`,
    };
  }

  // All checks passed
  return { status: 'Eligible', failingCondition: '' };
}

/**
 * Main entry point — evaluates profile against ALL schemes.
 * @param {Object} profile - student profile from the form
 * @param {Array} schemes - array from scheme_rules.json
 * @returns {Array<{scheme, status, failingCondition, benefitSummary}>}
 */
export function evaluateProfile(profile, schemes) {
  return schemes.map(scheme => {
    const { status, failingCondition } = evaluateScheme(profile, scheme);
    return {
      scheme,
      status,
      failingCondition,
      benefitSummary: scheme.benefit_summary || '',
    };
  });
}

export default evaluateProfile;
