import React, { createContext, useContext, useState, useCallback } from "react";
import { CustomAlert } from "./CustomAlert";

interface AlertOptions {
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  primaryButton?: {
    text: string;
    onPress?: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress?: () => void;
  };
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const handlePrimaryAction = () => {
    if (config.primaryButton?.onPress) {
      config.primaryButton.onPress();
    }
    hideAlert();
  };

  const handleSecondaryAction = () => {
    if (config.secondaryButton?.onPress) {
      config.secondaryButton.onPress();
    }
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        type={config.type}
        primaryButtonText={config.primaryButton?.text}
        onPrimaryAction={handlePrimaryAction}
        secondaryButtonText={config.secondaryButton?.text}
        onSecondaryAction={config.secondaryButton ? handleSecondaryAction : undefined}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
