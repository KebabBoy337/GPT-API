// Avatar generation utilities
export const AVATAR_COLORS = [
  'from-red-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-blue-500',
  'from-blue-400 to-purple-500',
  'from-purple-400 to-pink-500',
  'from-pink-400 to-red-500',
  'from-indigo-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
] as const;

export const AVATAR_ICONS = [
  '🤖', '👤', '🎭', '🎨', '🌟', '⚡', '🔥', '💎', '🚀', '🎯',
  '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪', '🎨', '🎭', '🎪'
] as const;

export function generateAvatar(username: string) {
  // Generate consistent color based on username
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const colorIndex = hash % AVATAR_COLORS.length;
  const iconIndex = hash % AVATAR_ICONS.length;
  
  return {
    color: AVATAR_COLORS[colorIndex],
    icon: AVATAR_ICONS[iconIndex],
    initials: username.slice(0, 2).toUpperCase()
  };
}

export function getAvatarGradient(username: string) {
  const avatar = generateAvatar(username);
  return `bg-gradient-to-br ${avatar.color}`;
}


