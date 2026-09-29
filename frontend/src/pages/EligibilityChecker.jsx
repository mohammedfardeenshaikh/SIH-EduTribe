import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import sampleProfiles from '../data/sampleProfiles';

const EDUCATION_LEVELS = [
  'Class IX',
  'Class X',
  'Class XI',
  'Class XII',
  'Diploma',
  'ITI/Vocational',
  'Graduate',
  'Post-Graduate',
  'MPhil',
  'PhD',
  "Master's (abroad)",
  "PhD (abroad)",
  "Post-Doctoral (abroad)",
];

const STATUS_CONFIG = {
  Eligible: { icon: '✅', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  'Partially Eligible': { icon: '⚠️', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  'Not Eligible': { icon: '❌', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800' },
};

const EDUCATION_LEVELS_HI = {
  'Class IX': 'कक्षा 9वीं',
  'Class X': 'कक्षा 10वीं',
  'Class XI': 'कक्षा 11वीं',
  'Class XII': 'कक्षा 12वीं',
  'Diploma': 'डिप्लोमा / पॉलिटेक्निक',
  'ITI/Vocational': 'आईटीआई / व्यावसायिक',
  'Graduate': 'स्नातक',
  'Post-Graduate': 'स्नातकोत्तर',
  'Post Graduation': 'स्नातकोत्तर',
  'MPhil': 'एम.फिल',
  'PhD': 'पीएच.डी',
  "Master's (abroad)": 'मास्टर्स (विदेश)',
  "PhD (abroad)": 'पीएच.डी (विदेश)',
  "Post-Doctoral (abroad)": 'पोस्ट-डॉक्टरल (विदेश)',
};

function translateCondition(cond, language) {
  if (language !== 'hi' || !cond) return cond;
  
  if (cond.includes('Category is Scheduled Tribe')) {
    return 'श्रेणी अनुसूचित जनजाति (ST) है';
  }
  if (cond.includes('within the ceiling of')) {
    return cond.replace(/Declared annual income (₹[\d,]+) is within the ceiling of (₹[\d,]+)/i, 'घोषित वार्षिक पारिवारिक आय $1 अधिकतम सीमा $2 के अंतर्गत है');
  }
  if (cond.includes('exceeds the statutory ceiling of')) {
    return cond.replace(/Annual family income (₹[\d,]+) exceeds the statutory ceiling of (₹[\d,]+)/i, 'वार्षिक पारिवारिक आय $1 वैधानिक सीमा $2 से अधिक है');
  }
  if (cond.includes('matches scheme target levels')) {
    const match = cond.match(/Course level (.*) matches scheme target levels/i);
    const lvl = match && match[1] ? (EDUCATION_LEVELS_HI[match[1]] || match[1]) : '';
    return `पाठ्यक्रम स्तर (${lvl}) योजना के लक्षित स्तरों के अनुरूप है`;
  }
  if (cond.includes('does not match scheme target levels')) {
    const match = cond.match(/Course level (.*) does not match scheme target levels/i);
    const lvl = match && match[1] ? (EDUCATION_LEVELS_HI[match[1]] || match[1]) : '';
    return `पाठ्यक्रम स्तर (${lvl}) योजना के लक्षित स्तरों से मेल नहीं खाता`;
  }
  if (cond.includes('Admission verified in Top Class Notified Institute')) {
    return cond.replace(/Admission verified in Top Class Notified Institute: (.*)/i, 'टॉप क्लास अधिसूचित संस्थान में प्रवेश सत्यापित: $1');
  }
  if (cond.includes('Institute is not in the MoTA 252 Premier Institutes list')) {
    return 'संस्थान जनजातीय कार्य मंत्रालय के 252 प्रमुख अधिसूचित संस्थानों की सूची में नहीं है';
  }
  if (cond.includes('Study destination is Abroad')) {
    return 'अध्ययन गंतव्य विदेश है (एनओएस योजना हेतु अनिवार्य)';
  }
  if (cond.includes('Study destination is India')) {
    return 'अध्ययन गंतव्य भारत है';
  }
  if (cond.includes('satisfies') && cond.includes('threshold')) {
    return cond.replace(/Marks percentage ([\d.]+)% satisfies ([\d.]+)% threshold/i, 'प्राप्तांक $1% आवश्यक न्यूनतम $2% मानदंड को पूरा करते हैं');
  }
  if (cond.includes('is below required')) {
    return cond.replace(/Marks percentage ([\d.]+)% is below required ([\d.]+)%/i, 'प्राप्तांक $1% आवश्यक $2% से कम हैं');
  }
  return cond;
}

function translateBenefitSummary(summary, language) {
  if (language !== 'hi' || !summary) return summary;
  
  if (summary.includes('Full tuition/admission fee') || summary.includes('computer grant')) {
    return 'पूर्ण शिक्षण/प्रवेश शुल्क (निजी संस्थानों हेतु ₹2.5 लाख/वर्ष सीमा) + ₹3000/माह निर्वाह भत्ता + ₹5000/वर्ष पुस्तकें + ₹45000 एकमुश्त कंप्यूटर अनुदान';
  }
  if (summary.includes('Fellowship') || summary.includes('Contingency') || summary.includes('MPhil / PhD')) {
    return '₹35,000/माह अध्येतावृत्ति (जेआरएफ) / ₹38,000/माह (एसआरएफ) + ₹10,000/वर्ष आकस्मिकता अनुदान (एम.फिल/पीएच.डी शोधार्थियों हेतु)';
  }
  if (summary.includes('Day Scholars') || summary.includes('Pre-Matric')) {
    return 'डे-स्कॉलर्स हेतु ₹225/माह + ₹750/वर्ष अनुदान | हॉस्टलर्स हेतु ₹525/माह + ₹1000/वर्ष अनुदान';
  }
  if (summary.includes('Post-Matric') || summary.includes('Maintenance allowance') || summary.includes('Group 1-4')) {
    return 'पाठ्यक्रम समूह अनुसार ₹230 से ₹1200/माह निर्वाह भत्ता + अनिवार्य गैर-वापसी योग्य शिक्षण शुल्क प्रतिपूर्ति';
  }
  if (summary.includes('Overseas') || summary.includes('foreign tuition') || summary.includes('15,400')) {
    return 'पूर्ण विदेशी शिक्षण शुल्क + $15,400/वर्ष (यूएस) या £9,900/वर्ष (यूके) निर्वाह भत्ता + वीजा एवं हवाई यात्रा व्यय';
  }
  return summary;
}

function translateAuthority(authority, language) {
  if (language !== 'hi' || !authority) return authority;
  if (authority.includes('Central Sector')) {
    return 'जनजातीय कार्य मंत्रालय (केंद्रीय क्षेत्र योजना)';
  }
  if (authority.includes('Centrally Sponsored')) {
    return 'जनजातीय कार्य मंत्रालय एवं राज्य सरकार (केंद्र प्रायोजित)';
  }
  if (authority.includes('Ministry of Tribal Affairs')) {
    return 'जनजातीय कार्य मंत्रालय, भारत सरकार';
  }
  return authority;
}

function getDynamicRecommendation(scheme, profile, rawAiExplanation, language) {
  const eduEn = profile?.educationLevel || profile?.education_level || 'Post-Graduate';
  const edu = language === 'hi' ? (EDUCATION_LEVELS_HI[eduEn] || eduEn) : eduEn;
  const incomeNum = Number(profile?.income || profile?.annual_income || 300000);
  const formattedIncome = `₹${incomeNum.toLocaleString('en-IN')}`;
  const passedCount = scheme.passed_conditions?.length || 4;
  const schemeName = scheme.scheme_name || scheme.scheme?.name || 'National Scholarship';

  if (language === 'hi') {
    const isEligible = scheme.status === 'Eligible' || scheme.status === 'ELIGIBLE';
    const isPartial = scheme.status === 'Partially Eligible' || scheme.status === 'PARTIALLY_ELIGIBLE';

    if (isEligible) {
      return `आप ${schemeName} के लिए सभी वैधानिक आवश्यकताओं को पूरा करते हैं। आपका शैक्षणिक स्तर (${edu}) और घोषित वार्षिक पारिवारिक आय (${formattedIncome}) जनजातीय कार्य मंत्रालय के दिशानिर्देशों के पूर्णतः अनुरूप है। सभी ${passedCount} पात्रता शर्तें सफलतापूर्वक संतुष्ट पाई गईं।`;
    } else if (isPartial) {
      const failingReason = scheme.failed_conditions?.[0]
        ? translateCondition(scheme.failed_conditions[0], 'hi')
        : 'कुछ अतिरिक्त सत्यापन शर्तें अपेक्षित हैं';
      return `आप ${schemeName} के लिए आंशिक रूप से पात्र हैं। यद्यपि आप अधिकांश बुनियादी मापदंडों को पूरा करते हैं, किंतु ${failingReason}। कृपया आवश्यक दस्तावेजों की जाँच करें या अपने संस्थान के नोडल अधिकारी से संपर्क करें।`;
    } else {
      const reasons = scheme.failed_conditions && scheme.failed_conditions.length > 0
        ? scheme.failed_conditions.slice(0, 2).map(c => translateCondition(c, 'hi')).join('; ')
        : 'पात्रता मापदंड पूर्ण नहीं हैं';
      return `वैधानिक योजना दिशानिर्देशों के आधार पर, आप वर्तमान में ${schemeName} के लिए पात्र नहीं हैं क्योंकि ${reasons}।`;
    }
  }

  // English recommendation
  if (rawAiExplanation) return rawAiExplanation;

  if (scheme.status === 'Eligible' || scheme.status === 'ELIGIBLE') {
    return `You meet all statutory requirements for ${schemeName}. Your education level (${edu}) and declared annual family income (${formattedIncome}) align with the Ministry of Tribal Affairs guidelines. All ${passedCount} criteria were successfully satisfied.`;
  } else if (scheme.status === 'Partially Eligible' || scheme.status === 'PARTIALLY_ELIGIBLE') {
    const failingReason = scheme.failed_conditions?.[0] || 'a minor criteria variance';
    return `You are partially eligible for ${schemeName}. While you satisfy several baseline parameters, ${failingReason}. Please review the required documentation or contact your institute nodal officer.`;
  } else {
    const reasons = scheme.failed_conditions && scheme.failed_conditions.length > 0
      ? scheme.failed_conditions.slice(0, 2).join('; ')
      : 'eligibility constraints';
    return `Based on statutory scheme guidelines, you are currently not eligible for ${schemeName} because ${reasons}.`;
  }
}

export default function EligibilityChecker() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    educationLevel: '',
    income: '',
    age: '',
    instituteId: null,
    instituteName: '',
    studyDestination: 'India',
    marksPercent: '',
    isQsTop1000: false,
    admissionQuota: 'regular',
  });

  const [results, setResults] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [loadingAI, setLoadingAI] = useState({});
  const [expandedRules, setExpandedRules] = useState({});
  const [instituteSearch, setInstituteSearch] = useState('');
  const [institutesList, setInstitutesList] = useState([]);
  const [showInstituteDropdown, setShowInstituteDropdown] = useState(false);
  const [applyingScheme, setApplyingScheme] = useState(null);

  useEffect(() => {
    if (instituteSearch.trim().length >= 2) {
      const timer = setTimeout(() => {
        api.get(`/institutes/?q=${encodeURIComponent(instituteSearch)}`)
          .then(res => setInstitutesList(res.data))
          .catch(() => setInstitutesList([]));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setInstitutesList([]);
    }
  }, [instituteSearch]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSampleProfile(profileId) {
    if (!profileId) return;
    const profile = sampleProfiles.find(p => p.id === Number(profileId));
    if (profile) {
      setForm({
        educationLevel: profile.educationLevel,
        income: profile.income.toString(),
        age: profile.age.toString(),
        instituteId: null,
        instituteName: profile.institute || '',
        studyDestination: profile.studyDestination || 'India',
        marksPercent: profile.marksPercent ? profile.marksPercent.toString() : '',
        isQsTop1000: false,
        admissionQuota: 'regular',
      });
      setInstituteSearch(profile.institute || '');
      setResults(null);
      setExplanations({});
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEvaluating(true);
    setResults(null);
    setExplanations({});

    const payload = {
      category: 'ST',
      education_level: form.educationLevel,
      annual_income: Number(form.income) || 0,
      age: Number(form.age) || null,
      marks_percent: form.marksPercent ? Number(form.marksPercent) : null,
      study_destination: form.studyDestination,
      institute_id: form.instituteId,
      institute_name: form.instituteName,
      admission_quota: form.admissionQuota,
      is_qs_top_1000: form.isQsTop1000,
    };

    try {
      const response = await api.post('/eligibility/evaluate/', payload);
      setResults(response.data);

      // Auto-fetch explanation for the top matched schemes
      response.data.schemes.forEach((res) => {
        fetchExplanation(res, payload);
      });
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  }

  async function fetchExplanation(schemeResult, profilePayload) {
    setLoadingAI(prev => ({ ...prev, [schemeResult.scheme_id]: true }));
    try {
      const res = await api.post('/ai/explain/', {
        scheme_id: schemeResult.scheme_id,
        profile: profilePayload || {
          education_level: form.educationLevel,
          annual_income: Number(form.income) || 0,
        },
        evaluation_result: schemeResult
      });
      setExplanations(prev => ({ ...prev, [schemeResult.scheme_id]: res.data.explanation }));
    } catch (err) {
      console.error('Explanation error:', err);
    } finally {
      setLoadingAI(prev => ({ ...prev, [schemeResult.scheme_id]: false }));
    }
  }

  function selectInstitute(inst) {
    setForm(prev => ({
      ...prev,
      instituteId: inst.id,
      instituteName: inst.name,
    }));
    setInstituteSearch(inst.name);
    setShowInstituteDropdown(false);
  }

  function clearInstitute() {
    setForm(prev => ({ ...prev, instituteId: null, instituteName: '' }));
    setInstituteSearch('');
  }

  async function handleApplyNow(scheme) {
    if (!user) {
      navigate('/login');
      return;
    }
    setApplyingScheme(scheme.scheme_id);
    try {
      const payload = {
        scheme_id: scheme.scheme_id,
        scheme_name: scheme.scheme_name,
        institute: form.instituteId,
        declared_income: Number(form.income) || 0,
        education_level: form.educationLevel,
        age: Number(form.age) || null,
        marks_percent: form.marksPercent ? Number(form.marksPercent) : null,
        study_destination: form.studyDestination,
        state: 'Jharkhand',
      };
      const res = await api.post('/applications/', payload);
      navigate('/applicant', { state: { highlightAppId: res.data.id } });
    } catch (err) {
      console.error('Failed to create application:', err);
      navigate('/applicant');
    } finally {
      setApplyingScheme(null);
    }
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${language === 'hi' ? 'font-devanagari' : ''}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">
          {t('evaluation.pageTitle', 'MoTA Scholarship Eligibility Evaluator')}
        </h1>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {t('evaluation.pageSubtitle', 'Instant multi-factor evaluation engine matching your profile against official Ministry of Tribal Affairs schemes.')}
        </p>
      </div>

      {/* Demo sample profile loader */}
      <div className="mb-6 p-4 bg-slate-50 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t('evaluation.demoQuickLoad', 'Demo Quick Load')}
            </span>
            <p className="text-xs text-gray-500">
              {t('evaluation.demoQuickLoadSub', 'Select standard test cases to verify rules engine calculations')}
            </p>
          </div>
          <select
            onChange={e => handleSampleProfile(e.target.value)}
            className="border border-gray-300 px-3 py-1.5 text-xs bg-white text-gray-800 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            defaultValue=""
          >
            <option value="">{t('evaluation.selectSampleProfile', '— Select a sample profile —')}</option>
            {sampleProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 shadow-sm mb-8">
        <h2 className="text-sm font-bold text-navy-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
          {t('evaluation.applicantProfileDetails', 'Applicant Profile Details')}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.educationLevel', 'Education Level *')}
            </label>
            <select
              value={form.educationLevel}
              onChange={e => handleChange('educationLevel', e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="">{t('evaluation.selectCurrentLevel', 'Select current level')}</option>
              {EDUCATION_LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.annualIncome', 'Annual Family Income (₹) *')}
            </label>
            <input
              type="number"
              value={form.income}
              onChange={e => handleChange('income', e.target.value)}
              required
              min="0"
              placeholder="e.g. 250000"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.ageYears', 'Age (Years) *')}
            </label>
            <input
              type="number"
              value={form.age}
              onChange={e => handleChange('age', e.target.value)}
              required
              min="5"
              max="70"
              placeholder="e.g. 21"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.marksPercent', 'Marks / Aggregate (%)')}
            </label>
            <input
              type="number"
              step="0.1"
              value={form.marksPercent}
              onChange={e => handleChange('marksPercent', e.target.value)}
              min="0"
              max="100"
              placeholder="e.g. 78.5"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.studyDestination', 'Study Destination')}
            </label>
            <select
              value={form.studyDestination}
              onChange={e => handleChange('studyDestination', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="India">{t('evaluation.india', 'India')}</option>
              <option value="Abroad">{t('evaluation.abroad', 'Abroad (Overseas)')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('evaluation.admissionQuota', 'Admission Quota')}
            </label>
            <select
              value={form.admissionQuota}
              onChange={e => handleChange('admissionQuota', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="regular">{t('evaluation.regularQuota', 'Merit / State Reservation (Regular)')}</option>
              <option value="management">{t('evaluation.managementQuota', 'Private Management Quota')}</option>
            </select>
          </div>
        </div>

        {/* Premier Institute Search */}
        <div className="relative mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('evaluation.enrolledInstitute', 'Enrolled Institute (Check 252 Premier Institutes for Top Class)')}
          </label>
          <div className="flex">
            <input
              type="text"
              value={instituteSearch}
              onChange={e => {
                setInstituteSearch(e.target.value);
                setShowInstituteDropdown(true);
              }}
              onFocus={() => setShowInstituteDropdown(true)}
              placeholder={t('evaluation.typeToSearchInstitute', 'Type to search institute name (e.g. IIT Delhi, AIIMS, NIT, NLU...)')}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
            />
            {form.instituteName && (
              <button
                type="button"
                onClick={clearInstitute}
                className="px-3 bg-gray-100 hover:bg-gray-200 border-t border-b border-r border-gray-300 text-xs font-semibold text-gray-600 cursor-pointer"
              >
                {t('evaluation.clear', 'Clear')}
              </button>
            )}
          </div>

          {showInstituteDropdown && institutesList.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-300 shadow-lg max-h-56 overflow-y-auto mt-1">
              {institutesList.map(inst => (
                <div
                  key={inst.id}
                  onClick={() => selectInstitute(inst)}
                  className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-semibold text-navy-800">{inst.name}</p>
                  <p className="text-gray-500">{inst.location}, {inst.state} • {inst.course}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overseas options */}
        {form.studyDestination === 'Abroad' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 flex items-center gap-2">
            <input
              type="checkbox"
              id="qsTop"
              checked={form.isQsTop1000}
              onChange={e => setForm(prev => ({ ...prev, isQsTop1000: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="qsTop" className="text-xs text-navy-900 font-medium cursor-pointer">
              {t('evaluation.qsTop1000Label', 'Applicant has secured admission in a QS World Top 1000 ranked foreign university (Waives 55% marks criteria)')}
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={evaluating}
          className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {evaluating
            ? t('evaluation.evaluatingSchemesBtn', 'Evaluating Schemes...')
            : t('evaluation.checkAllSchemesBtn', 'Check All 5 Scholarship Schemes')}
        </button>
      </form>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          <div className="bg-navy-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg shadow-sm">
            <div>
              <h2 className="text-base font-bold">
                {t('evaluation.summaryTitle', 'Eligibility Evaluation Summary')}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {t('evaluation.summarySubtitle', 'Multi-factor evaluation completed. Ranked by statutory status, criteria match rate, and financial benefit.')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="bg-emerald-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded">
                {results.eligible_count} {t('evaluation.eligible', 'Eligible')}
              </span>
              <span className="bg-amber-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded">
                {results.partially_eligible_count} {t('evaluation.partiallyEligible', 'Partially Eligible')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {results.schemes.map((scheme) => {
              const cfg = STATUS_CONFIG[scheme.status] || STATUS_CONFIG['Not Eligible'];
              const isExpanded = expandedRules[scheme.scheme_id];
              const aiExplanation = explanations[scheme.scheme_id];
              const isAiLoading = loadingAI[scheme.scheme_id];

              const statusLabel =
                scheme.status === 'Eligible'
                  ? t('evaluation.eligible', 'Eligible')
                  : scheme.status === 'Partially Eligible'
                  ? t('evaluation.partiallyEligible', 'Partially Eligible')
                  : t('evaluation.notEligible', 'Not Eligible');

              const dynamicRecommendation = getDynamicRecommendation(
                scheme,
                form,
                aiExplanation,
                language
              );

              return (
                <div
                  key={scheme.scheme_id}
                  className={`border ${cfg.border} ${cfg.bg} p-5 transition-all shadow-sm rounded-xl`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{cfg.icon}</span>
                        <h3 className="text-base font-bold text-navy-900">{scheme.scheme_name}</h3>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {t('evaluation.administeredBy', 'Administered by')}: <span className="text-navy-800 font-semibold">{translateAuthority(scheme.authority, language)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${cfg.badge}`}>
                        {statusLabel}
                      </span>
                      {scheme.status === 'Eligible' && (
                        <button
                          onClick={() => handleApplyNow(scheme)}
                          disabled={applyingScheme === scheme.scheme_id}
                          className="px-4 py-1.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold transition-colors disabled:opacity-50 rounded cursor-pointer shadow-xs"
                        >
                          {applyingScheme === scheme.scheme_id
                            ? t('evaluation.initiating', 'Initiating...')
                            : t('evaluation.applyNow', 'Apply Now →')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial assistance summary */}
                  <div className="grid sm:grid-cols-2 gap-3 my-3 text-xs bg-white/75 p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="text-gray-500 font-medium block">{t('evaluation.financialBenefits', 'Financial Benefits')}:</span>
                      <span className="text-gray-800 font-semibold leading-relaxed">{translateBenefitSummary(scheme.benefit_summary, language)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">{t('evaluation.indicativeAnnualValue', 'Indicative Annual Value')}:</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        ₹{scheme.indicative_annual_benefit.toLocaleString('en-IN')}{t('evaluation.perYear', '/year')}
                      </span>
                    </div>
                  </div>

                  {/* Explainable Decision Card */}
                  <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-navy-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        {t('evaluation.decisionLogicTitle', 'Automated Decision Logic Explanation')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedRules(prev => ({ ...prev, [scheme.scheme_id]: !prev[scheme.scheme_id] }))}
                        className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        {isExpanded
                          ? t('evaluation.hideChecklist', 'Hide Rule Checklist ▲')
                          : t('evaluation.viewChecklist', 'View Rule Checklist ▼')}
                      </button>
                    </div>

                    {isAiLoading ? (
                      <p className="text-xs text-gray-500 italic">
                        {t('evaluation.generatingExplanation', 'Generating structured explanation...')}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        {dynamicRecommendation || t('evaluation.evalCompleteStatutory', 'Evaluation complete based on statutory guidelines.')}
                      </p>
                    )}

                    {/* Detailed checklist */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                        {scheme.passed_conditions.map((cond, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                            <span className="font-bold">✓</span>
                            <span>{translateCondition(cond, language)}</span>
                          </div>
                        ))}
                        {scheme.failed_conditions.map((cond, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-rose-800">
                            <span className="font-bold">✕</span>
                            <span className="font-medium">{translateCondition(cond, language)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
