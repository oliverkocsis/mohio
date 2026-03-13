import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      {props.children}
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M2.5 5.75a1.75 1.75 0 0 1 1.75-1.75h3.1c.5 0 .98.2 1.32.55l.9.95c.17.17.4.27.64.27h5.54A1.75 1.75 0 0 1 17.5 7.5v6.25a1.75 1.75 0 0 1-1.75 1.75H4.25A1.75 1.75 0 0 1 2.5 13.75V5.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M6.25 2.5h4.72c.46 0 .9.18 1.23.51l2.79 2.79c.33.33.51.77.51 1.23v7.72A2.25 2.25 0 0 1 13.25 17h-7A2.25 2.25 0 0 1 4 14.75v-10.0A2.25 2.25 0 0 1 6.25 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M11 2.75V6.5h3.75" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ChevronIcon({ className, ...props }: IconProps) {
  return (
    <IconBase className={className} {...props}>
      <path d="m7 5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 4.75A1.75 1.75 0 0 1 5.75 3h8.5A1.75 1.75 0 0 1 16 4.75v6.5A1.75 1.75 0 0 1 14.25 13H9.5L6 16v-3H5.75A1.75 1.75 0 0 1 4 11.25v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="m3 9.75 12.94-5.56c.66-.28 1.31.37 1.03 1.03L11.4 18.16c-.28.66-1.24.6-1.44-.08l-1.14-4.03a1 1 0 0 0-.68-.68L4.11 12.2c-.68-.2-.74-1.16-.08-1.44L16.25 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
