import React from 'react';
import { ReferenceArtwork } from './ReferenceArtwork';

/** Maintained illustration entry point, now using the current user-selected art. */
export function NeighborhoodArtwork({ shaded = false }: { shaded?: boolean }) {
  return <ReferenceArtwork kind="city" shaded={shaded} />;
}
