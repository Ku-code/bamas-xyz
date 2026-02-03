import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
    CheckCircle2,
    Mail,
    CreditCard,
    Building2,
    Copy,
    ExternalLink,
    Home,
    FileText,
    Clock,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface LocationState {
    email: string;
    name: string;
}

const MembershipSuccess: React.FC = () => {
    const location = useLocation();
    const state = location.state as LocationState | null;

    // Redirect if no state (direct access)
    if (!state) {
        return <Navigate to="/membership-application" replace />;
    }

    const { email, name } = state;

    // Bank payment details
    const paymentDetails = {
        beneficiary: 'БЪЛГАРСКА АСОЦИАЦИЯ ЗА АДИТИВНО ПРОИЗВОДСТВО',
        beneficiaryEn: 'BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION',
        iban: 'BG57BPBI79401080215201',
        bic: 'BPBIBGSF',
        bank: 'ЮРОБАНК БЪЛГАРИЯ АД',
        bankEn: 'EUROBANK BULGARIA AD',
        currency: 'BGN (Bulgarian Lev)',
        paymentPurpose: 'Membership fee / Членски внос',
    };

    // Membership fee tiers
    const membershipFees = [
        {
            type: 'Individual',
            typeBg: 'Индивидуално членство',
            amount: '100 BGN',
            period: 'per year / годишно'
        },
        {
            type: 'Company (Small)',
            typeBg: 'Компания (Малка)',
            amount: '500 BGN',
            period: 'per year / годишно'
        },
        {
            type: 'Company (Medium)',
            typeBg: 'Компания (Средна)',
            amount: '1,000 BGN',
            period: 'per year / годишно'
        },
        {
            type: 'Company (Large)',
            typeBg: 'Компания (Голяма)',
            amount: '2,500 BGN',
            period: 'per year / годишно'
        },
        {
            type: 'Academic Institution',
            typeBg: 'Академична институция',
            amount: '300 BGN',
            period: 'per year / годишно'
        },
    ];

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    {/* Success Hero */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mb-12"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30"
                        >
                            <CheckCircle2 className="w-14 h-14 text-white" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-5xl font-bold text-white mb-4"
                        >
                            Application Submitted Successfully!
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-white/70"
                        >
                            Заявлението Ви е изпратено успешно!
                        </motion.p>
                    </motion.div>

                    {/* What happens next */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="max-w-4xl mx-auto mb-12"
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Clock className="w-6 h-6 text-teal-400" />
                                What Happens Next? / Какво следва?
                            </h2>

                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        step: 1,
                                        titleEn: 'Email Confirmation',
                                        titleBg: 'Имейл потвърждение',
                                        descEn: `A copy of your application has been sent to ${email}`,
                                        descBg: 'Копие от Вашето заявление беше изпратено на посочения имейл',
                                        icon: Mail,
                                    },
                                    {
                                        step: 2,
                                        titleEn: 'Payment',
                                        titleBg: 'Плащане',
                                        descEn: 'Complete the membership fee payment using the details below',
                                        descBg: 'Извършете плащане на членския внос по данните по-долу',
                                        icon: CreditCard,
                                    },
                                    {
                                        step: 3,
                                        titleEn: 'Board Review',
                                        titleBg: 'Разглеждане от УС',
                                        descEn: 'Your application will be reviewed by the BAMAS Board of Directors',
                                        descBg: 'Заявлението ще бъде разгледано от Управителния съвет',
                                        icon: FileText,
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        className="relative"
                                    >
                                        <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10">
                                            <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
                                                <item.icon className="w-6 h-6 text-teal-400" />
                                            </div>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {item.step}
                                            </div>
                                            <h3 className="text-lg font-semibold text-white mb-1">{item.titleEn}</h3>
                                            <p className="text-teal-300 text-sm mb-2">{item.titleBg}</p>
                                            <p className="text-white/60 text-sm">{item.descEn}</p>
                                        </div>
                                        {index < 2 && (
                                            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                                                <ArrowRight className="w-6 h-6 text-teal-500/50" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Payment Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="max-w-4xl mx-auto mb-12"
                    >
                        <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-teal-500/30 p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Building2 className="w-6 h-6 text-teal-400" />
                                Payment Details / Банкови данни
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Bank Details */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <label className="text-teal-300 text-sm font-medium block mb-1">Beneficiary / Получател</label>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-mono text-sm">{paymentDetails.beneficiary}</p>
                                                <p className="text-white/60 text-xs mt-1">{paymentDetails.beneficiaryEn}</p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(paymentDetails.beneficiary, 'Beneficiary')}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-4 h-4 text-white/60" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <label className="text-teal-300 text-sm font-medium block mb-1">IBAN</label>
                                        <div className="flex items-center justify-between">
                                            <p className="text-white font-mono text-lg">{paymentDetails.iban}</p>
                                            <button
                                                onClick={() => copyToClipboard(paymentDetails.iban, 'IBAN')}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-4 h-4 text-white/60" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            <label className="text-teal-300 text-sm font-medium block mb-1">BIC/SWIFT</label>
                                            <div className="flex items-center justify-between">
                                                <p className="text-white font-mono">{paymentDetails.bic}</p>
                                                <button
                                                    onClick={() => copyToClipboard(paymentDetails.bic, 'BIC')}
                                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <Copy className="w-3 h-3 text-white/60" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            <label className="text-teal-300 text-sm font-medium block mb-1">Currency</label>
                                            <p className="text-white">{paymentDetails.currency}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <label className="text-teal-300 text-sm font-medium block mb-1">Bank / Банка</label>
                                        <p className="text-white">{paymentDetails.bank}</p>
                                        <p className="text-white/60 text-sm">{paymentDetails.bankEn}</p>
                                    </div>

                                    <div className="p-4 bg-teal-500/20 rounded-lg border border-teal-500/30">
                                        <label className="text-teal-300 text-sm font-medium block mb-1">Payment Purpose / Основание</label>
                                        <p className="text-white">{paymentDetails.paymentPurpose} - {name}</p>
                                    </div>
                                </div>

                                {/* Fee Structure */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-teal-400" />
                                        Membership Fees / Членски внос
                                    </h3>
                                    <div className="space-y-3">
                                        {membershipFees.map((fee, index) => (
                                            <motion.div
                                                key={fee.type}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + index * 0.1 }}
                                                className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="text-white font-medium">{fee.type}</p>
                                                    <p className="text-white/60 text-sm">{fee.typeBg}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-teal-400 font-bold">{fee.amount}</p>
                                                    <p className="text-white/50 text-xs">{fee.period}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <p className="text-white/50 text-sm mt-4 italic">
                                        * Actual fee depends on your membership category. You will receive confirmation with the exact amount.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="max-w-4xl mx-auto mb-12"
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl text-center">
                            <p className="text-white/80 mb-3">
                                For questions or assistance, please contact us at:
                            </p>
                            <a
                                href="mailto:info@bamas.xyz"
                                className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                                info@bamas.xyz
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Return to Home */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="text-center"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20 hover:border-white/40"
                        >
                            <Home className="w-5 h-5" />
                            Return to Homepage / Обратно към началната страница
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default MembershipSuccess;
