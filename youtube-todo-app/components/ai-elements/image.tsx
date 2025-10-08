import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Experimental_GeneratedImage } from 'ai';

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const AIImage = ({
  base64,
  mediaType,
  ...props
}: ImageProps) => (
  <Image
    {...props}
    alt={props.alt || 'Generated image'}
    className={cn(
      'h-auto max-w-full overflow-hidden rounded-md',
      props.className
    )}
    src={`data:${mediaType};base64,${base64}`}
    width={500}
    height={300}
    unoptimized
  />
);
