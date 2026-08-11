// Suggested avatar gallery for Sozlamalar - just a convenience shortcut,
// the user can always upload their own photo instead. Whichever they
// pick (preset path or an uploaded data: URL) gets stored the same way
// via lib/profile.ts's saveProfilePhoto - a preset is nothing more than
// a fixed string path into /public/avatars.
export const PRESET_AVATARS = [
  { id: 'hacker-boy-red', src: '/avatars/hacker-boy-red.jpg' },
  { id: 'anon-mask', src: '/avatars/anon-mask.jpg' },
  { id: 'coder-girl-pink', src: '/avatars/coder-girl-pink.jpg' },
  { id: 'headphones-boy', src: '/avatars/headphones-boy.jpg' },
  { id: 'padlock-boy', src: '/avatars/padlock-boy.jpg' },
  { id: 'coffee-boy', src: '/avatars/coffee-boy.jpg' },
  { id: 'ninja', src: '/avatars/ninja.jpg' },
  { id: 'panda-hacker', src: '/avatars/panda-hacker.jpg' },
  { id: 'teal-hoodie-boy', src: '/avatars/teal-hoodie-boy.jpg' },
  { id: 'skull-hacker', src: '/avatars/skull-hacker.jpg' },
  { id: 'bearded-dev', src: '/avatars/bearded-dev.jpg' },
  { id: 'pointing-boy', src: '/avatars/pointing-boy.jpg' },
  { id: 'developer-text', src: '/avatars/developer-text.jpg' },
  { id: 'coder-girl-purple', src: '/avatars/coder-girl-purple.jpg' },
  { id: 'coffee-mug-boy', src: '/avatars/coffee-mug-boy.jpg' }
];
