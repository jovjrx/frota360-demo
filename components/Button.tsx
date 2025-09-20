import * as React from "react";
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from "@chakra-ui/react";

export interface ButtonProps extends ChakraButtonProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <ChakraButton ref={ref} {...props}>
      {children}
    </ChakraButton>
  )
);

Button.displayName = "Button";

export { Button };
