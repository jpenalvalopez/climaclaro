import React from "react";
import HeroSection from "../components/home/HeroSection";
import HowItWorks from "../components/home/HowItWorks";
import TrustBadges from "../components/home/TrustBadges";
import FeaturedProducts from "../components/home/FeaturedProducts";
import FeaturedServices from "../components/home/FeaturedServices";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import PromoCarousel from "../components/products/PromoCarousel";

export default function Home() {
  return (
    <div>
      {/* Carrusel SOLO en móvil, justo debajo del header antes del hero */}
      <div className="md:hidden">
        <PromoCarousel page="home" />
      </div>
      <HeroSection />
      <HowItWorks />
      <FeaturedProducts className="pt-3 pb-2 px-4 md:hidden" />
      <FeaturedServices />
      <TrustBadges />
      <TestimonialsSection />
      <CTASection />
    </div>);

}