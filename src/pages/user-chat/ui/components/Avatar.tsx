import { cn } from '../../../../lib/utils';

type AvatarProps = {
  name: string;
  image?: string;
  size?: number;
  ring?: boolean;
};

export const Avatar = ({ name, image, size = 40, ring = false }: AvatarProps) => {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'shrink-0 rounded-full bg-slate-200 text-slate-700 grid place-items-center overflow-hidden',
        ring ? 'ring-2 ring-primary ring-offset-2 ring-offset-white' : 'ring-1 ring-slate-200'
      )}
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
};
