import { Image } from 'react-native';
import { usePhoto } from '../lib/files';
import type { Person } from '../lib/types';
import { useTheme } from '../theme';
import { Avatar } from './ui';

function initialsOf(name?: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/** A person's photo when they have one, otherwise their initials. */
export function PersonAvatar({ person, name, size = 38, square }: { person?: Person | null; name?: string; size?: number; square?: boolean }) {
  const { t } = useTheme();
  const uri = usePhoto(person?.photoUrl);
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: square ? size * 0.33 : size / 2 }} />;
  }
  return <Avatar initials={initialsOf(person?.fullName || name)} color={t.petrol} size={size} square={square} />;
}
