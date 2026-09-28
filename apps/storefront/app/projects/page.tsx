import type { Metadata } from 'next';
import { PageHero } from '@/components/common/Section';
import { DealerCta, ProjectCard } from '@/components/home/Sections';
import { getProjects } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Projects and case studies',
  description: 'See how shops, clinics, warehouses and institutions use Novalite lighting to save power and stay lit through outages.',
  alternates: { canonical: '/projects' },
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <PageHero eyebrow="Projects" title="Work we are proud of" description="Real installations and supply projects across Eastern India." />
      <section className="container-x py-16 sm:py-20">
        {projects.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <p className="text-center text-ink-500">Case studies are coming soon.</p>
        )}
      </section>
      <DealerCta />
    </>
  );
}
