import { useEffect } from 'react';
import { useSession } from '../state/useSession';
import { applyTheme, themeForMuseum } from '../theme/museumThemes';

/**
 * Applies the active museum's design tokens (spec §6.2) as --ml-* CSS
 * variables. Renders nothing. The full ink-spine restyle consumes these in
 * R2–R4; in R1 the streaming cursor and Listen button already do.
 */
export function MuseumThemeController() {
  const museumId = useSession((s) => s.museum?.id);
  useEffect(() => {
    applyTheme(themeForMuseum(museumId));
  }, [museumId]);
  return null;
}
