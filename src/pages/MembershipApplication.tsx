import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import MembershipForm from '../components/MembershipForm';

const MembershipApplication: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();

    const handleSuccess = (data: { email: string; name: string }) => {
        navigate('/membership-success', { state: data });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            {language === 'bg' ? 'Членство в БАЗАП' : 'BAMAS Membership'}
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            {language === 'bg'
                                ? 'Присъединете се към водещата общност за адитивно производство в България. Попълнете формуляра по-долу, за да започнете своя процес на кандидатстване.'
                                : 'Join the leading additive manufacturing community in Bulgaria. Complete the form below to begin your application process.'}
                        </p>
                    </motion.div>

                    <MembershipForm onSuccess={handleSuccess} />
                </div>
            </section>
        </div>
    );
};

export default MembershipApplication;
