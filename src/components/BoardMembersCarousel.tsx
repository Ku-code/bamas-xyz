import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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

// Triplicate for seamless infinite loop
const INFINITE_MEMBERS = [...BOARD_MEMBERS, ...BOARD_MEMBERS, ...BOARD_MEMBERS];

const BoardMembersCarousel = () => {
    const { language } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const singleSetHeight = BOARD_MEMBERS.length * 240;

        const animate = () => {
            if (!container || isPaused) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            container.scrollTop += 1;

            if (container.scrollTop >= singleSetHeight) {
                container.scrollTop = container.scrollTop - singleSetHeight;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPaused]);

    const renderMemberCard = (member: BoardMember, index: number) => {
        const name = language === "bg" ? member.nameBg : member.nameEn;
        const role = language === "bg" ? member.roleBg : member.roleEn;

        return (
            <div
                key={`${member.nameEn}-${index}`}
                className="flex-shrink-0 w-full p-4"
            >
                <div className="relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-gradient-to-br from-primary/15 via-primary/10 to-background border-2 border-primary/30 hover:border-primary/50">
                    <div className="flex items-center p-6 gap-6">
                        {/* Member Image */}
                        <div className="relative flex-shrink-0 w-36 h-36 md:w-44 md:h-44">
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
                            <div className="inline-block px-4 py-1.5 rounded-full mb-3 bg-primary/20 border border-primary/30">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wide">{role}</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                                {name}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            {/* Gradient overlays for smooth fade effect */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-muted/30 to-transparent z-10 pointer-events-none" />

            {/* Scrolling container */}
            <div
                ref={containerRef}
                className="h-[550px] md:h-[650px] overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div className="flex flex-col">
                    {INFINITE_MEMBERS.map((member, index) => renderMemberCard(member, index))}
                </div>
            </div>
        </div>
    );
};

export default BoardMembersCarousel;
