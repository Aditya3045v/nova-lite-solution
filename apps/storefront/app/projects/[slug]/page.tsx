import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Tag } from 'lucide-react';
import { formatDate } from '@novalite/shared';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductImage } from '@/components/common/ProductImage';
import { ButtonLink } from '@/components/common/Button';
import { ProjectCard } from '@/components/home/Sections';
import { getProject, getProjects } from '@/lib/data';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return { title: 'Project not found' };
  return { title: p.title, description: p.summary, alternates: { canonical: `/projects/${p.slug}` } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProject(slug), getProjects()]);
  if (!project) notFound();
  const results = Array.isArray(project.results) ? (project.results as { label: string; value: string }[]) : [];
  const more = all.filter((p) => p.id !== project.id).slice(0, 3);
  return (
    <article>
      <div className="container-x py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects' }, { label: project.title }]} />
        <header className="mt-6 max-w-3xl">
          {project.segment && <p className="text-sm font-semibold text-brand-600">{project.segment}</p>}
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance text-ink-950 sm:text-5xl">{project.title}</h1>
          <p className="mt-4 text-lg text-ink-500">{project.summary}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
            {project.client && <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-ink-400" />{project.client}</span>}
            {project.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-ink-400" />{project.location}</span>}
            {project.completed_on && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-ink-400" />{formatDate(project.completed_on)}</span>}
          </div>
        </header>
        <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-[28px] bg-ink-100">
          <ProductImage src={project.image_url} alt={project.title} priority sizes="100vw" className="object-cover" />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="text-[16px] leading-relaxed whitespace-pre-line text-ink-700">{project.body || project.summary}</div>
          <aside className="space-y-4">
            {results.length > 0 && (
              <div className="rounded-3xl bg-ink-950 p-6 text-white">
                <h2 className="text-xs font-bold tracking-[0.14em] text-brand-300 uppercase">Results</h2>
                <dl className="mt-4 space-y-4">
                  {results.map((r) => (
                    <div key={r.label}>
                      <dd className="font-display text-3xl font-extrabold">{r.value}</dd>
                      <dt className="text-sm text-ink-300">{r.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className="rounded-3xl border border-ink-100 p-6">
              <h2 className="font-display text-lg font-bold text-ink-950">Planning something similar?</h2>
              <p className="mt-1 text-sm text-ink-500">Tell us about your project and we will suggest the right products and quantities.</p>
              <ButtonLink href="/services#quote" className="mt-4">Request a quote</ButtonLink>
            </div>
          </aside>
        </div>
      </div>
      {more.length > 0 && (
        <section className="bg-ink-50/70 py-14">
          <div className="container-x">
            <h2 className="mb-6 font-display text-2xl font-bold text-ink-950">More projects</h2>
            <div className="grid gap-4 md:grid-cols-3">{more.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
