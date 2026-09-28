import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-[#05251c] shadow-soft hover:bg-primary-bright",
        outline:
          "border border-line-strong bg-transparent text-foreground hover:border-primary hover:text-primary",
        ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface-2",
        soft: "bg-primary-soft text-primary hover:bg-primary-soft/70",
        surface: "border border-line-strong bg-surface text-foreground hover:bg-surface-2",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  external?: boolean;
  type?: never;
  onClick?: () => void;
};

type ButtonAsButton = ButtonBaseProps & {
  href?: never;
  external?: never;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

export function Button(props: ButtonProps) {
  const { variant, size, className, children, ariaLabel } = props;

  const classes = cn(buttonVariants({ variant, size }), className);

  if (props.href) {
    const { href, external, onClick } = props;
    if (external) {
      return (
        <a
          href={href}
          aria-label={ariaLabel}
          onClick={onClick}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} aria-label={ariaLabel} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button
      type={buttonProps.type ?? "button"}
      onClick={buttonProps.onClick}
      disabled={buttonProps.disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
