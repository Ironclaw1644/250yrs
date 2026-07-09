import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import type { Category } from "@/lib/brand";

/** Circular photo category tile (mockup style) with gold ring + navy label. */
export function CategoryCircle({
  category,
  href,
}: {
  category: Category;
  href: string;
}) {
  return (
    <Link href={href} className="group flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28">
      <span className="relative block h-20 w-20 overflow-hidden rounded-full ring-[3px] ring-gold shadow-card transition-transform duration-std ease-warm group-hover:-translate-y-1 sm:h-24 sm:w-24">
        <Image
          src={`/images/categories/${category.slug}.webp`}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover"
        />
        {/* icon fallback layer under the image (visible if the image 404s) */}
        <span className="absolute inset-0 -z-10 grid place-items-center bg-navy">
          <Icon name={category.icon} className="text-xl text-gold" />
        </span>
      </span>
      <span className="text-center font-heading text-small font-semibold leading-tight text-navy group-hover:text-barn">
        {category.name}
      </span>
    </Link>
  );
}
