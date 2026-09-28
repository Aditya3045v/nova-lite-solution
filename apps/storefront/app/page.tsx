import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Clock } from 'lucide-react';
import { HeroSection } from '@/components/home/HeroSection';
import {
  AboutTeaser, CategoryCards, DealerCta, FaqList, ProjectCard, ServicesGrid, TestimonialsSection, ValueProps, WhyChooseUs,
} from '@/components/home/Sections';
import { ProductGrid } from '@/components/product/ProductCard';
import { SectionHeading } from '@/components/common/Section';
import { ButtonLink } from '@/components/common/Button';
import { LeadForm } from '@/components/forms/LeadForm';
import {
  getBanners, getCategories, getFaqs, getFeaturedProducts, getNewestProducts, getProjects, getServices, getSettings, getTestimonials,
} from '@/lib/data';

export const revalidate = 300;

export default async function HomePage() {
  const [settings, hero, promo, categories, featured, newest, services, projects, testimonials, faqs] = await Promise.all([
    getSettings(), getBanners('hero'), getBanners('promo'), getCategories(), getFeaturedProducts(8), getNewestProducts(16),
    getServices(), getProjects(), getTestimonials(), getFaqs(),
  ]);
  const { business, storefront } = settings;
  const featuredIds = new Set(featured.map((f) => f.id));
  const fresh = newest.filter((n) => !featuredIds.has(n.id)).slice(0, 4);

  return (
    <>
      <h1 className="sr-only">{business.name}: {business.tagline}</h1>
      <HeroSection hero={hero} promo={promo} />
      <ValueProps items={storefront.value_props} />
      <CategoryCards categories={categories} />

      {featured.length > 0 && (
        <section className="container-x pb-16 sm:pb-20">
          <SectionHeading
            eyebrow="Best sellers"
            title="Popular with homes and shops"
            action={<Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-brand-600">Shop all <ArrowRight className="h-4 w-4" /></Link>}
          />
          <ProductGrid products={featured} />
        </section>
      )}

      <AboutTeaser description={business.description} stats={storefront.stats} name={business.short_name} />

      {services.length > 0 && (
        <section className="container-x py-16 sm:py-24">
          <SectionHeading eyebrow="What we do" title="More than a lighting brand" description="From a single bulb on WhatsApp to scheduled bulk supply for institutions, we handle it end to end." action={<ButtonLink href="/services" variant="outline">All services</ButtonLink>} />
          <ServicesGrid services={services} limit={6} />
        </section>
      )}

      {fresh.length === 4 && (
        <section className="container-x pb-8">
          <SectionHeading eyebrow="Just added" title="New in the range" />
          <ProductGrid products={fresh} />
        </section>
      )}

      <WhyChooseUs />

      {projects.length > 0 && (
        <section className="bg-ink-50/70 py-16 sm:py-24">
          <div className="container-x">
            <SectionHeading eyebrow="Projects" title="Recent work and case studies" description="How businesses and institutions use Novalite lighting to cut costs and stay lit through outages." action={<ButtonLink href="/projects" variant="outline">View all projects</ButtonLink>} />
            <div className="grid gap-4 md:grid-cols-3">
              {projects.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      <TestimonialsSection items={testimonials} />
      <DealerCta />

      {faqs.length > 0 && (
        <section className="container-x pb-16 sm:pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <SectionHeading eyebrow="FAQ" title="Questions, answered" description="Everything about ordering, warranty and becoming a dealer." action={<ButtonLink href="/faq" variant="outline" className="self-start">All FAQs</ButtonLink>} className="sm:flex-col sm:items-start sm:justify-start" />
            <FaqList faqs={faqs.slice(0, 5)} />
          </div>
        </section>
      )}

      <section className="border-t border-ink-100 bg-white py-16 sm:py-24" id="contact">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Contact" title="Talk to the Novalite team" description="Ask about products, bulk pricing or dealership. We usually reply within a few hours on working days." className="mb-6 sm:mb-8" />
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-brand-500" /><span>{business.address}</span></li>
              <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-brand-500" /><a href={`tel:${business.phone.replace(/\s/g, '')}`} className="font-semibold hover:text-brand-600">{business.phone}</a></li>
              <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-brand-500" /><span>{business.hours}</span></li>
            </ul>
            {business.map_embed && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-ink-100">
                <iframe title={`Map to ${business.name}`} src={business.map_embed} className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </div>
          <div className="rounded-[28px] border border-ink-100 bg-ink-50/50 p-5 sm:p-8">
            <LeadForm type="contact" subjects={['Product enquiry', 'Bulk or project quote', 'Warranty support', 'Something else']} />
          </div>
        </div>
      </section>
    </>
  );
}
