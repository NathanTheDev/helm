"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type TooltipSide = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
  delay?: number;
  disabled?: boolean;
};

const GAP = 8;

const TRANSFORM: Record<TooltipSide, string> = {
  top: "translate(-50%, -100%)",
  bottom: "translate(-50%, 0)",
  left: "translate(-100%, -50%)",
  right: "translate(0, -50%)",
};

function computeCoords(rect: DOMRect, side: TooltipSide) {
  switch (side) {
    case "top":
      return { top: rect.top - GAP, left: rect.left + rect.width / 2 };
    case "bottom":
      return { top: rect.bottom + GAP, left: rect.left + rect.width / 2 };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - GAP };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + GAP };
  }
}

/**
 * Wraps a single focusable/hoverable child and shows a small label near it
 * on hover or keyboard focus. Renders into document.body via portal so it
 * never gets clipped by an ancestor's overflow:hidden.
 */
export function Tooltip({ content, children, side = "top", delay = 300, disabled = false }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function show() {
    if (disabled || !content) return;
    timeoutRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords(computeCoords(rect, side));
      setOpen(true);
    }, delay);
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }

  if (!isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;
  const existingRef = (children as unknown as { ref?: unknown }).ref;

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof existingRef === "function") existingRef(node);
      else if (existingRef && typeof existingRef === "object") {
        (existingRef as { current: HTMLElement | null }).current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
      hide();
    },
    "aria-describedby": open ? id : (childProps["aria-describedby"] as string | undefined),
  } as Record<string, unknown>);

  return (
    <>
      {trigger}
      {mounted &&
        open &&
        coords &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            className="pointer-events-none fixed z-50 whitespace-nowrap rounded-control bg-ink px-2 py-1 text-xs text-paper shadow-md"
            style={{ top: coords.top, left: coords.left, transform: TRANSFORM[side] }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
