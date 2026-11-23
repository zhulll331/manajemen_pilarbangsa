import React from 'react';
import Link from 'next/link';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}

export function Container({
  children,
  className = '',
  size = 'default',
}: ContainerProps) {
  const maxWidthClass =
    size === 'narrow'
      ? 'max-w-4xl'
      : size === 'wide'
        ? 'max-w-7xl'
        : 'max-w-6xl';

  return (
    <div className={`${maxWidthClass} mx-auto px-5 sm:px-8 w-full ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface SectionProps {
  children: React.ReactNode;
  tone?: 'white' | 'muted' | 'dark';
  className?: string;
  containerClassName?: string;
  containerSize?: 'default' | 'narrow' | 'wide';
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  bordered?: boolean;
}

export function Section({
  children,
  tone = 'white',
  className = '',
  containerClassName = '',
  containerSize = 'default',
  id,
  ariaLabel,
  ariaLabelledBy,
  bordered = false,
}: SectionProps) {
  const toneClass =
    tone === 'dark'
      ? 'bg-black text-white'
      : tone === 'muted'
        ? 'bg-gray-50 text-gray-900'
        : 'bg-white text-gray-900';

  const borderClass =
    bordered && tone !== 'dark' ? 'border-y border-gray-200/80' : '';

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`w-full py-14 md:py-20 ${toneClass} ${borderClass} ${className}`.trim()}
    >
      <Container size={containerSize} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
  headingId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  className = '',
  headingId,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const titleColor = tone === 'dark' ? 'text-white' : 'text-gray-900';
  const descColor = tone === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const eyebrowColor = tone === 'dark' ? 'text-[#FFD700]' : 'text-[#E31837]';

  return (
    <div className={`max-w-2xl space-y-3 ${alignClass} ${className}`.trim()}>
      {eyebrow && (
        <p className={`text-xs font-bold uppercase tracking-[0.14em] ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <h2
        id={headingId}
        className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${titleColor}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`text-base leading-relaxed ${descColor}`}>{description}</p>
      )}
    </div>
  );
}

export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: 'white' | 'muted';
  containerSize?: 'default' | 'narrow' | 'wide';
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  meta,
  actions,
  tone = 'muted',
  containerSize = 'default',
}: PageHeaderProps) {
  const bgClass = tone === 'white' ? 'bg-white' : 'bg-gray-50';

  return (
    <header className={`w-full border-b border-gray-200 ${bgClass} py-10 sm:py-14 md:py-16`}>
      <Container size={containerSize}>
        <div className="max-w-3xl space-y-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium"
            >
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 && (
                    <span aria-hidden="true" className="text-gray-300">
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837] rounded"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-semibold line-clamp-1">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E31837]">
              {eyebrow}
            </p>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
            {title}
          </h1>

          {description && (
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}

          {meta && <div className="pt-1">{meta}</div>}
          {actions && <div className="pt-2 flex flex-col sm:flex-row gap-3">{actions}</div>}
        </div>
      </Container>
    </header>
  );
}

export interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark-primary' | 'dark-secondary';
  className?: string;
  external?: boolean;
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
  className = '',
  external,
}: LinkButtonProps) {
  const isExternal = external ?? /^https?:\/\//i.test(href);

  const variantClass =
    variant === 'primary'
      ? 'bg-[#E31837] hover:bg-red-700 text-white'
      : variant === 'secondary'
        ? 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
        : variant === 'dark-primary'
          ? 'bg-white hover:bg-gray-100 text-gray-900'
          : 'bg-transparent hover:bg-white/10 text-white border border-white/30';

  const baseClass =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31837]';

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClass} ${variantClass} ${className}`.trim()}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={`${baseClass} ${variantClass} ${className}`.trim()}>
      {children}
    </Link>
  );
}
