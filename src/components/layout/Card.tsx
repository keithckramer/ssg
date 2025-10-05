import { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}
