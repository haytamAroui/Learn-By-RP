import React, { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LINGO_ARTWORK } from '../design/lingoArtwork';

/** Exact reference vector assets, with local gradient IDs for repeated route instances. */
export function ReferenceArtwork({ kind, shaded = false }: {
  kind: keyof typeof LINGO_ARTWORK; shaded?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const xml = useMemo(() => {
    let svg = LINGO_ARTWORK[kind] as string;
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
    for (const original of ids) svg = svg.replaceAll(`id="${original}"`, `id="${id}${original}"`)
      .replaceAll(`url(#${original})`, `url(#${id}${original})`);
    return svg;
  }, [kind, id]);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
    <SvgXml xml={xml} width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false} />
    {shaded ? <View className="absolute inset-0 bg-black/55" /> : null}
  </View>;
}
