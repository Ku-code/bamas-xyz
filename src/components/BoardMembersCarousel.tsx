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
        image: "/no background images members/КУЗО ДОНЧЕВ.png",
    },
    {
        nameBg: "БОЯН ПЕХЛИВАНОВ",
        nameEn: "BOYAN PEHLIVANOV",
        roleBg: "Заместник-председател",
        roleEn: "Vice Chairman",
        image: "/no background images members/БОЯН ПЕХЛИВАНОВ .png",
    },
    {
        nameBg: "НИКОЛАЙ ЙОРДАНОВ",
        nameEn: "NIKOLAY YORDANOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/НИКОЛАЙ ЙОРДАНОВ.png",
    },
    {
        nameBg: "КРАСИМИР ГЕОРГИЕВ",
        nameEn: "KRASIMIR GEORGIEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/КРАСИМИР ГЕОРГИЕВ.png",
    },
    {
        nameBg: "ЛЮБОМИР ГЕРАСИМОВ",
        nameEn: "LYUBOMIR GERASIMOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/ЛЮБОМИР ГЕРАСИМОВ .png",
    },
    {
        nameBg: "ВАСИЛ НИКОЛОВ",
        nameEn: "VASIL NIKOLOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "/no background images members/ВАСИЛ  НИКОЛОВ.png",
    },
    {
        nameBg: "АНДРЕЙ ДУНИЦОВ",
        nameEn: "ANDREY DUNITSOV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "",
    },
    {
        nameBg: "ГЕОРГИ ТОЛЕВ",
        nameEn: "GEORGI TOLEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "",
    },
    {
        nameBg: "ДАНИЕЛ ХРИСТЕВ",
        nameEn: "DANIEL HRISTEV",
        roleBg: "Член на УС",
        roleEn: "Board Member",
        image: "",
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

    // Double the array for seamless transition
    const duplicatedMembers = [...BOARD_MEMBERS, ...BOARD_MEMBERS];

    const renderMemberCard = (member: BoardMember, index: number) => {
        const name = language === "bg" ? member.nameBg : member.nameEn;
        const role = language === "bg" ? member.roleBg : member.roleEn;

        return (
            <div
                key={`${member.nameEn}-${index}`}
                className="w-full p-4 h-[240px] flex-shrink-0"
            >
                <div className="relative h-full overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] bg-gradient-to-br from-primary/15 via-primary/10 to-background border-2 border-primary/30 hover:border-primary/50">
                    <div className="flex items-center p-6 gap-6 h-full">
                        {/* Member Image */}
                        <div className="relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary/70 to-primary/40 p-1 shadow-lg">
                                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                                    {member.image ? (
                                        <img
                                            src={member.image}
                                            alt={name}
                                            className="w-full h-full object-cover object-top"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                                            <span className="text-4xl md:text-5xl font-bold text-primary/50">
                                                {name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Member Info */}
                        <div className="flex-grow">
                            <div className="inline-block px-4 py-1 rounded-full mb-3 bg-primary/20 border border-primary/30">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wide">{role}</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">
                                {name}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto overflow-hidden">
            {/* Gradient overlays for smooth fade effect */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />

            {/* Scrolling container using Framer Motion */}
            <div
                className="h-[600px] overflow-hidden cursor-pointer"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <motion.div
                    className="flex flex-col"
                    animate={{
                        y: isPaused ? undefined : [0, -BOARD_MEMBERS.length * 240],
                    }}
                    transition={{
                        y: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: BOARD_MEMBERS.length * 4, // 4 seconds per card for smooth pace
                            ease: "linear",
                        },
                    }}
                >
                    {duplicatedMembers.map((member, index) => renderMemberCard(member, index))}
                </motion.div>
            </div>
        </div>
    );
};

export default BoardMembersCarousel;
