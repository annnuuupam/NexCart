import { createContext, useContext } from "react";

export const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}
