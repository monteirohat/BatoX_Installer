// One of the three columns of the main screen, in the style of balenaEtcher:
// a round icon on top, the step title, and the step's content below.

import type { ReactNode } from "react";
import { CheckIcon } from "./Icons";

interface Props {
  number: number;
  title: string;
  icon: ReactNode;
  complete: boolean;
  children: ReactNode;
}

export function StepCard({ number, title, icon, complete, children }: Props) {
  return (
    <section className={"step" + (complete ? " step-complete" : "")} aria-label={`Step ${number}: ${title}`}>
      <div className="step-icon" aria-hidden="true">
        {icon}
        {complete && <span className="step-check"><CheckIcon size={14} /></span>}
      </div>
      <h2 className="step-title"><span className="step-number">{number}</span>{title}</h2>
      <div className="step-body">{children}</div>
    </section>
  );
}
