"use client";
import React from "react";
import { cn } from "@/utils/tailwind-helpers";
import Image from "next/image";
import Link from "next/link";
import * as fonts from "@/styles/fonts";

type Variants = "primary" | "secondary" | "tertiary";

type CommonProps = {
  children?: React.ReactNode;
  className?: string;
  variant: Variants;
  asChild?: boolean;
  hasIcon?: boolean;
  iconSrc?: string;
  iconSize?: number;
  isNav?: boolean;
  href?: string;
  downloadName?: string;
};

type ButtonProps =
  | ({ isNav?: false } & CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ isNav: true; href: string } & CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>);

function Button(props: ButtonProps, ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>) {
  const children = props.children;
  const variant = props.variant || "primary";
  const isNav = props.isNav !== undefined ? props.isNav : true;
  const hasIcon = props.hasIcon || false;
  const iconSrc = props.iconSrc || "";
  const iconSize = props.iconSize || 32;
  const className = props.className;

  const base_style = "inline-flex items-center " + fonts.bricolage_grot600.className + " text-[1.2rem] justify-center gap-3 rounded-full text-background px-6 py-5 focus:outline-none hover:-translate-y-1 hover:cursor-pointer transition-all duration-300 ";

  const variantStyles = {
    primary: " bg-joh-blue hover:bg-blue-950 ",
    secondary: " bg-joh-blue-secondary ",
    tertiary: " bg-background text-joh-blue",
  };

  const variantClass = variantStyles[variant];

  if (isNav && "href" in props) {
    const href = props.href || "";
    const downloadName = props.downloadName;

    if (downloadName) {
      return React.createElement(
        "a",
        {
          className: cn(base_style, variantClass, className),
          download: downloadName,
          ref: ref as React.Ref<HTMLAnchorElement>,
          href: href,
        },
        children,
        hasIcon && React.createElement(Image, { src: iconSrc, width: iconSize, height: iconSize, alt: "button icon" })
      );
    }

    return React.createElement(
      Link,
      {
        className: cn(base_style, variantClass, className),
        ref: ref as React.Ref<HTMLAnchorElement>,
        href: href,
      },
      children,
      hasIcon && React.createElement(Image, { src: iconSrc, width: iconSize, height: iconSize, alt: "button icon" })
    );
  }

  return React.createElement(
    "button",
    {
      className: cn(base_style, variantClass, className),
      ref: ref as React.Ref<HTMLButtonElement>,
    },
    children,
    hasIcon && React.createElement(Image, { src: iconSrc, width: iconSize, height: iconSize, alt: "button icon" })
  );
}

const ButtonWithRef = React.forwardRef(Button);
ButtonWithRef.displayName = "Button Component";
export default ButtonWithRef;