import { forwardRef, InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
};

const baseClassName = "form-input";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", isInvalid, ...props }, ref) => {
    const classes = [baseClassName];

    if (isInvalid) {
      classes.push("form-input--invalid");
    }

    if (className) {
      classes.push(className);
    }

    return <input ref={ref} className={classes.join(" ")} {...props} />;
  },
);

Input.displayName = "Input";

export default Input;
