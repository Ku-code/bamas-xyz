import AdditiveDaysBanner from "@/components/AdditiveDaysBanner";
import BannerCube from "@/components/BannerCube";
import MachTechBanner from "@/components/MachTechBanner";
import IndustryInfoBanner from "@/components/IndustryInfoBanner";
import ImageBanner from "@/components/ImageBanner";

/** Accepted desktop carousel from 4c87a4e; keep its geometry and timing intact. */
export default function DesktopHomepageBanners() {
  return <BannerCube intervalMs={2000} faces={[
    <MachTechBanner key="machtech" />,
    <ImageBanner key="interdrone-expo" src="/banners/interdrone-expo-2026.gif"
      href="https://interdroneexpo.bg/online-ticket/"
      alt="INTER DRONE EXPO, 6–9 October 2026, Inter Expo Center — opens interdroneexpo.bg in a new tab" background="#C4CCB5" />,
    <IndustryInfoBanner key="industryinfo" />,
    <ImageBanner key="europm-2026" src="/banners/europm-2026.webp"
      href="https://www.europm2026.com/"
      alt="EURO PM2026 Congress & Exhibition, 11–14 October 2026, Budapest, Hungary — opens europm2026.com in a new tab" background="#0B1F2A" />,
    <AdditiveDaysBanner key="additive-days" />,
  ]} />;
}
