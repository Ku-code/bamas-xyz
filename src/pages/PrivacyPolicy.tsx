import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const PrivacyPolicy = () => {

  const { t, language, setLanguage } = useLanguage();
  useDocumentMeta({
    title: language === 'bg' ? 'Политика за поверителност | БАЗАП' : 'Privacy Policy | BAMAS',
    description: language === 'bg'
      ? 'Как БАЗАП събира, използва и защитава личните данни.'
      : 'How BAMAS collects, uses and protects personal data.',
  });

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: October 2026",
      sections: [
        {
          title: "1. Introduction",
          content: `The Bulgarian Additive Manufacturing Association ("BAMAS", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website bamas.xyz (the "Website"). Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Website.`
        },
        {
          title: "2. Information We Collect",
          content: `We may collect information about you in a variety of ways. The information we may collect on the Website includes:

Personal Data: Personally identifiable information, such as your name, email address, phone number, and mailing address, that you voluntarily give to us when you register for membership, subscribe to our newsletter, or contact us through the Website.

Derivative Data: Information our servers automatically collect when you access the Website, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Website.

Financial Data: Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Website.

Mobile Device Data: Device information, such as your mobile device ID, model, and manufacturer, and information about the location of your device, if you access the Website from a mobile device.`
        },
        {
          title: "3. Use of Your Information",
          content: `Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Website to:

- Create and manage your account
- Process your membership applications and payments
- Email you regarding your account or membership
- Fulfill and manage purchases, orders, payments, and other transactions related to the Website
- Generate a personal profile about you to make future visits more personalized
- Increase the efficiency and operation of the Website
- Monitor and analyze usage and trends to improve your experience with the Website
- Notify you of updates to the Website
- Perform other business activities as needed
- Request feedback and contact you about your use of the Website
- Resolve disputes and troubleshoot problems
- Respond to product and customer service requests
- Send you a newsletter
- Solicit support for the Website`
        },
        {
          title: "4. Disclosure of Your Information",
          content: `We may share information we have collected about you in certain situations. Your information may be disclosed as follows:

By Law or to Protect Rights: If we believe the release of information about you is necessary to respond to legal process, to investigate, prevent, or take action regarding illegal activities, suspected fraud, situations involving potential threats to the physical safety of any person, violations of our Terms of Use, or as otherwise required by law.

Third-Party Service Providers: We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.

Business Transfers: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.

Affiliates: We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.

Other Third Parties: We may share your information with advertisers and investors for the purpose of conducting general business analysis.`
        },
        {
          title: "5. Security of Your Information",
          content: `We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.`
        },
        {
          title: "6. Policy for Children",
          content: `We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible. If you believe we might have any information from or about a child under 13, please contact us at info@bamas.xyz.`
        },
        {
          title: "7. Your Rights",
          content: `Depending on your location, you may have the following rights regarding your personal information:

- The right to access – You have the right to request copies of your personal data
- The right to rectification – You have the right to request that we correct any information you believe is inaccurate
- The right to erasure – You have the right to request that we erase your personal data, under certain conditions
- The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions
- The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions
- The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions

If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at info@bamas.xyz.`
        },
        {
          title: "8. Cookies and Tracking Technologies",
          content: `We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Website to help customize the Website and improve your experience. For more information on how we use cookies, please refer to our Cookie Policy.`
        },
        {
          title: "9. Changes to This Privacy Policy",
          content: `We may update this Privacy Policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.`
        },
        {
          title: "10. Contact Us",
          content: `If you have questions or comments about this Privacy Policy, please contact us at:

Email: info@bamas.xyz
Phone: +359 889 536 699
Registered office: 1 Chukar Street, Vitosha District, Sofia 1616, Bulgaria
Legal entity: Bulgarian Additive Manufacturing Association, association, UIC 208630654`
        }
      ]
    },
    bg: {
      title: "Политика за поверителност",
      lastUpdated: "Последна актуализация: Октомври 2026",
      sections: [
        {
          title: "1. Въведение",
          content: `Българската асоциация за адитивно производство ("БАЗАП", "ние", "нас" или "наш") се ангажира да защитава вашата поверителност. Тази Политика за поверителност обяснява как събираме, използваме, разкриваме и защитаваме вашата информация, когато посещавате нашия уебсайт bamas.xyz (наричан по-долу "Уебсайт"). Моля, прочетете внимателно тази Политика за поверителност. Ако не сте съгласни с условията на тази Политика за поверителност, моля, не достъпвайте Уебсайта.`
        },
        {
          title: "2. Информация, която събираме",
          content: `Може да събираме информация за вас по различни начини. Информацията, която можем да събираме на Уебсайта, включва:

Лични данни: Лично идентифицируема информация, като вашето име, имейл адрес, телефонен номер и пощенски адрес, която доброволно ни предоставяте, когато се регистрирате за членство, абонирате се за нашия бюлетин или се свържете с нас чрез Уебсайта.

Производни данни: Информация, която нашите сървъри автоматично събират, когато достъпвате Уебсайта, като вашия IP адрес, тип браузър, операционна система, времена на достъп и страниците, които сте прегледали директно преди и след достъпване на Уебсайта.

Финансови данни: Финансова информация, като данни, свързани с вашия метод на плащане (напр. валиден номер на кредитна карта, марка на картата, дата на изтичане), която можем да събираме, когато закупувате, поръчвате, връщате, обменяте или искате информация за нашите услуги от Уебсайта.

Данни от мобилни устройства: Информация за устройството, като ID на вашето мобилно устройство, модел и производител, и информация за местоположението на вашето устройство, ако достъпвате Уебсайта от мобилно устройство.`
        },
        {
          title: "3. Използване на вашата информация",
          content: `Притежаването на точна информация за вас ни позволява да ви осигурим плавно, ефективно и персонализирано изживяване. По-конкретно, можем да използваме информация, събрана за вас чрез Уебсайта, за да:

- Създаваме и управляваме вашия акаунт
- Обработваме вашите заявления за членство и плащания
- Изпращаме имейли относно вашия акаунт или членство
- Изпълняваме и управляваме покупки, поръчки, плащания и други транзакции, свързани с Уебсайта
- Генерираме личен профил за вас, за да направим бъдещите посещения по-персонализирани
- Увеличаваме ефективността и работата на Уебсайта
- Наблюдаваме и анализираме използването и тенденциите, за да подобрим вашето изживяване с Уебсайта
- Уведомяваме ви за актуализации на Уебсайта
- Извършваме други бизнес дейности, когато е необходимо
- Искаме обратна връзка и се свързваме с вас относно вашето използване на Уебсайта
- Разрешаваме спорове и решаваме проблеми
- Отговаряме на заявки за продукти и обслужване на клиенти
- Изпращаме ви бюлетин
- Търсим подкрепа за Уебсайта`
        },
        {
          title: "4. Разкриване на вашата информация",
          content: `Може да споделяме информация, която сме събрали за вас в определени ситуации. Вашата информация може да бъде разкрита, както следва:

По закон или за защита на права: Ако смятаме, че разкриването на информация за вас е необходимо, за да отговорим на правен процес, да разследваме, предотвратим или предприемем действия относно незаконни дейности, подозрително измамничество, ситуации, включващи потенциални заплахи за физическата безопасност на всяко лице, нарушения на нашите Условия за използване, или както се изисква по друг начин от закона.

Доставчици на услуги от трети страни: Може да споделяме вашата информация с трети страни, които извършват услуги за нас или от наше име, включително обработка на плащания, анализ на данни, доставка на имейли, хостинг услуги, обслужване на клиенти и маркетингова подкрепа.

Бизнес трансфери: Може да споделяме или прехвърляме вашата информация във връзка с или по време на преговори за всяко сливане, продажба на активи на компанията, финансиране или придобиване на цялата или част от нашия бизнес от друга компания.

Афилирани компании: Може да споделяме вашата информация с нашите афилирани компании, като в този случай ще изискаме тези афилирани компании да спазват тази Политика за поверителност.

Други трети страни: Може да споделяме вашата информация с рекламодатели и инвеститори с цел провеждане на общ бизнес анализ.`
        },
        {
          title: "5. Сигурност на вашата информация",
          content: `Използваме административни, технически и физически мерки за сигурност, за да помогнем да защитим вашата лична информация. Въпреки че сме предприели разумни стъпки за защита на личната информация, която ни предоставяте, моля, имайте предвид, че въпреки нашите усилия, няма перфектни или непроницаеми мерки за сигурност и никой метод за предаване на данни не може да бъде гарантиран срещу всякакви прихващания или друг вид злоупотреба. Всяка информация, разкрита онлайн, е уязвима на прихващане и злоупотреба от неоторизирани страни. Следователно не можем да гарантираме пълна сигурност, ако предоставите лична информация.`
        },
        {
          title: "6. Политика за деца",
          content: `Ние умишлено не търсим информация от или не правим маркетинг към деца под 13-годишна възраст. Ако научим, че сме събрали лична информация от дете под 13 години без проверка на родителското съгласие, ще изтрием тази информация възможно най-бързо. Ако смятате, че може да имаме информация от или за дете под 13 години, моля, свържете се с нас на info@bamas.xyz.`
        },
        {
          title: "7. Вашите права",
          content: `В зависимост от вашето местоположение, може да имате следните права относно вашата лична информация:

- Правото на достъп – Имате правото да поискате копия на вашите лични данни
- Правото на коригиране – Имате правото да поискате да коригираме всяка информация, която смятате за неточна
- Правото на изтриване – Имате правото да поискате да изтрием вашите лични данни, при определени условия
- Правото на ограничаване на обработката – Имате правото да поискате да ограничим обработката на вашите лични данни, при определени условия
- Правото на възражение срещу обработката – Имате правото да възразите срещу нашата обработка на вашите лични данни, при определени условия
- Правото на преносимост на данните – Имате правото да поискате да прехвърлим данните, които сме събрали, към друга организация или директно към вас, при определени условия

Ако направите заявка, имаме един месец да ви отговорим. Ако искате да упражните някое от тези права, моля, свържете се с нас на info@bamas.xyz.`
        },
        {
          title: "8. Бисквитки и технологии за проследяване",
          content: `Може да използваме бисквитки, уеб маяки, пиксели за проследяване и други технологии за проследяване на Уебсайта, за да помогнем да персонализираме Уебсайта и да подобрим вашето изживяване. За повече информация относно това как използваме бисквитки, моля, вижте нашата Политика за бисквитки.`
        },
        {
          title: "9. Промени в тази Политика за поверителност",
          content: `Може да актуализираме тази Политика за поверителност от време на време, за да отразяваме промени в нашите практики или поради други оперативни, правни или регулаторни причини. Ще ви уведомим за всякакви промени, като публикуваме новата Политика за поверителност на тази страница и актуализираме датата на "Последна актуализация".`
        },
        {
          title: "10. Свържете се с нас",
          content: `Ако имате въпроси или коментари относно тази Политика за поверителност, моля, свържете се с нас на:

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

export default PrivacyPolicy;
