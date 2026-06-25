import type { UserProfile } from '@code-dual/shared';

interface AvatarProps {
  user: UserProfile;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl'
  };

  if (user.avatarUrl) {
    return (
      <img 
        src={user.avatarUrl} 
        alt={`${user.username}'s avatar`} 
        className={`object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Fallback to first letter
  const firstLetter = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className={`flex items-center justify-center bg-secondary text-foreground font-['JetBrains_Mono'] font-bold border border-border ${sizeClasses[size]} ${className}`}>
      {firstLetter}
    </div>
  );
}
