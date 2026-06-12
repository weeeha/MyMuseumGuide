function slug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cache-bucket key for a narrative (spec §5.3). Same artwork ⇒ same key,
 * regardless of how the photo was taken.
 */
export function artifactKey(title: string, artist?: string): string {
  return `${slug(title)}--${slug(artist ?? 'unknown')}`;
}
