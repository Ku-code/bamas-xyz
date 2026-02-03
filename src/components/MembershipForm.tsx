import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
    User, Building2, Mail, Phone, MapPin, Globe, Briefcase,
    FileText, CheckCircle, ArrowRight, ArrowLeft, Send,
    GraduationCap, Building, Users, Handshake, Linkedin, X
} from 'lucide-react';

// Form step types
export type FormStep = 'type' | 'personal' | 'organization' | 'contact' | 'motivation' | 'professional' | 'compliance' | 'signature';

// Application types
export type ApplicationType =
    | 'individual'
    | 'company'
    | 'academic'
    | 'public'
    | 'private'
    | 'foreign';

// Experience levels
type ExperienceLevel = 'none' | '1-3' | '3-5' | '5-10' | '10+';

// Industry reputation options
type IndustryReputation = 'no_prior' | 'positive' | 'negative' | 'mixed';

// Form data interface
export interface FormData {
    // Type of application
    applicationType: ApplicationType | '';

    // Personal details (for individual membership)
    fullName: string;
    dateOfBirth: string;
    age: string;
    gender: string;
    nationality: string;
    currentEmployment: string;
    experienceLevel: ExperienceLevel | '';

    // Organization details (for company/institutional)
    legalName: string;
    legalForm: string;
    registrationNumber: string;
    countryOfRegistration: string;
    registeredAddress: string;
    website: string;
    mainActivity: string;

    // Contact information
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    linkedIn: string;

    // Motivation and alignment
    motivation: string;
    willingToContribute: 'yes' | 'no' | 'partially' | '';
    contributeExplanation: string;
    valuesAlign: 'yes' | 'no' | 'partially' | '';
    valuesExplanation: string;

    // Professional background
    industryReputation: IndustryReputation | '';
    amCompanyRelationships: string;
    politicalAffiliations: string;

    // Compliance declarations
    readArticles: boolean;
    confirmAccuracy: boolean;
    understandApproval: boolean;
    agreeGDPR: boolean;

    // Signature
    signaturePlace: string;
    signatureDate: string;
    signatureName: string;

    // Hidden timestamp
    appliedAt?: string;
}

const initialFormData: FormData = {
    applicationType: '',
    fullName: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    nationality: '',
    currentEmployment: '',
    experienceLevel: '',
    legalName: '',
    legalForm: '',
    registrationNumber: '',
    countryOfRegistration: '',
    registeredAddress: '',
    website: '',
    mainActivity: '',
    address: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    linkedIn: '',
    motivation: '',
    willingToContribute: '',
    contributeExplanation: '',
    valuesAlign: '',
    valuesExplanation: '',
    industryReputation: '',
    amCompanyRelationships: '',
    politicalAffiliations: '',
    readArticles: false,
    confirmAccuracy: false,
    understandApproval: false,
    agreeGDPR: false,
    signaturePlace: '',
    signatureDate: new Date().toISOString().split('T')[0],
    signatureName: '',
};

interface MembershipFormProps {
    initialType?: ApplicationType;
    onSuccess?: (data: { email: string; name: string }) => void;
    onClose?: () => void;
    isModal?: boolean;
}

const MembershipForm: React.FC<MembershipFormProps> = ({
    initialType,
    onSuccess,
    onClose,
    isModal = false
}) => {
    const { language } = useLanguage();
    const [currentStep, setCurrentStep] = useState<FormStep>('type');
    const [formData, setFormData] = useState<FormData>({
        ...initialFormData,
        applicationType: initialType || initialFormData.applicationType
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    useEffect(() => {
        if (initialType) {
            setFormData(prev => ({ ...prev, applicationType: initialType }));
            setCurrentStep(initialType === 'individual' ? 'personal' : 'organization');
        }
    }, [initialType]);

    // Step order based on application type
    const getSteps = (): FormStep[] => {
        if (formData.applicationType === 'individual') {
            return ['type', 'personal', 'contact', 'motivation', 'professional', 'compliance', 'signature'];
        }
        return ['type', 'organization', 'contact', 'motivation', 'professional', 'compliance', 'signature'];
    };

    const steps = getSteps();
    const currentStepIndex = steps.indexOf(currentStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const applicationTypes = [
        { value: 'individual', icon: User, labelEn: 'Individual Membership', labelBg: 'Индивидуално членство' },
        { value: 'company', icon: Building2, labelEn: 'Company / Legal Entity', labelBg: 'Компания / Юридическо лице' },
        { value: 'academic', icon: GraduationCap, labelEn: 'Academic / Research Institution', labelBg: 'Академична институция' },
        { value: 'public', icon: Building, labelEn: 'Public Organisation', labelBg: 'Публична организация' },
        { value: 'private', icon: Users, labelEn: 'Private Organisation', labelBg: 'Частна организация' },
        { value: 'foreign', icon: Handshake, labelEn: 'Foreign Partner / International Org.', labelBg: 'Чуждестранен партньор' },
    ];

    const experienceLevels = [
        { value: 'none', labelEn: 'None', labelBg: 'Нямам' },
        { value: '1-3', labelEn: '1–3 years', labelBg: '1–3 години' },
        { value: '3-5', labelEn: '3–5 years', labelBg: '3–5 години' },
        { value: '5-10', labelEn: '5–10 years', labelBg: '5–10 години' },
        { value: '10+', labelEn: '10+ years', labelBg: '10+ години' },
    ];

    const reputationOptions = [
        { value: 'no_prior', labelEn: 'No prior experience', labelBg: 'Без предходен опит' },
        { value: 'positive', labelEn: 'Positive', labelBg: 'Позитивна' },
        { value: 'negative', labelEn: 'Negative', labelBg: 'Негативна' },
        { value: 'mixed', labelEn: 'Mixed/Neutral', labelBg: 'Смесена' },
    ];

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        switch (currentStep) {
            case 'type':
                if (!formData.applicationType) {
                    toast.error(language === 'bg' ? 'Моля, изберете вид членство' : 'Please select an application type');
                    return false;
                }
                break;

            case 'personal':
                if (!formData.fullName.trim()) newErrors.fullName = language === 'bg' ? 'Името е задължително' : 'Full name is required';
                if (!formData.dateOfBirth) newErrors.dateOfBirth = language === 'bg' ? 'Датата на раждане е задължителна' : 'Date of birth is required';
                if (!formData.nationality.trim()) newErrors.nationality = language === 'bg' ? 'Гражданството е задължително' : 'Nationality is required';
                break;

            case 'organization':
                if (!formData.legalName.trim()) newErrors.legalName = language === 'bg' ? 'Наименованието е задължително' : 'Legal name is required';
                if (!formData.legalForm.trim()) newErrors.legalForm = language === 'bg' ? 'Правната форма е задължителна' : 'Legal form is required';
                if (!formData.registrationNumber.trim()) newErrors.registrationNumber = language === 'bg' ? 'ЕИК е задължителен' : 'Registration number is required';
                if (!formData.countryOfRegistration.trim()) newErrors.countryOfRegistration = language === 'bg' ? 'Държавата е задължителна' : 'Country of registration is required';
                break;

            case 'contact':
                if (!formData.email.trim()) newErrors.email = language === 'bg' ? 'Имейлът е задължителен' : 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = language === 'bg' ? 'Невалиден имейл' : 'Invalid email format';
                if (!formData.phone.trim()) newErrors.phone = language === 'bg' ? 'Телефонът е задължителен' : 'Phone number is required';
                if (!formData.city.trim()) newErrors.city = language === 'bg' ? 'Градът е задължителен' : 'City is required';
                if (!formData.country.trim()) newErrors.country = language === 'bg' ? 'Държавата е задължителна' : 'Country is required';
                break;

            case 'motivation':
                if (!formData.motivation.trim()) newErrors.motivation = language === 'bg' ? 'Моля, опишете Вашата мотивация' : 'Please describe your motivation';
                if (!formData.willingToContribute) newErrors.willingToContribute = language === 'bg' ? 'Моля, изберете опция' : 'Please select an option';
                if (!formData.valuesAlign) newErrors.valuesAlign = language === 'bg' ? 'Моля, изберете опция' : 'Please select an option';
                break;

            case 'professional':
                if (!formData.industryReputation) newErrors.industryReputation = language === 'bg' ? 'Моля, изберете репутация' : 'Please select your industry reputation';
                break;

            case 'compliance':
                if (!formData.readArticles) {
                    toast.error(language === 'bg' ? 'Трябва да потвърдите, че сте прочели Устава' : 'You must confirm reading the Articles of Association');
                    return false;
                }
                if (!formData.confirmAccuracy) {
                    toast.error(language === 'bg' ? 'Трябва да потвърдите истинността на информацията' : 'You must confirm the accuracy of information');
                    return false;
                }
                if (!formData.understandApproval) {
                    toast.error(language === 'bg' ? 'Трябва да потвърдите, че разбирате процеса' : 'You must acknowledge the approval process');
                    return false;
                }
                if (!formData.agreeGDPR) {
                    toast.error(language === 'bg' ? 'Трябва да се съгласите с обработката на лични данни' : 'You must agree to GDPR data processing');
                    return false;
                }
                break;

            case 'signature':
                if (!formData.signaturePlace.trim()) newErrors.signaturePlace = language === 'bg' ? 'Мястото е задължително' : 'Place is required';
                if (!formData.signatureDate) newErrors.signatureDate = language === 'bg' ? 'Датата е задължителна' : 'Date is required';
                if (!formData.signatureName.trim()) newErrors.signatureName = language === 'bg' ? 'Името е задължително' : 'Name is required for signature';
                break;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < steps.length) {
                setCurrentStep(steps[nextIndex]);
            }
        }
    };

    const prevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);
        try {
            // Capture submission time in local Sofia timezone format if possible, or ISO
            const now = new Date();
            const appliedAt = now.toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            // Call the edge function to generate PDF and send emails
            const { data, error } = await supabase.functions.invoke('send-membership-application', {
                body: {
                    formData: {
                        ...formData,
                        appliedAt
                    },
                    language: language,
                },
            });

            if (error) throw error;

            toast.success(language === 'bg' ? 'Заявлението е изпратено успешно!' : 'Application submitted successfully!');
            if (onSuccess) {
                onSuccess({
                    email: formData.email,
                    name: formData.fullName || formData.legalName
                });
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(error.message || (language === 'bg' ? 'Възникна грешка. Моля, опитайте отново.' : 'Failed to submit application. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200";
    const labelClasses = "block text-sm font-medium text-teal-300 mb-2";
    const errorClasses = "text-red-400 text-sm mt-1";

    const renderStepContent = () => {
        switch (currentStep) {
            case 'type':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Изберете вид заявление' : 'Select Application Type'}
                        </h2>
                        <p className="text-white/70 mb-6">
                            {language === 'bg'
                                ? 'Изберете категорията членство, която най-добре описва Вас или Вашата организация.'
                                : 'Choose the membership category that best describes you or your organization.'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {applicationTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = formData.applicationType === type.value;
                                return (
                                    <motion.button
                                        key={type.value}
                                        type="button"
                                        onClick={() => updateFormData('applicationType', type.value as ApplicationType)}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${isSelected
                                            ? 'border-teal-500 bg-teal-500/20 shadow-lg shadow-teal-500/20'
                                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${isSelected ? 'bg-teal-500' : 'bg-white/10'}`}>
                                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-teal-300'}`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{language === 'bg' ? type.labelBg : type.labelEn}</p>
                                                <p className="text-sm text-white/60">{language === 'bg' ? type.labelEn : type.labelBg}</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'personal':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Лични данни' : 'Personal Details'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Три имена' : 'Full Name'} *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => updateFormData('fullName', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Въведете трите си имена' : 'Enter your full name'}
                                />
                                {errors.fullName && <p className={errorClasses}>{errors.fullName}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Дата на раждане' : 'Date of Birth'} *</label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                                    className={inputClasses}
                                />
                                {errors.dateOfBirth && <p className={errorClasses}>{errors.dateOfBirth}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Възраст' : 'Age'}</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => updateFormData('age', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Вашата възраст' : 'Your age'}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Пол (по избор)' : 'Gender (optional)'}</label>
                                <input
                                    type="text"
                                    value={formData.gender}
                                    onChange={(e) => updateFormData('gender', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Вашият пол' : 'Your gender'}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Гражданство' : 'Nationality'} *</label>
                                <input
                                    type="text"
                                    value={formData.nationality}
                                    onChange={(e) => updateFormData('nationality', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Вашето гражданство' : 'Your nationality'}
                                />
                                {errors.nationality && <p className={errorClasses}>{errors.nationality}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Текуща заетост' : 'Current Employment'}</label>
                                <input
                                    type="text"
                                    value={formData.currentEmployment}
                                    onChange={(e) => updateFormData('currentEmployment', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Вашата текуща работа или позиция' : 'Your current job or position'}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Професионален опит в сферата на адитивното производство' : 'Years of Professional Experience in Additive Manufacturing'}</label>
                                <div className="flex flex-wrap gap-3">
                                    {experienceLevels.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => updateFormData('experienceLevel', level.value as ExperienceLevel)}
                                            className={`px-4 py-2 rounded-lg border transition-all ${formData.experienceLevel === level.value
                                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                                : 'border-white/20 bg-white/5 text-white hover:border-white/40'
                                                }`}
                                        >
                                            {language === 'bg' ? level.labelBg : level.labelEn}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'organization':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Данни за организацията' : 'Organisation Details'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Юридическо наименование' : 'Legal Name'} *</label>
                                <input
                                    type="text"
                                    value={formData.legalName}
                                    onChange={(e) => updateFormData('legalName', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Официално име на организацията' : 'Official name of the organization'}
                                />
                                {errors.legalName && <p className={errorClasses}>{errors.legalName}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Правна форма' : 'Legal Form'} *</label>
                                <input
                                    type="text"
                                    value={formData.legalForm}
                                    onChange={(e) => updateFormData('legalForm', e.target.value)}
                                    className={inputClasses}
                                    placeholder="e.g., LLC, Corporation, NGO"
                                />
                                {errors.legalForm && <p className={errorClasses}>{errors.legalForm}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'ЕИК / Регистрационен номер' : 'Registration Number'} *</label>
                                <input
                                    type="text"
                                    value={formData.registrationNumber}
                                    onChange={(e) => updateFormData('registrationNumber', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Регистрационен номер на компанията' : 'Company registration number'}
                                />
                                {errors.registrationNumber && <p className={errorClasses}>{errors.registrationNumber}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Държава на регистрация' : 'Country of Registration'} *</label>
                                <input
                                    type="text"
                                    value={formData.countryOfRegistration}
                                    onChange={(e) => updateFormData('countryOfRegistration', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Държава, в която е регистрирана' : 'Country where registered'}
                                />
                                {errors.countryOfRegistration && <p className={errorClasses}>{errors.countryOfRegistration}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Уебсайт' : 'Website'}</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => updateFormData('website', e.target.value)}
                                    className={inputClasses}
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Адрес на регистрация' : 'Registered Address'}</label>
                                <input
                                    type="text"
                                    value={formData.registeredAddress}
                                    onChange={(e) => updateFormData('registeredAddress', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Пълен адрес на регистрация' : 'Full registered address'}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Основна дейност, свързана с адитивното производство' : 'Main Activity Related to Additive Manufacturing'}</label>
                                <textarea
                                    value={formData.mainActivity}
                                    onChange={(e) => updateFormData('mainActivity', e.target.value)}
                                    className={`${inputClasses} min-h-[100px] resize-y`}
                                    placeholder={language === 'bg' ? 'Опишете основните дейности на Вашата организация...' : "Describe your organization's main activities..."}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Информация за контакт' : 'Contact Information'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Адрес за кореспонденция' : 'Address'}</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => updateFormData('address', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Улица, номер' : 'Street address'}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Град' : 'City'} *</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => updateFormData('city', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Град' : 'City'}
                                />
                                {errors.city && <p className={errorClasses}>{errors.city}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Държава' : 'Country'} *</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => updateFormData('country', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Държава' : 'Country'}
                                />
                                {errors.country && <p className={errorClasses}>{errors.country}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    <Mail className="inline w-4 h-4 mr-2" />
                                    {language === 'bg' ? 'Имейл адрес' : 'Email Address'} *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
                                    className={inputClasses}
                                    placeholder="your@email.com"
                                />
                                {errors.email && <p className={errorClasses}>{errors.email}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    <Phone className="inline w-4 h-4 mr-2" />
                                    {language === 'bg' ? 'Телефон за връзка' : 'Phone Number'} *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => updateFormData('phone', e.target.value)}
                                    className={inputClasses}
                                    placeholder="+359 ..."
                                />
                                {errors.phone && <p className={errorClasses}>{errors.phone}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>
                                    <Linkedin className="inline w-4 h-4 mr-2" />
                                    LinkedIn Profile (optional) / LinkedIn профил
                                </label>
                                <input
                                    type="url"
                                    value={formData.linkedIn}
                                    onChange={(e) => updateFormData('linkedIn', e.target.value)}
                                    className={inputClasses}
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'motivation':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Мотивация и съответствие' : 'Motivation and Alignment'}
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClasses}>
                                    {language === 'bg' ? 'Моля, опишете Вашата основна мотивация за членство в БАЗАП' : 'Please describe your main motivation for applying for membership'} *
                                </label>
                                <textarea
                                    value={formData.motivation}
                                    onChange={(e) => updateFormData('motivation', e.target.value)}
                                    className={`${inputClasses} min-h-[120px] resize-y`}
                                    placeholder={language === 'bg' ? 'Какво Ви подтиква да се присъедините към БАЗАП?' : 'What drives your interest in joining BAMAS?'}
                                />
                                {errors.motivation && <p className={errorClasses}>{errors.motivation}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    {language === 'bg' ? 'Желаете ли да допринасяте активно?' : 'Willing to actively contribute?'} *
                                </label>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {['yes', 'no', 'partially'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => updateFormData('willingToContribute', option as 'yes' | 'no' | 'partially')}
                                            className={`px-6 py-2 rounded-lg border transition-all capitalize ${formData.willingToContribute === option
                                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                                : 'border-white/20 bg-white/5 text-white hover:border-white/40'
                                                }`}
                                        >
                                            {option === 'yes' ? (language === 'bg' ? 'Да' : 'Yes') : option === 'no' ? (language === 'bg' ? 'Не' : 'No') : (language === 'bg' ? 'Частично' : 'Partially')}
                                        </button>
                                    ))}
                                </div>
                                {formData.willingToContribute === 'partially' && (
                                    <input
                                        type="text"
                                        value={formData.contributeExplanation}
                                        onChange={(e) => updateFormData('contributeExplanation', e.target.value)}
                                        className={`${inputClasses} mt-3`}
                                        placeholder={language === 'bg' ? 'Моля, обяснете...' : 'Please explain...'}
                                    />
                                )}
                                {errors.willingToContribute && <p className={errorClasses}>{errors.willingToContribute}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    {language === 'bg' ? 'Ценностите Ви съвпадат ли с тези на БАЗАП?' : 'Values align with BAMAS?'} *
                                </label>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {['yes', 'no', 'partially'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => updateFormData('valuesAlign', option as 'yes' | 'no' | 'partially')}
                                            className={`px-6 py-2 rounded-lg border transition-all capitalize ${formData.valuesAlign === option
                                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                                : 'border-white/20 bg-white/5 text-white hover:border-white/40'
                                                }`}
                                        >
                                            {option === 'yes' ? (language === 'bg' ? 'Да' : 'Yes') : option === 'no' ? (language === 'bg' ? 'Не' : 'No') : (language === 'bg' ? 'Частично' : 'Partially')}
                                        </button>
                                    ))}
                                </div>
                                {formData.valuesAlign === 'partially' && (
                                    <input
                                        type="text"
                                        value={formData.valuesExplanation}
                                        onChange={(e) => updateFormData('valuesExplanation', e.target.value)}
                                        className={`${inputClasses} mt-3`}
                                        placeholder={language === 'bg' ? 'Моля, обяснете...' : 'Please explain...'}
                                    />
                                )}
                                {errors.valuesAlign && <p className={errorClasses}>{errors.valuesAlign}</p>}
                            </div>
                        </div>
                    </div>
                );

            case 'professional':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Професионален опит и свързаност' : 'Professional Background'}
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Репутация в индустрията' : 'Industry Reputation'} *</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    {reputationOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateFormData('industryReputation', option.value as IndustryReputation)}
                                            className={`px-4 py-3 rounded-lg border transition-all text-center ${formData.industryReputation === option.value
                                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                                : 'border-white/20 bg-white/5 text-white hover:border-white/40'
                                                }`}
                                        >
                                            <p className="text-sm">{language === 'bg' ? option.labelBg : option.labelEn}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.industryReputation && <p className={errorClasses}>{errors.industryReputation}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    {language === 'bg' ? 'Взаимоотношения с АМ компании на българския пазар?' : 'Relationships with AM companies operating in the Bulgarian market?'}
                                </label>
                                <textarea
                                    value={formData.amCompanyRelationships}
                                    onChange={(e) => updateFormData('amCompanyRelationships', e.target.value)}
                                    className={`${inputClasses} min-h-[100px] resize-y`}
                                    placeholder={language === 'bg' ? 'Имена на компании/вид връзка...' : 'Company names and nature of relationship...'}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>
                                    {language === 'bg' ? 'Заемате ли политически позиции или имате ли принадлежност?' : 'Relevant political positions, affiliations, or formal relationships?'}
                                </label>
                                <textarea
                                    value={formData.politicalAffiliations}
                                    onChange={(e) => updateFormData('politicalAffiliations', e.target.value)}
                                    className={`${inputClasses} min-h-[100px] resize-y`}
                                    placeholder={language === 'bg' ? 'Заемани позиции...' : 'Any relevant political or formal affiliations...'}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'compliance':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Съответствие и декларации' : 'Compliance and Declarations'}
                        </h2>

                        <div className="space-y-4">
                            {[
                                {
                                    field: 'readArticles' as keyof FormData,
                                    labelEn: 'I confirm that I have read and understood the Articles of Association of BAMAS.',
                                    labelBg: 'Потвърждавам, че съм прочел и разбирам Устава на БАЗАП.',
                                },
                                {
                                    field: 'confirmAccuracy' as keyof FormData,
                                    labelEn: 'I confirm that the information provided is true, complete, and accurate.',
                                    labelBg: 'Потвърждавам, че предоставената информация е вярна, пълна и точна.',
                                },
                                {
                                    field: 'understandApproval' as keyof FormData,
                                    labelEn: 'I understand that membership is subject to approval by the BAMAS Board.',
                                    labelBg: 'Разбирам, че членството подлежи на одобрение от Управителния съвет на БАЗАП.',
                                },
                                {
                                    field: 'agreeGDPR' as keyof FormData,
                                    labelEn: 'I agree to data processing in accordance with GDPR for membership purposes.',
                                    labelBg: 'Съгласен съм с обработката на лични данни съгласно GDPR за целите на членството.',
                                },
                            ].map((item) => (
                                <div key={item.field} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-teal-500/30 transition-all">
                                    <input
                                        type="checkbox"
                                        id={item.field}
                                        checked={formData[item.field] as boolean}
                                        onChange={(e) => updateFormData(item.field, e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900"
                                    />
                                    <label htmlFor={item.field} className="text-white/80 text-sm cursor-pointer select-none">
                                        {language === 'bg' ? item.labelBg : item.labelEn}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'signature':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Подпис и потвърждение' : 'Signature and Confirmation'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Място' : 'Place'} *</label>
                                <input
                                    type="text"
                                    value={formData.signaturePlace}
                                    onChange={(e) => updateFormData('signaturePlace', e.target.value)}
                                    className={inputClasses}
                                    placeholder={language === 'bg' ? 'Град' : 'City'}
                                />
                                {errors.signaturePlace && <p className={errorClasses}>{errors.signaturePlace}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>{language === 'bg' ? 'Дата' : 'Date'} *</label>
                                <input
                                    type="date"
                                    value={formData.signatureDate}
                                    onChange={(e) => updateFormData('signatureDate', e.target.value)}
                                    className={inputClasses}
                                />
                                {errors.signatureDate && <p className={errorClasses}>{errors.signatureDate}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClasses}>{language === 'bg' ? 'Име за подпис' : 'Name for Signature'} *</label>
                                <p className="text-white/60 text-xs mb-2">
                                    {language === 'bg'
                                        ? 'С въвеждането на Вашето име тук, Вие полагате електронен подпис на това заявление.'
                                        : 'By typing your name here, you are electronically signing this application.'}
                                </p>
                                <input
                                    type="text"
                                    value={formData.signatureName}
                                    onChange={(e) => updateFormData('signatureName', e.target.value)}
                                    className={`${inputClasses} font-serif italic text-xl`}
                                    placeholder={language === 'bg' ? 'Три имена' : 'Full Name'}
                                />
                                {errors.signatureName && <p className={errorClasses}>{errors.signatureName}</p>}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`flex flex-col ${isModal ? 'h-full' : 'max-w-4xl mx-auto pt-8'}`}>

            {/* Progress Bar - Fixed at top when in modal */}
            <div className={`flex-none ${isModal ? 'px-6 pt-10 mb-4' : 'mb-8'}`}>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-teal-400 text-sm font-medium">
                        {language === 'bg' ? 'Стъпка' : 'Step'} {currentStepIndex + 1} {language === 'bg' ? 'от' : 'of'} {steps.length}
                    </span>
                    <span className="text-white/40 text-xs uppercase tracking-wider font-semibold mr-8">
                        {language === 'bg' ? 'Прогрес' : 'Progress'}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Step Navigation and Content - Scrollable in modal */}
            <div className={`flex-1 ${isModal ? 'overflow-y-auto px-2 sm:px-6 pb-10' : ''}`}>
                <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${isModal ? 'p-4 sm:p-8' : 'p-6 md:p-8 mb-10'}`}>
                    <form onSubmit={(e) => { e.preventDefault(); }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Controls */}
                        <div className="flex justify-between mt-10">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStepIndex === 0 || isSubmitting}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStepIndex === 0
                                    ? 'text-white/20 cursor-not-allowed'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                {language === 'bg' ? 'Назад' : 'Back'}
                            </button>

                            {currentStepIndex === steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {language === 'bg' ? 'Изпращане...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        <>
                                            {language === 'bg' ? 'Подай заявление' : 'Submit Application'}
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 hover:bg-teal-500 hover:text-white rounded-xl font-bold transition-all group"
                                >
                                    {language === 'bg' ? 'Напред' : 'Next Step'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MembershipForm;
