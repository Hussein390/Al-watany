'use client'
import { CHECK_ROLE, GET_DELIVERY_TASKS } from "@/backend/delivery";
import React, { createContext, ReactNode, useContext, useState, Dispatch, SetStateAction, useEffect, useCallback } from "react";

// Define the type for days


export type CreateDeliveryTask = {
  id: string
  environmentId: string,
  clientName: string,
  price: number,
  phone: string,
  image: string,
  deliveryCost: number,
  address: string,
  isReceived: boolean,
  isOnline: boolean,
  createdAt?: Date,
  updatedAt?: Date,
  user?: {
    name: string
  }
}


// Define the context value type
type IsOpenContextType = {
  tasks: CreateDeliveryTask[];
  setTasks: Dispatch<SetStateAction<CreateDeliveryTask[]>>;
  showAlert: (message: string, isSuccess?: boolean) => void;  // ✅ Added showAlert
  getTasks: (day?: number) => Promise<void>; // ✅ Added getTasks
};

// Create the context with a proper default value
const DataContext = createContext<IsOpenContextType>({
  tasks: [],
  setTasks: () => { },
  showAlert: () => { },
  getTasks: async (day?: number) => { },
});

// Create a provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<CreateDeliveryTask[]>([]);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [alertSuccessMessage, setAlertSuccessMessage] = React.useState<string | null>(null);

  function showAlert(message: string, isSuccess = false) {
    if (isSuccess) {
      setAlertSuccessMessage(message);
    } else {
      setAlertMessage(message);
    }
    setTimeout(() => {
      setAlertMessage(null);
      setAlertSuccessMessage(null);
    }, 5000);
  }

  const getTasks = useCallback(async (day: number = new Date().getDate()) => {
    const EnvId = localStorage.getItem("envId");

    if (!EnvId) {
      showAlert("Environment not found", false);
      return;
    }

    const res = await GET_DELIVERY_TASKS(EnvId, day);

    if (res instanceof Error && "message" in res) {
      showAlert(res.message, false);
      return;
    } else if (typeof res === "string") {
      showAlert(res, false);
      return;
    }

    setTasks(res as CreateDeliveryTask[]);
  }, []);

  async function isAllow() {
    const EnvId = localStorage.getItem("envId");

    if (!EnvId) {
      showAlert("Environment not found", false);
      return;
    }
    const res = await CHECK_ROLE(EnvId);
    if (typeof res === "string") {
      showAlert(res, false);
      return;
    }
    sessionStorage.setItem("userRole", JSON.stringify(res));
  }
  useEffect(() => {
    isAllow()
  }, [])
  return (
    <DataContext.Provider value={{ getTasks, setTasks, tasks, showAlert }}>
      {children}
      {(alertMessage || alertSuccessMessage) && (
        <div className={`fixed top-20 right-3 outline-2 ${alertSuccessMessage ? 'outline-green-600' : 'outline-red-600'}  outline rounded-md z-50`}>
          <div className="bg-white p-4 rounded shadow-md max-w-sm text-center">
            <p className="text-black font-semibold">{alertSuccessMessage || alertMessage}</p>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
};

// Custom hook to use the context
export const DataPhones = () => {
  return useContext(DataContext);
};