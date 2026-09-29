from decimal import Decimal
from rules_engine.models import Scheme
from accounts.models import Institute

def evaluate_applicant_profile(profile_data):
    """
    Evaluates candidate profile against all active MoTA scholarship schemes.
    Returns ranked schemes by:
    1. Eligibility Status (Eligible > Partially Eligible > Not Eligible)
    2. Criteria Match Fraction (e.g. 4/4 > 3/4)
    3. Indicative Annual Benefit (higher financial assistance first)
    """
    category = profile_data.get('category', 'ST').strip().upper()
    education_level = profile_data.get('education_level', '').strip()
    try:
        annual_income = Decimal(str(profile_data.get('annual_income', 0)))
    except Exception:
        annual_income = Decimal('0')
        
    age = profile_data.get('age')
    marks = profile_data.get('marks_percent')
    destination = profile_data.get('study_destination', 'India')
    quota = profile_data.get('admission_quota', 'regular')
    is_qs_1000 = profile_data.get('is_qs_top_1000', False)
    institute_id = profile_data.get('institute_id')
    institute_name = profile_data.get('institute_name', '')

    is_in_premier_institute = False
    if institute_id:
        is_in_premier_institute = Institute.objects.filter(id=institute_id).exists()
    elif institute_name:
        is_in_premier_institute = Institute.objects.filter(name__icontains=institute_name).exists()

    schemes = Scheme.objects.all()
    results = []

    for scheme in schemes:
        passed_conditions = []
        failed_conditions = []
        total_conditions = 0

        # Condition 1: Category ST
        total_conditions += 1
        if category == 'ST':
            passed_conditions.append("Applicant belongs to Scheduled Tribe (ST) category")
        else:
            failed_conditions.append(f"Scheme is restricted to Scheduled Tribe (ST) applicants (Provided: {category})")

        # Condition 2: Education Level
        total_conditions += 1
        matched_level = False
        if scheme.level:
            for lvl in scheme.level:
                if lvl.lower() in education_level.lower() or education_level.lower() in lvl.lower():
                    matched_level = True
                    break
        else:
            matched_level = True

        if matched_level:
            passed_conditions.append(f"Education level '{education_level}' is covered by this scheme")
        else:
            failed_conditions.append(f"Education level '{education_level}' is not covered (Scheme applies to: {', '.join(scheme.level)})")

        # Condition 3: Income Ceiling
        income_failed = False
        if scheme.income_ceiling_annual is not None:
            total_conditions += 1
            if annual_income <= scheme.income_ceiling_annual:
                passed_conditions.append(f"Annual family income ₹{annual_income:,.0f} is within ceiling of ₹{scheme.income_ceiling_annual:,.0f}")
            else:
                income_failed = True
                failed_conditions.append(f"Annual family income ₹{annual_income:,.0f} exceeds statutory ceiling of ₹{scheme.income_ceiling_annual:,.0f}")
        else:
            passed_conditions.append("No income ceiling requirement for this scheme (Universal ST coverage)")

        # Condition 4: Study Destination & Specific Scheme Constraints
        if scheme.id == 'nos_overseas':
            total_conditions += 2
            # Destination check
            if destination.lower() == 'abroad' or 'abroad' in education_level.lower():
                passed_conditions.append("Study destination is Abroad")
            else:
                failed_conditions.append("National Overseas Scholarship requires study destination to be Abroad")

            # Age check
            age_limit = 35
            if age is not None:
                if "master" in education_level.lower():
                    age_limit = 32
                elif "phd" in education_level.lower() or "doctor" in education_level.lower():
                    age_limit = 35
                elif "post-doc" in education_level.lower():
                    age_limit = 38
                
                if age <= age_limit:
                    passed_conditions.append(f"Age {age} is within limit of {age_limit} years for {education_level}")
                else:
                    failed_conditions.append(f"Age {age} exceeds age limit of {age_limit} years")
            else:
                passed_conditions.append("Age criteria verification pending")

            # Marks check with QS Top 1000 exception
            total_conditions += 1
            if is_qs_1000:
                passed_conditions.append("Minimum marks requirement waived due to admission in QS World Top 1000 university")
            elif marks is not None:
                if marks >= 55.0:
                    passed_conditions.append(f"Marks {marks}% satisfies minimum 55% requirement")
                else:
                    failed_conditions.append(f"Marks {marks}% is below the mandatory 55% requirement (unless QS Top 1000 admit)")
            else:
                failed_conditions.append("Minimum 55% marks or QS Top 1000 admit required")

        elif scheme.id == 'national_scholarship_top_class':
            total_conditions += 2
            if is_in_premier_institute:
                passed_conditions.append("Enrolled in a MoTA-notified Premier Institute (252 Notified Institutes)")
            else:
                failed_conditions.append("Requires confirmed admission in one of 252 MoTA-notified premier institutions (IITs, NITs, AIIMS, IIMs, etc.)")

            if quota.lower() == 'management':
                failed_conditions.append("Students admitted under private Management Quota are strictly excluded")
            else:
                passed_conditions.append("Regular merit/reservation admission quota verified")

        elif scheme.id == 'post_matric':
            total_conditions += 1
            if is_in_premier_institute and annual_income <= Decimal('600000'):
                failed_conditions.append("Students in 252 Premier Institutes must apply under National Top Class Scholarship instead")
            else:
                passed_conditions.append("Eligible for state-level Post-Matric financial assistance")

        elif scheme.id == 'nfst_fellowship':
            total_conditions += 2
            if age is not None:
                if age <= 36:
                    passed_conditions.append(f"Age {age} is within 36 years limit for NFST")
                else:
                    failed_conditions.append(f"Age {age} exceeds maximum age limit of 36 years")
            else:
                passed_conditions.append("Age criteria verification pending")

            if marks is not None:
                if marks >= 55.0:
                    passed_conditions.append(f"Post-Graduation marks {marks}% satisfies 55% eligibility threshold")
                else:
                    failed_conditions.append(f"Post-Graduation marks {marks}% is below the required 55%")
            else:
                passed_conditions.append("Post-Graduation marks verification pending")

        # Determine status
        match_fraction = len(passed_conditions) / max(total_conditions, 1)
        if len(failed_conditions) == 0:
            status = 'Eligible'
            badge_color = 'emerald'
        elif category != 'ST' or income_failed or not matched_level:
            status = 'Not Eligible'
            badge_color = 'rose'
        elif len(failed_conditions) == 1:
            status = 'Partially Eligible'
            badge_color = 'amber'
        else:
            status = 'Not Eligible'
            badge_color = 'rose'

        results.append({
            'scheme_id': scheme.id,
            'scheme_name': scheme.name,
            'authority': scheme.authority,
            'status': status,
            'badge_color': badge_color,
            'match_fraction': round(match_fraction, 2),
            'indicative_annual_benefit': float(scheme.indicative_annual_benefit),
            'benefit_summary': scheme.benefit_summary,
            'passed_conditions': passed_conditions,
            'failed_conditions': failed_conditions,
            'level': scheme.level,
            'income_ceiling': float(scheme.income_ceiling_annual) if scheme.income_ceiling_annual else None
        })

    # Multi-factor ranking:
    # 1. Eligible (0) > Partially Eligible (1) > Not Eligible (2)
    # 2. Match fraction desc
    # 3. Indicative annual benefit desc
    status_priority = {'Eligible': 0, 'Partially Eligible': 1, 'Not Eligible': 2}
    results.sort(key=lambda x: (
        status_priority.get(x['status'], 3),
        -x['match_fraction'],
        -x['indicative_annual_benefit']
    ))

    return results


def generate_deterministic_explanation(scheme_name, status, passed_conditions, failed_conditions, profile):
    """
    Generates structured, explainable decision narrative for the applicant.
    """
    edu = profile.get('education_level', 'current course')
    income = profile.get('annual_income', 0)
    
    if status == 'Eligible':
        return (
            f"You meet all statutory requirements for {scheme_name}. "
            f"Your education level ({edu}) and declared annual family income (₹{float(income):,.0f}) "
            f"align with the Ministry of Tribal Affairs guidelines. "
            f"All {len(passed_conditions)} criteria were successfully satisfied."
        )
    elif status == 'Partially Eligible':
        failing_reason = failed_conditions[0] if failed_conditions else "a minor criteria variance"
        return (
            f"You are partially eligible for {scheme_name}. "
            f"While you satisfy several baseline parameters, {failing_reason}. "
            f"Please review the required documentation or contact your institute nodal officer."
        )
    else:
        reasons = "; ".join(failed_conditions[:2]) if failed_conditions else "eligibility constraints"
        return (
            f"Based on statutory scheme guidelines, you are currently not eligible for {scheme_name} because {reasons}."
        )
