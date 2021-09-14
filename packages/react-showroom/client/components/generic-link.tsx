import * as React from 'react';
import { Link } from 'react-router-dom';
import { isExternalLink } from '../lib/is-external-link';

export const GenericLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'>
>(function GenericLink({ href, ...props }, ref) {
  if (href && href.startsWith('/')) {
    return <Link to={href} {...props} ref={ref} />;
  }
  const isExternal = isExternalLink(href);

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopenner' : undefined}
      {...props}
      ref={ref}
    />
  );
});
