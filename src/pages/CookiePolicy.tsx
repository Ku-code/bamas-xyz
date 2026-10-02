import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const CookiePolicy = () => {

  const { t, language, setLanguage } = useLanguage();
  useDocumentMeta({
    title: language === 'bg' ? 'Политика за бисквитки | БАЗАП' : 'Cookie Policy | BAMAS',
    description: language === 'bg'
      ? 'Какви бисквитки използва сайтът на БАЗАП и как да ги управлявате.'
      : 'Which cookies the BAMAS website uses and how to manage them.',
  });

  const content = {
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last Updated: October 2026",
      sections: [
        {
          title: "1. Introduction",
          content: `This Cookie Policy explains what cookies are and how we use them on our website bamas.xyz (the "Website"). You should read this policy so you can understand what type of cookies we use, the information we collect using cookies, and how that information is used.

By using the Website, you agree to the use of cookies in accordance with this Cookie Policy. If you do not agree to our use of cookies, you should set your browser settings accordingly or not use the Website.`
        },
        {
          title: "2. What Are Cookies",
          content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. Cookies are widely used to make websites work more efficiently and to provide information to the website owners.

Cookies allow a website to recognize your device and store some information about your preferences or past actions. This enables websites to provide you with a better, faster, and more personalized experience.`
        },
        {
          title: "3. How We Use Cookies",
          content: `We use cookies for the following purposes:

Essential Cookies: These cookies are necessary for the Website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.

Analytics Cookies: These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our Website. They help us to know which pages are the most and least popular and see how visitors move around the Website.

Functional Cookies: These cookies enable the Website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.

Targeting Cookies: These cookies may be set through our Website by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other websites.`
        },
        {
          title: "4. Types of Cookies We Use",
          content: `We use the following types of cookies:

Session Cookies: These are temporary cookies that are deleted when you close your browser. They help the Website remember what you did on the page prior to navigating away from it.

Persistent Cookies: These cookies remain on your device for a set period or until you delete them. They are activated each time you visit the Website.

First-Party Cookies: These are cookies set by the Website itself and can only be read by the Website.

Third-Party Cookies: These are cookies set by domains other than the Website. These are typically used for advertising and analytics purposes.`
        },
        {
          title: "5. Third-Party Cookies",
          content: `In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Website, deliver advertisements on and through the Website, and so on. These third parties may include:

- Analytics providers (e.g., Google Analytics)
- Advertising networks
- Social media platforms

These third parties may use cookies to collect information about your online activities across different websites. We do not control these third-party cookies, and they are subject to the respective third parties' privacy policies.`
        },
        {
          title: "6. Managing Cookies",
          content: `You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your browser settings.

Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit www.allaboutcookies.org.

Please note that if you choose to reject cookies, you may still use the Website, though your access to some functionality and areas of the Website may be restricted.`
        },
        {
          title: "7. Browser-Specific Instructions",
          content: `To manage cookies in your browser:

Chrome: Settings > Privacy and security > Cookies and other site data
Firefox: Options > Privacy & Security > Cookies and Site Data
Safari: Preferences > Privacy > Cookies and website data
Edge: Settings > Privacy, search, and services > Cookies and site permissions

Please note that the exact steps may vary depending on your browser version.`
        },
        {
          title: "8. Cookies We Use",
          content: `The specific cookies we use on the Website include:

Essential Cookies:
- Session management cookies
- Security cookies
- Load balancing cookies

Analytics Cookies:
- Google Analytics cookies (if applicable)
- Website performance monitoring cookies

Functional Cookies:
- Language preference cookies
- User interface customization cookies

We may update this list from time to time as we add or remove cookies from the Website.`
        },
        {
          title: "9. Do Not Track Signals",
          content: `Some browsers incorporate a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to have your online activity tracked. Currently, there is no standard for how DNT signals should be interpreted. As a result, our Website does not currently respond to DNT signals.`
        },
        {
          title: "10. Updates to This Cookie Policy",
          content: `We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies.`
        },
        {
          title: "11. Contact Us",
          content: `If you have any questions about our use of cookies or other technologies, please contact us at:

Email: info@bamas.xyz
Phone: +359 889 536 699
Registered office: 1 Chukar Street, Vitosha District, Sofia 1616, Bulgaria
Legal entity: Bulgarian Additive Manufacturing Association, association, UIC 208630654`
        }
      ]
    },
    bg: {
      title: "Политика за бисквитки",
      lastUpdated: "Последна актуализация: Октомври 2026",
      sections: [
        {
          title: "1. Въведение",
          content: `Тази Политика за бисквитки обяснява какво са бисквитките и как ги използваме на нашия уебсайт bamas.xyz (наричан по-долу "Уебсайт"). Трябва да прочетете тази политика, за да разберете какъв тип бисквитки използваме, информацията, която събираме чрез бисквитки, и как се използва тази информация.

Чрез използване на Уебсайта, вие се съгласявате с използването на бисквитки в съответствие с тази Политика за бисквитки. Ако не сте съгласни с нашето използване на бисквитки, трябва да настроите настройките на вашия браузър съответно или да не използвате Уебсайта.`
        },
        {
          title: "2. Какво са бисквитките",
          content: `Бисквитките са малки текстови файлове, които се поставят на вашия компютър или мобилно устройство, когато посещавате уебсайт. Бисквитките се използват широко, за да направят уебсайтовете да работят по-ефективно и да предоставят информация на собствениците на уебсайтовете.

Бисквитките позволяват на уебсайт да разпознае вашето устройство и да съхрани информация за вашите предпочитания или минали действия. Това позволява на уебсайтовете да ви осигурят по-добро, по-бързо и по-персонализирано изживяване.`
        },
        {
          title: "3. Как използваме бисквитки",
          content: `Използваме бисквитки за следните цели:

Основни бисквитки: Тези бисквитки са необходими за функционирането на Уебсайта и не могат да бъдат изключени в нашите системи. Обикновено се задават само в отговор на действия, направени от вас, които представляват заявка за услуги, като задаване на вашите настройки за поверителност, влизане или попълване на формуляри.

Аналитични бисквитки: Тези бисквитки ни позволяват да броим посещения и източници на трафик, за да можем да измерваме и подобряваме производителността на нашия Уебсайт. Те ни помагат да знаем кои страници са най-популярни и най-малко популярни и да видим как посетителите се движат из Уебсайта.

Функционални бисквитки: Тези бисквитки позволяват на Уебсайта да предостави подобрена функционалност и персонализация. Могат да бъдат зададени от нас или от доставчици на услуги от трети страни, чиито услуги сме добавили към нашите страници.

Целеви бисквитки: Тези бисквитки могат да бъдат зададени чрез нашия Уебсайт от нашите рекламни партньори. Могат да бъдат използвани от тези компании, за да изградят профил на вашите интереси и да ви покажат релевантни реклами на други уебсайтове.`
        },
        {
          title: "4. Видове бисквитки, които използваме",
          content: `Използваме следните видове бисквитки:

Сесийни бисквитки: Това са временни бисквитки, които се изтриват, когато затворите браузъра си. Те помагат на Уебсайта да запомни какво сте направили на страницата преди да напуснете от нея.

Постоянни бисквитки: Тези бисквитки остават на вашето устройство за определен период или докато ги изтриете. Те се активират всеки път, когато посещавате Уебсайта.

Бисквитки от първа страна: Това са бисквитки, зададени от самия Уебсайт и могат да бъдат прочетени само от Уебсайта.

Бисквитки от трети страни: Това са бисквитки, зададени от домейни, различни от Уебсайта. Те обикновено се използват за рекламни и аналитични цели.`
        },
        {
          title: "5. Бисквитки от трети страни",
          content: `В допълнение към нашите собствени бисквитки, можем също да използваме различни бисквитки от трети страни, за да докладваме статистика за използване на Уебсайта, да доставяме реклами на и чрез Уебсайта и т.н. Тези трети страни могат да включват:

- Доставчици на аналитика (напр. Google Analytics)
- Рекламни мрежи
- Платформи за социални медии

Тези трети страни могат да използват бисквитки, за да събират информация за вашите онлайн дейности в различни уебсайтове. Ние не контролираме тези бисквитки от трети страни и те са предмет на съответните политики за поверителност на третите страни.`
        },
        {
          title: "6. Управление на бисквитки",
          content: `Имате правото да решите дали да приемате или отхвърляте бисквитки. Можете да упражните правата си относно бисквитки, като зададете вашите предпочитания в настройките на вашия браузър.

Повечето уеб браузъри позволяват известен контрол на повечето бисквитки чрез настройките на браузъра. За да научите повече за бисквитките, включително как да видите какви бисквитки са зададени и как да ги управлявате и изтривате, посетете www.allaboutcookies.org.

Моля, имайте предвид, че ако решите да отхвърлите бисквитки, все още можете да използвате Уебсайта, въпреки че достъпът ви до някои функционалности и области на Уебсайта може да бъде ограничен.`
        },
        {
          title: "7. Инструкции за конкретен браузър",
          content: `За управление на бисквитки във вашия браузър:

Chrome: Настройки > Поверителност и сигурност > Бисквитки и други данни от сайтове
Firefox: Опции > Поверителност и сигурност > Бисквитки и данни от сайтове
Safari: Предпочитания > Поверителност > Бисквитки и данни от уебсайтове
Edge: Настройки > Поверителност, търсене и услуги > Бисквитки и разрешения за сайтове

Моля, имайте предвид, че точните стъпки могат да варират в зависимост от версията на вашия браузър.`
        },
        {
          title: "8. Бисквитки, които използваме",
          content: `Конкретните бисквитки, които използваме на Уебсайта, включват:

Основни бисквитки:
- Бисквитки за управление на сесии
- Бисквитки за сигурност
- Бисквитки за балансиране на натоварването

Аналитични бисквитки:
- Бисквитки на Google Analytics (ако е приложимо)
- Бисквитки за мониторинг на производителността на уебсайта

Функционални бисквитки:
- Бисквитки за предпочитания за език
- Бисквитки за персонализация на потребителския интерфейс

Може да актуализираме този списък от време на време, тъй като добавяме или премахваме бисквитки от Уебсайта.`
        },
        {
          title: "9. Сигнали за не проследяване",
          content: `Някои браузъри включват функция "Не проследявай" (DNT), която сигнализира на уебсайтовете, които посещавате, че не искате вашата онлайн дейност да бъде проследявана. В момента няма стандарт за това как трябва да се тълкуват DNT сигналите. В резултат на това нашият Уебсайт в момента не отговаря на DNT сигнали.`
        },
        {
          title: "10. Актуализации на тази Политика за бисквитки",
          content: `Може да актуализираме тази Политика за бисквитки от време на време, за да отразяваме промени в бисквитките, които използваме, или поради други оперативни, правни или регулаторни причини. Моля, затова периодично преглеждайте тази Политика за бисквитки, за да сте информирани за нашето използване на бисквитки.`
        },
        {
          title: "11. Свържете се с нас",
          content: `Ако имате въпроси относно нашето използване на бисквитки или други технологии, моля, свържете се с нас на:

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

export default CookiePolicy;
