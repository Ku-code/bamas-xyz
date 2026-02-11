import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface BoardMember {
    nameBg: string;
    nameEn: string;
    roleBg: string;
    roleEn: string;
    image: string;
}

const BOARD_MEMBERS: BoardMember[] = [
    {
        nameBg: "КУЗО ДОНЧЕВ",
        nameEn: "KUZO DONCHEV",
        roleBg: "Председател",
        roleEn: "Chairman",
        image: "/no background images members/kuzo_donchev.png",
    },
    {
        nameBg: "БОЯН ПЕХЛИВАНОВ",
        nameEn: "BOYAN PEHLIVANOV",
        roleBg: "Заместник-председател",
        roleEn: "Vice Chairman",
        image: "/no background images members/boyan_pehlevanov.png",
    },
    {
        nameBg: "НИКОЛАЙ ЙОРДАНОВ",
        nameEn: "NIKOLAY YORDANOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/nikolay_yordanov.png",
    },
    {
        nameBg: "ГЕОРГИ ТОЛЕВ",
        nameEn: "GEORGI TOLEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/georgi_tolev.png",
    },
    {
        nameBg: "КРАСИМИР ГЕОРГИЕВ",
        nameEn: "KRASIMIR GEORGIEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/krasimir_georgiev.png",
    },
    {
        nameBg: "ЛЮБОМИР ГЕРАСИМОВ",
        nameEn: "LYUBOMIR GERASIMOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/lyubomir_gerasimov.png",
    },
    {
        nameBg: "ВАСИЛ НИКОЛОВ",
        nameEn: "VASIL NIKOLOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/vasil_nikolov.png",
    },
    {
        nameBg: "ДАНИЕЛ ХРИСТЕВ",
        nameEn: "DANIEL HRISTEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/daniel_hristev.png",
    },
    {
        nameBg: "АНДРЕЙ ДУНИЦОВ",
        nameEn: "ANDREY DUNITSOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/andrey_dunitsov.png",
    },
    {
        nameBg: "ДИМО ДИМОВ",
        nameEn: "DIMO DIMOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "",
    },
];

const BoardMembersCarousel = () => {
    const { language } = useLanguage();
    const [isPaused, setIsPaused] = useState(false);

    // Triple the array for extra padding in the infinite loop
    const duplicatedMembers = [...BOARD_MEMBERS, ...BOARD_MEMBERS, ...BOARD_MEMBERS];
    const CARD_HEIGHT = 200;
    const totalHeight = BOARD_MEMBERS.length * CARD_HEIGHT;

    const renderMemberCard = (member: BoardMember, index: number) => {
        const name = language === "bg" ? member.nameBg : member.nameEn;
        const role = language === "bg" ? member.roleBg : member.roleEn;

        return (
            <div
                key={`${member.nameEn}-${index}`}
                className="w-full px-2 sm:px-4 py-2 flex-shrink-0"
                style={{ height: `${CARD_HEIGHT}px` }}
            >
                <motion.div
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="relative h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] group transition-all duration-300"
                >
                    {/* Glassmorphism Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center p-3 sm:p-6 gap-3 sm:gap-8 h-full relative z-10">
                        {/* Member Profile Image - Enhanced visibility and mobile optimization */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/50 to-primary/20 p-[2px] shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-muted/30 relative">
                                    {/* Subtle background glow for transparent images */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />

                                    {member.image ? (
                                        <img
                                            src={member.image}
                                            alt={name}
                                            className="w-full h-full object-contain object-bottom transition-all duration-700 group-hover:scale-110 drop-shadow-2xl"
                                            loading="eager"
                                            decoding="sync"
                                            fetchPriority="high"
                                            onError={(e) => {
                                                console.error(`Failed to load image for ${name}: ${member.image}`);
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                            <span className="text-3xl sm:text-4xl font-black text-primary/40">
                                                {name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Decorative accent */}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 backdrop-blur-md rounded-lg border border-primary/20 flex items-center justify-center -z-10 group-hover:rotate-12 transition-transform duration-500" />
                        </div>

                        {/* Member Info - Responsive Typography */}
                        <div className="flex-grow flex flex-col justify-center min-w-0 py-2">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col gap-1 sm:gap-2"
                            >
                                <span className="text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary/70 mb-0.5 sm:mb-1">
                                    {role}
                                </span>
                                <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors duration-300 truncate pb-1">
                                    {name}
                                </h3>
                                <div className="w-8 sm:w-16 h-1 sm:h-1.5 bg-primary/20 rounded-full group-hover:w-24 sm:group-hover:w-32 group-hover:bg-primary/40 transition-all duration-500" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-0">
            {/* Decorative vertical line - hidden on mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent z-0 hidden md:block" />

            {/* Main Carousel Container */}
            <div className="relative rounded-2xl sm:rounded-[2.5rem] border border-primary/10 bg-muted/5 p-2 sm:p-4 backdrop-blur-sm overflow-hidden shadow-inner">
                {/* Superior Fade Effects - Responsive */}
                <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b from-background via-background/60 to-transparent z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background via-background/60 to-transparent z-20 pointer-events-none" />

                {/* The Scroller - Mobile optimized height */}
                <div
                    className="h-[500px] sm:h-[600px] md:h-[700px] relative overflow-hidden focus:outline-none"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <motion.div
                        className="flex flex-col select-none"
                        animate={{
                            y: isPaused ? undefined : [0, -totalHeight],
                        }}
                        transition={{
                            y: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: BOARD_MEMBERS.length * 1.5,
                                ease: "linear",
                            },
                        }}
                        style={{
                            willChange: "transform",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            perspective: 1000,
                            WebkitPerspective: 1000,
                        }}
                    >
                        {duplicatedMembers.map((member, index) => renderMemberCard(member, index))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BoardMembersCarousel;
