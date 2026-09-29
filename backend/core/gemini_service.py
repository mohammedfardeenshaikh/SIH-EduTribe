import json
import urllib.request
import urllib.error
import logging
import re
from decimal import Decimal
from django.conf import settings
from rules_engine.models import Scheme
from rules_engine.evaluator import evaluate_applicant_profile

logger = logging.getLogger(__name__)

GEMINI_EXTRACTION_PROMPT = """You are the NLU (Natural Language Understanding) component of EduTribe, the official Ministry of Tribal Affairs (MoTA) Scholarship & Fellowship Portal.

Analyze the user's message and recent conversation history:
1. Identify INTENT:
   - "internship_inquiry": If the user is asking about internships or jobs (EduTribe provides Scholarships and Fellowships, not general private internships).
   - "scheme_recommendation": User is asking which scholarships/fellowships they can get, or giving their education, income, and category.
   - "eligibility_check": User asks if they qualify for scholarships/fellowships.
   - "scheme_information": User asks about a specific scholarship/fellowship (e.g. "What is NFST?").
   - "required_documents": User asks what documents or certificates are needed.
   - "application_process": User asks how to apply or steps in the portal.
   - "application_status": User asks about application tracking or status stages.
   - "general_edutribe_help": Greetings, portal navigation, or other general inquiries.

2. EXTRACT APPLICANT ATTRIBUTES ONLY IF ACTUALLY PROVIDED:
   - "category": "ST", "SC", "OBC", "GEN" (or null if unmentioned).
   - "education_level": "Postgraduate", "Undergraduate", "Class 9-10", "Class 11-12", "M.Phil / Ph.D", "PhD", "Abroad Studies" (or null if unmentioned).
   - "annual_family_income": numeric income in INR (or null if unmentioned).
   - "institute_name": string (or null if unmentioned).
   - "study_destination": "India" | "Abroad" (or null if unmentioned).

OUTPUT JSON:
{
  "intent": string,
  "category": string | null,
  "education_level": string | null,
  "annual_family_income": number | null,
  "institute_name": string | null,
  "study_destination": string | null
}
"""

GEMINI_SYNTHESIS_PROMPT = """You are "EduTribe Assistant", the official digital helpdesk guide for the Ministry of Tribal Affairs (MoTA) Scholarship & Fellowship Portal (Government of India).

CRITICAL RULES:
1. SCOPE CLARITY:
   - EduTribe is the Government Portal for **Scheduled Tribe (ST) Scholarships and Research Fellowships**.
   - If the user asks about **internships**, clarify politely that EduTribe offers government educational scholarships and research fellowships (NFST, Top-Class, Post-Matric, NOS), and not general corporate internships, but guide them on how scholarships can support their studies.
   
2. ACCURATE ELIGIBILITY GUIDANCE:
   - NEVER assume the user is "Eligible" if they have not provided their basic education level and family income.
   - If essential information (education level, family income, ST category) is missing, politely ask the user to share these details so you can check matching schemes.
   - If official Recommendation Engine results are provided, explain the exact status (Eligible / Partially Eligible / Not Eligible) and criteria faithfully.

3. LANGUAGE:
   - If language is 'hi', explain in polite, natural Devanagari Hindi (हिंदी).
   - If language is 'en', explain in clear, supportive English.

4. FORMATTING:
   - Concise, bullet-pointed, friendly, and professional.
"""


def extract_user_intent_and_data(user_message, history=None, api_key='', model='gemini-1.5-flash'):
    """
    Step 1: Parse user intent and extract applicant parameters.
    """
    msg_lower = (user_message or '').lower()
    hist_text = " ".join([h.get('message', '') for h in (history or [])]).lower()
    combined_text = f"{hist_text} {msg_lower}"

    fallback_data = {
        "intent": "general_edutribe_help",
        "category": "ST" if ("st" in combined_text.split() or "tribal" in combined_text or "जनजातीय" in combined_text or "एसटी" in combined_text) else None,
        "education_level": None,
        "annual_family_income": None,
        "institute_name": None,
        "study_destination": "Abroad" if any(k in combined_text for k in ["abroad", "foreign", "विदेश", "overseas"]) else "India"
    }

    # Internship detection
    if any(k in msg_lower for k in ["internship", "intern", "इंटर्नशिप", "इंटर्न", "job", "नौकरी"]):
        fallback_data["intent"] = "internship_inquiry"

    # Income parsing: e.g. 3.5 lakh, 350000, 3,50,000, 300000
    income_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)', combined_text)
    if income_match:
        try:
            fallback_data["annual_family_income"] = float(income_match.group(1)) * 100000
        except Exception:
            pass
    elif re.search(r'(?:income\s*(?:is|of|=|:)?\s*)?(\d{5,8})', combined_text):
        m = re.search(r'(?:income\s*(?:is|of|=|:)?\s*)?(\d{5,8})', combined_text)
        try:
            val = float(m.group(1))
            if val >= 10000:  # Valid annual income range
                fallback_data["annual_family_income"] = val
        except Exception:
            pass

    # Education level parsing
    if any(k in combined_text for k in ["postgraduate", "post graduate", "post graduation", "post-graduation", "pg", "मास्टर्स", "पोस्टग्रेजुएट", "m.tech", "mba", "m.sc", "ma", "mca"]):
        fallback_data["education_level"] = "Postgraduate"
    elif any(k in combined_text for k in ["phd", "ph.d", "m.phil", "mphil", "fellowship", "डॉक्टरेट", "पीएचडी", "research scholar"]):
        fallback_data["education_level"] = "M.Phil / Ph.D"
    elif any(k in combined_text for k in ["undergraduate", "ug", "graduation", "graduate", "b.tech", "b.sc", "ba", "bcom", "bca", "स्नातक"]):
        fallback_data["education_level"] = "Undergraduate"
    elif any(k in combined_text for k in ["class 11", "class 12", "11th", "12th", "diploma", "iti"]):
        fallback_data["education_level"] = "Class 11-12 / Diploma"
    elif any(k in combined_text for k in ["class 9", "class 10", "9th", "10th"]):
        fallback_data["education_level"] = "Class 9-10"

    # Auto-infer recommendation intent if education and/or income were stated
    if fallback_data["education_level"] or fallback_data["annual_family_income"] is not None:
        if fallback_data["intent"] != "internship_inquiry":
            fallback_data["intent"] = "scheme_recommendation"


    # Intent heuristics
    if fallback_data["intent"] != "internship_inquiry":
        if any(k in msg_lower for k in ["eligible", "eligibility", "criteria", "पात्रता", "लायक", "scholarship", "scheme", "apply for"]):
            fallback_data["intent"] = "scheme_recommendation"
        elif any(k in msg_lower for k in ["doc", "दस्तावेज़", "certificate", "paper"]):
            fallback_data["intent"] = "required_documents"
        elif any(k in msg_lower for k in ["status", "track", "scrutiny", "stage", "स्थिति"]):
            fallback_data["intent"] = "application_status"
        elif any(k in msg_lower for k in ["how to apply", "process", "steps", "आवेदन कैसे"]):
            fallback_data["intent"] = "application_process"
        elif any(k in msg_lower for k in ["what is nfst", "what is top class", "about scheme", "योजना क्या है"]):
            fallback_data["intent"] = "scheme_information"

    if not api_key:
        return fallback_data

    # Send to Gemini for NLU extraction
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    history_ctx = "\n".join([f"{h.get('role', 'user')}: {h.get('message', '')}" for h in (history or [])[-3:]])
    prompt = f"{GEMINI_EXTRACTION_PROMPT}\n\nRecent History:\n{history_ctx}\n\nLatest User Message:\n\"{user_message}\"\n\nJSON Output:"

    request_data = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 300, "responseMimeType": "application/json"}
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(request_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            res = json.loads(response.read().decode('utf-8'))
            candidates = res.get('candidates', [])
            if candidates:
                raw_json = candidates[0].get('content', {}).get('parts', [])[0].get('text', '').strip()
                extracted = json.loads(raw_json)
                for k, v in extracted.items():
                    if v is not None:
                        fallback_data[k] = v
    except Exception as e:
        logger.warning(f"Gemini NLU extraction note: {e}")

    return fallback_data


def run_edutribe_recommendation_engine(applicant_data):
    """
    Step 2: Uses the official EduTribe Recommendation & Eligibility Rules Engine.
    Only called when the user actually provided sufficient parameters.
    """
    category = applicant_data.get('category') or 'ST'
    education_level = applicant_data.get('education_level') or 'Postgraduate'
    annual_income = applicant_data.get('annual_family_income') if applicant_data.get('annual_family_income') is not None else 0
    study_destination = applicant_data.get('study_destination') or 'India'
    institute_name = applicant_data.get('institute_name') or ''

    profile = {
        'category': category,
        'education_level': education_level,
        'annual_income': annual_income,
        'study_destination': study_destination,
        'institute_name': institute_name,
        'admission_quota': 'regular'
    }

    try:
        evaluation_results = evaluate_applicant_profile(profile)
    except Exception as e:
        logger.error(f"Error invoking evaluate_applicant_profile: {e}")
        schemes = Scheme.objects.all()
        evaluation_results = []
        for s in schemes:
            evaluation_results.append({
                'scheme_id': s.id,
                'scheme_name': s.name,
                'status': 'Eligible' if annual_income <= (s.income_ceiling_annual or 9999999) else 'Not Eligible',
                'passed_conditions': [f"Income criteria: ₹{annual_income:,.0f}"],
                'failed_conditions': [] if annual_income <= (s.income_ceiling_annual or 9999999) else ["Income exceeds ceiling"],
                'indicative_annual_benefit': float(s.indicative_annual_benefit),
                'benefit_summary': s.benefit_summary,
            })

    eligible_schemes = [s for s in evaluation_results if s.get('status') == 'Eligible']
    partially_eligible_schemes = [s for s in evaluation_results if s.get('status') == 'Partially Eligible']
    not_eligible_schemes = [s for s in evaluation_results if s.get('status') == 'Not Eligible']

    if eligible_schemes:
        engine_status = "eligible"
    elif partially_eligible_schemes:
        engine_status = "partially_eligible"
    else:
        engine_status = "not_eligible"

    return {
        "engine_status": engine_status,
        "profile_evaluated": profile,
        "eligible_schemes": eligible_schemes,
        "partially_eligible_schemes": partially_eligible_schemes,
        "not_eligible_schemes": not_eligible_schemes,
        "total_schemes_checked": len(evaluation_results)
    }


def is_hindi(text):
    """
    Detect if text is Devanagari Hindi or Romanized Hindi / Hinglish.
    """
    if not text:
        return False
    # Check for Devanagari characters
    if re.search(r'[\u0900-\u097F]', text):
        return True
    # Common Hinglish tokens and strong Hindi question markers
    hindi_tokens = {
        'meri', 'mera', 'mere', 'mujhe', 'hum', 'kya', 'hai', 'hain', 'ho', 'kaise', 'karo', 'kare', 'karein',
        'chhatravritti', 'scholarship', 'yojana', 'patrata', 'aavedan', 'padhai', 'batao', 'bataiye',
        'milega', 'milenge', 'kab', 'kaun', 'kitna', 'kitni', 'lakh', 'chahiye', 'bharo', 'bhardu',
        'namaste', 'namaskar', 'pranam', 'dost', 'sahayata', 'dastavez', 'kagaz', 'suchi'
    }
    words = set(re.findall(r'[a-zA-Z]+', text.lower()))
    matches = words.intersection(hindi_tokens)
    strong_markers = {'kya', 'kaise', 'chahiye', 'milega', 'milenge', 'batao', 'bataiye', 'patrata', 'yojana', 'aavedan', 'meri', 'mera', 'mujhe', 'chhatravritti', 'dastavez'}
    if len(matches) >= 2 or any(m in words for m in strong_markers):
        return True
    return False


def generate_gemini_response(user_message, language='en', context=None, history=None):
    """
    Main Orchestrator:
    USER -> GEMINI NLU -> RECOMMENDATION ENGINE (if valid profile) -> GEMINI SYNTHESIS -> USER
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
    api_key = api_key.strip("'\"")
    model = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash') or 'gemini-2.5-flash'

    # Strict language determination:
    # If portal/caller set 'hi', OR if user asked in Devanagari/Hinglish, enforce Hindi
    eff_language = 'hi' if (language == 'hi' or is_hindi(user_message)) else 'en'

    # Step 1: Extract Intent & Structured Applicant Data
    extracted = extract_user_intent_and_data(user_message, history, api_key, model)
    intent = extracted.get('intent', 'general_edutribe_help')

    # Has the user actually provided any profile specifics?
    has_profile_details = bool(extracted.get('education_level') or extracted.get('annual_family_income') is not None)

    # Step 2: Only run Recommendation Engine if intent is recommendation AND details were provided
    engine_result = None
    if has_profile_details and intent in ['scheme_recommendation', 'eligibility_check']:
        engine_result = run_edutribe_recommendation_engine(extracted)

    # Step 3: Format Synthesis Payload for Gemini
    engine_summary = ""
    if engine_result:
        engine_summary = f"""
[OFFICIAL EDUTRIBE RECOMMENDATION ENGINE RESULT]:
Overall Decision Status: {engine_result['engine_status'].upper()}
Profile Evaluated: {json.dumps(engine_result['profile_evaluated'])}

Eligible Schemes ({len(engine_result['eligible_schemes'])}):
{json.dumps([{ 'name': s['scheme_name'], 'benefits': s['benefit_summary'], 'passed': s['passed_conditions'] } for s in engine_result['eligible_schemes']], ensure_ascii=False)}

Partially Eligible Schemes ({len(engine_result['partially_eligible_schemes'])}):
{json.dumps([{ 'name': s['scheme_name'], 'passed': s['passed_conditions'], 'pending_or_failed': s['failed_conditions'] } for s in engine_result['partially_eligible_schemes']], ensure_ascii=False)}
"""

    context_str = ""
    if context and isinstance(context, dict):
        context_str = f"\n[Active Portal Page: {context.get('page_title', 'EduTribe Portal')}]"

    if eff_language == 'hi':
        lang_inst = (
            "CRITICAL MANDATORY INSTRUCTION: You MUST respond ENTIRELY in natural, polite Devanagari Hindi (हिंदी). "
            "DO NOT write your answer in English. All explanations, bullet points, scheme names, and greetings must be in Hindi (Devanagari script)."
        )
    else:
        lang_inst = "Answer in clear, polite, and helpful English."

    synthesis_prompt = f"""{GEMINI_SYNTHESIS_PROMPT}

PORTAL SCOPE & SCHEMES (Ministry of Tribal Affairs):
• EduTribe provides government educational scholarships and research fellowships for Scheduled Tribe (ST) students. It does NOT provide general corporate/private internships.
• Pre-Matric ST Scholarship: Classes 9 & 10, income ceiling ₹2.5 Lakh/yr.
• Post-Matric ST Scholarship: Classes 11-12, ITI, Diploma, UG, PG, income ceiling ₹2.5 Lakh/yr.
• National Top-Class Education Scheme: 252 premier institutes (IITs, NITs, IIMs, AIIMS, NLUs), income ceiling ₹6.0 Lakh/yr. Full tuition + ₹3,000/mo + ₹45,000 computer grant.
• National Fellowship for ST (NFST): Regular M.Phil & Ph.D. scholars in Indian universities. NO income ceiling! ₹35,000/mo to ₹38,000/mo + contingency grant.
• National Overseas Scholarship (NOS): Master's & Ph.D abroad in QS Top 1000 universities. Income ceiling ₹6.0 Lakh/yr.

{context_str}
{engine_summary}

User's Detected Intent: {intent}
User's Question: "{user_message}"
Language Requirement: {lang_inst}

Please answer the user's specific question directly and accurately."""

    # Step 4: Send to Gemini for synthesis (with snappy fallback)
    candidate_models = [model, 'gemini-flash-latest']
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    for target_model in models_to_try:
        if api_key and api_key != 'your_gemini_api_key_here':
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
            request_data = {
                "contents": [{"role": "user", "parts": [{"text": synthesis_prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800, "topP": 0.85}
            }
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(request_data).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=3) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    candidates = result.get('candidates', [])
                    if candidates:
                        parts = candidates[0].get('content', {}).get('parts', [])
                        if parts:
                            text = parts[0].get('text', '').strip()
                            if text:
                                return text
            except Exception as e:
                logger.warning(f"Gemini synthesis note ({target_model}): {e}")
                continue

    # Fallback response if external API is temporarily rate-limited
    return direct_fallback_response(user_message, eff_language, intent, extracted, engine_result)


def direct_fallback_response(user_message, language, intent, extracted, engine_result):
    """
    Direct, accurate fallback matching the user's exact query type.
    """
    is_hi = (language == 'hi')

    if intent == 'internship_inquiry':
        if is_hi:
            return (
                "ℹ️ **EduTribe पोर्टल सहायता:**\n\n"
                "EduTribe जनजातीय कार्य मंत्रालय (MoTA) का आधिकारिक **छात्रवृत्ति और फेलोशिप पोर्टल** है। यह कॉर्पोरेट/प्राइवेट इंटर्नशिप प्रदान नहीं करता है।\n\n"
                "हालाँकि, यदि आप अध्ययन या शोध कर रहे हैं, तो आप निम्नलिखित सरकारी योजनाओं के लिए पात्र हो सकते हैं:\n"
                "• **पोस्ट-मैट्रिक छात्रवृत्ति:** कॉलेज और उच्च शिक्षा हेतु\n"
                "• **टॉप क्लास छात्रवृत्ति:** IIT, NIT, IIM आदि शीर्ष संस्थानों हेतु\n"
                "• **NFST फेलोशिप:** M.Phil / Ph.D शोधार्थियों हेतु (₹35,000–₹38,000/माह)\n\n"
                "पात्रता जाँचने के लिए कृपया अपनी कक्षा/कोर्स और वार्षिक पारिवारिक आय साझा करें।"
            )
        else:
            return (
                "ℹ️ **EduTribe Portal Clarification:**\n\n"
                "EduTribe is the official Ministry of Tribal Affairs (MoTA) portal for **Educational Scholarships and Research Fellowships**. We do not provide corporate or private internships.\n\n"
                "However, if you are an enrolled student or researcher, you can apply for government financial assistance such as:\n"
                "• **Post-Matric ST Scholarship:** For Undergraduate & Postgraduate studies\n"
                "• **Top-Class Education Scheme:** For premier institutes (IITs, NITs, IIMs, AIIMS)\n"
                "• **National Fellowship (NFST):** For M.Phil / Ph.D research scholars (₹35,000–₹38,000/mo)\n\n"
                "To check which scholarships you qualify for, please share your education level and annual family income."
            )

    if intent in ['scheme_recommendation', 'eligibility_check'] or engine_result:
        if engine_result:
            status = engine_result.get('engine_status')
            eligible = engine_result.get('eligible_schemes', [])
            partial = engine_result.get('partially_eligible_schemes', [])
            not_elig = engine_result.get('not_eligible_schemes', [])

            if status == 'eligible' and eligible:
                top = eligible[0]
                if is_hi:
                    return (
                        f"EduTribe अनुशंसा इंजन के अनुसार, आप **{top['scheme_name']}** के लिए **पात्र (Eligible)** हैं!\n\n"
                        f"**पात्रता कारण:**\n" + "\n".join([f"• {c}" for c in top['passed_conditions'][:3]]) +
                        f"\n\n**लाभ:** {top['benefit_summary']}\n\n"
                        f"👉 आवेदन के लिए **Eligibility Portal** देखें।"
                    )
                else:
                    return (
                        f"Based on the EduTribe Recommendation Engine, you are **Eligible** for:\n\n"
                        f"✓ **{top['scheme_name']}**\n\n"
                        f"**Why You Qualify:**\n" + "\n".join([f"• {c}" for c in top['passed_conditions'][:3]]) +
                        f"\n\n**Benefits:** {top['benefit_summary']}\n\n"
                        f"👉 Visit the **Eligibility Checker** tab to submit your application."
                    )

            elif partial:
                p = partial[0]
                if is_hi:
                    return (
                        f"EduTribe अनुशंसा इंजन के अनुसार आप **{p['scheme_name']}** के लिए **आंशिक रूप से पात्र (Partially Eligible)** हैं।\n\n"
                        f"**सत्यापित मानदंड:**\n" + "\n".join([f"• {c}" for c in p['passed_conditions'][:2]]) +
                        f"\n\n**सत्यापन योग्य आवश्यकता:**\n" + "\n".join([f"• {c}" for c in p['failed_conditions'][:2]]) +
                        f"\n\n👉 पूर्ण विवरण के लिए **Eligibility Portal** देखें।"
                    )
                else:
                    return (
                        f"Based on the EduTribe Recommendation Engine, you are **Partially Eligible** for **{p['scheme_name']}**.\n\n"
                        f"**Verified Criteria:**\n" + "\n".join([f"• {c}" for c in p['passed_conditions'][:2]]) +
                        f"\n\n**Pending / Unverified:**\n" + "\n".join([f"• {c}" for c in p['failed_conditions'][:2]]) +
                        f"\n\n👉 Review the **Eligibility Checker** tab to complete verification."
                    )
            elif not_elig:
                if is_hi:
                    return (
                        "आपके द्वारा दिए गए विवरण के आधार पर, जाँची गई MoTA योजनाओं की आय या शैक्षणिक सीमाएँ पूरी नहीं होती हैं।\n\n"
                        "आप विस्तृत नियमों हेतु **Eligibility Portal** देख सकते हैं।"
                    )
                else:
                    return (
                        "Based on the provided details, your income or course level does not match the statutory criteria for the checked MoTA schemes.\n\n"
                        "You can review the **Eligibility Portal** for alternative options."
                    )

        if not extracted.get('education_level') and extracted.get('annual_family_income') is None:
            if is_hi:
                return (
                    "आपकी छात्रवृत्ति पात्रता की सही जाँच करने के लिए, कृपया निम्नलिखित 2 विवरण साझा करें:\n\n"
                    "1. **आपकी वर्तमान कक्षा या डिग्री** (उदा. 11वीं-12वीं, ग्रेजुएशन, पोस्टग्रेजुएशन, या Ph.D)\n"
                    "2. **आपकी वार्षिक पारिवारिक आय** (उदा. ₹2.5 लाख, ₹3 लाख आदि)\n\n"
                    "यह विवरण मिलने पर EduTribe अनुशंसा इंजन आपके लिए उपयुक्त MoTA योजनाओं की सूची प्रदान करेगा।"
                )
            else:
                return (
                    "To accurately check your scholarship and fellowship eligibility, please share:\n\n"
                    "1. **Your Current Education Level / Degree** (e.g. Class 11-12, UG, PG, or Ph.D)\n"
                    "2. **Your Annual Family Income** (e.g. ₹2.5 Lakh, ₹3 Lakh, etc.)\n\n"
                    "Once you provide these details, the EduTribe Recommendation Engine will check which MoTA schemes you qualify for."
                )


    if is_hi:
        return (
            f"आपके प्रश्न \"{user_message}\" के संबंध में:\n\n"
            "EduTribe पोर्टल जनजातीय कार्य मंत्रालय (MoTA) की छात्रवृत्तियों, पात्रता नियमों, आवश्यक दस्तावेजों और आवेदन स्थिति की जानकारी प्रदान करता है।\n\n"
            "कृपया अपनी कक्षा और पारिवारिक आय साझा करें ताकि हम आपकी पात्रता का सही मूल्यांकन कर सकें।"
        )
    else:
        return (
            f"Regarding your inquiry \"{user_message}\":\n\n"
            "EduTribe helps Scheduled Tribe (ST) students with government scholarships, fellowships, required documents, and application tracking.\n\n"
            "Please share your degree/course and annual family income to check which schemes match your profile."
        )
