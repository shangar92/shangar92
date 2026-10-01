import { memo, useState } from 'react';
import { Image, View } from 'react-native';

// The header picture: a gas flare and storage tanks at dusk, with a worker walking home.
// It is drawn on the band y = 140 .. 500 of a 390-wide design; the ground line with the
// worker and the house sits just above y = 440.
const SRC = require('../../assets/header-bg.jpg');
const W = 390;
const H = 360;
const GROUND = 300; // y = 440 in the picture

type Props = {
  height: number;
  /** How much of the bottom is hidden under cards; the scene's ground sits just above it. */
  covered?: number;
};

/** Fills its container's width and keeps the flare, the tanks and the worker in the visible part. */
export const OilfieldScene = memo(function OilfieldScene({ height, covered = 0 }: Props) {
  const [width, setWidth] = useState(0);
  const scale = Math.max(width / W, height / H);
  const top = Math.min(0, Math.max(height - H * scale, height - covered - GROUND * scale));
  return (
    <View style={{ width: '100%', height, overflow: 'hidden' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Image
          source={SRC}
          style={{ position: 'absolute', width: W * scale, height: H * scale, left: (width - W * scale) / 2, top }}
        />
      ) : null}
    </View>
  );
});
