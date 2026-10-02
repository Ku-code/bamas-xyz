import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const TermsOfUse = () => {

  const { t, language, setLanguage } = useLanguage();
  useDocumentMeta({
    title: language === 'bg' ? 'Условия за ползване | БАЗАП' : 'Terms of Use | BAMAS',
    description: language === 'bg'
      ? 'Условия за ползване на сайта и платформата на БАЗАП.'
      : 'Terms of use for the BAMAS website and platform.',
  });

  const content = {
    en: {
      title: "Terms of Use",
      lastUpdated: "Last Updated: October 2026",
      sections: [
        {
          title: "1. Agreement to Terms",
          content: `By accessing or using the website bamas.xyz (the "Website"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these Terms, then you may not access the Website.

These Terms apply to all visitors, users, and others who access or use the Website.`
        },
        {
          title: "2. Use License",
          content: `Permission is granted to temporarily download one copy of the materials on the Website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display (commercial or non-commercial)
- Attempt to decompile or reverse engineer any software contained on the Website
- Remove any copyright or other proprietary notations from the materials
- Transfer the materials to another person or "mirror" the materials on any other server

This license shall automatically terminate if you violate any of these restrictions and may be terminated by the Bulgarian Additive Manufacturing Association (BAMAS) at any time.`
        },
        {
          title: "3. Disclaimer",
          content: `The materials on the Website are provided on an "as is" basis. BAMAS makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

Further, BAMAS does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on the Website or otherwise relating to such materials or on any sites linked to this Website.`
        },
        {
          title: "4. Limitations",
          content: `In no event shall BAMAS or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Website, even if BAMAS or a BAMAS authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.`
        },
        {
          title: "5. Accuracy of Materials",
          content: `The materials appearing on the Website could include technical, typographical, or photographic errors. BAMAS does not warrant that any of the materials on its Website are accurate, complete, or current. BAMAS may make changes to the materials contained on its Website at any time without notice. However, BAMAS does not make any commitment to update the materials.`
        },
        {
          title: "6. Links",
          content: `BAMAS has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by BAMAS of the site. Use of any such linked website is at the user's own risk.`
        },
        {
          title: "7. Modifications",
          content: `BAMAS may revise these Terms of Use for its Website at any time without notice. By using this Website, you are agreeing to be bound by the then current version of these Terms of Use.`
        },
        {
          title: "8. Governing Law",
          content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of Bulgaria, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
        },
        {
          title: "9. Membership Terms",
          content: `If you become a member of BAMAS:

- You agree to provide accurate and complete information during the registration process
- You are responsible for maintaining the confidentiality of your account credentials
- You agree to pay all applicable membership fees as specified
- Membership benefits are subject to change at BAMAS's discretion
- BAMAS reserves the right to suspend or terminate membership for violations of these Terms
- Refund policies are as specified in your membership agreement`
        },
        {
          title: "10. Intellectual Property",
          content: `All content on the Website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and software, is the property of BAMAS or its content suppliers and is protected by Bulgarian and international copyright laws.`
        },
        {
          title: "11. User Conduct",
          content: `You agree not to use the Website to:

- Violate any applicable laws or regulations
- Infringe upon the rights of others
- Transmit any harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable content
- Impersonate any person or entity
- Interfere with or disrupt the Website or servers
- Attempt to gain unauthorized access to any portion of the Website`
        },
        {
          title: "12. Contact Information",
          content: `If you have any questions about these Terms of Use, please contact us at:

Email: info@bamas.xyz
Phone: +359 889 536 699
Registered office: 1 Chukar Street, Vitosha District, Sofia 1616, Bulgaria
Legal entity: Bulgarian Additive Manufacturing Association, association, UIC 208630654`
        }
      ]
    },
    bg: {
      title: "Условия за използване",
      lastUpdated: "Последна актуализация: Октомври 2026",
      sections: [
        {
          title: "1. Съгласие с условията",
          content: `Чрез достъпване или използване на уебсайта bamas.xyz (наричан по-долу "Уебсайт"), вие се съгласявате да бъдете обвързани с тези Условия за използване ("Условия"). Ако не сте съгласни с някоя част от тези Условия, тогава не можете да достъпвате Уебсайта.

Тези Условия се прилагат към всички посетители, потребители и други, които достъпват или използват Уебсайта.`
        },
        {
          title: "2. Лиценз за използване",
          content: `Разрешението е дадено временно да изтеглите едно копие от материалите на Уебсайта само за лично, некомерсиално преходно преглеждане. Това е предоставяне на лиценз, а не прехвърляне на собственост, и под този лиценз не можете да:

- Модифицирате или копирате материалите
- Използвате материалите за каквато и да е комерсиална цел или за каквото и да е публично показване (комерсиално или некомерсиално)
- Опитвате се да декомпилирате или обратно инженерствате какъвто и да е софтуер, съдържащ се на Уебсайта
- Премахвате каквито и да е авторски права или други собственически обозначения от материалите
- Прехвърляте материалите на друго лице или "оглеждате" материалите на всеки друг сървър

Този лиценз автоматично ще бъде прекратен, ако нарушите някое от тези ограничения и може да бъде прекратен от Българската асоциация за адитивно производство (БАЗАП) по всяко време.`
        },
        {
          title: "3. Отказ от отговорност",
          content: `Материалите на Уебсайта се предоставят на принципа "както са". БАЗАП не дава никакви гаранции, изрични или подразбиращи се, и по този начин отрича и отхвърля всички други гаранции, включително, без ограничение, подразбиращи се гаранции или условия за търговска годност, пригодност за конкретна цел или ненарушаване на интелектуална собственост или друго нарушение на права.

Освен това, БАЗАП не гарантира или прави каквито и да е изявления относно точността, вероятните резултати или надеждността на използването на материалите на Уебсайта или иначе свързани с такива материали или на всякакви сайтове, свързани с този Уебсайт.`
        },
        {
          title: "4. Ограничения",
          content: `В никакъв случай БАЗАП или нейните доставчици не носят отговорност за каквито и да е щети (включително, без ограничение, щети за загуба на данни или печалба, или поради прекъсване на бизнеса), произтичащи от използването или невъзможността за използване на материалите на Уебсайта, дори ако БАЗАП или упълномощен представител на БАЗАП е бил уведомен устно или писмено за възможността за такава щета. Тъй като някои юрисдикции не позволяват ограничения върху подразбиращи се гаранции или ограничения на отговорността за последствени или случайни щети, тези ограничения може да не се прилагат към вас.`
        },
        {
          title: "5. Точност на материалите",
          content: `Материалите, появяващи се на Уебсайта, могат да включват технически, типографски или фотографски грешки. БАЗАП не гарантира, че някой от материалите на нейния Уебсайт е точен, пълен или актуален. БАЗАП може да прави промени в материалите, съдържащи се на нейния Уебсайт, по всяко време без предупреждение. Въпреки това, БАЗАП не поема никакво ангажиране да актуализира материалите.`
        },
        {
          title: "6. Връзки",
          content: `БАЗАП не е прегледала всички сайтове, свързани с нейния Уебсайт, и не носи отговорност за съдържанието на всеки такъв свързан сайт. Включването на всяка връзка не означава одобрение от БАЗАП на сайта. Използването на всеки такъв свързан уебсайт е на собствения риск на потребителя.`
        },
        {
          title: "7. Модификации",
          content: `БАЗАП може да преглежда тези Условия за използване на нейния Уебсайт по всяко време без предупреждение. Чрез използване на този Уебсайт, вие се съгласявате да бъдете обвързани с тогавашната текуща версия на тези Условия за използване.`
        },
        {
          title: "8. Приложимо право",
          content: `Тези Условия се управляват и тълкуват в съответствие със законите на Република България, без да се взема предвид нейните разпоредби за конфликт на законите. Нашето неспазване на някое право или разпоредба от тези Условия няма да се счита за отказ от тези права.`
        },
        {
          title: "9. Условия за членство",
          content: `Ако станете член на БАЗАП:

- Съгласявате се да предоставите точна и пълна информация по време на процеса на регистрация
- Вие сте отговорни за поддържането на конфиденциалността на вашите идентификационни данни за акаунт
- Съгласявате се да платите всички приложими такси за членство, както е посочено
- Предимствата от членството могат да бъдат променени по преценка на БАЗАП
- БАЗАП си запазва правото да спре или прекрати членството за нарушения на тези Условия
- Политиките за възстановяване са както е посочено във вашето споразумение за членство`
        },
        {
          title: "10. Интелектуална собственост",
          content: `Цялото съдържание на Уебсайта, включително, но не ограничено до текст, графики, лога, изображения, аудио клипове, цифрови изтегляния и софтуер, е собственост на БАЗАП или нейните доставчици на съдържание и е защитено от българските и международните закони за авторско право.`
        },
        {
          title: "11. Поведение на потребителя",
          content: `Съгласявате се да не използвате Уебсайта за:

- Нарушаване на каквито и да е приложими закони или разпоредби
- Нарушаване на правата на други
- Предаване на каквото и да е вредно, заплашително, злоупотребяващо, тормозящо, клеветническо, вулгарно, неприлично или иначе неприемливо съдържание
- Представяне като някое лице или организация
- Намеса или нарушаване на Уебсайта или сървърите
- Опит за получаване на неоторизиран достъп до всяка част от Уебсайта`
        },
        {
          title: "12. Информация за контакт",
          content: `Ако имате въпроси относно тези Условия за използване, моля, свържете се с нас на:

Имейл: info@bamas.xyz
Телефон: 0889 536 699
Седалище и адрес на управление: България, гр. София 1616, р-н Витоша, ул. „Чукар“ № 1
Юридическо лице: „БЪЛГАРСКА АСОЦИАЦИЯ ЗА АДИТИВНО ПРОИЗВОДСТВО“, сдружение, ЕИК 208630654`
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'bg' ? 'Назад към началото' : 'Back to Home'}
            </Button>
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {currentContent.title}
          </h1>
          <p className="text-muted-foreground mb-12">{currentContent.lastUpdated}</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  {section.title}
                </h2>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FooterSection
        translations={{}}
        socialLinks={{}}
        currentLanguage={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
};

export default TermsOfUse;
