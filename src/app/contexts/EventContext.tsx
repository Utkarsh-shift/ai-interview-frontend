"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from "react";
import { v4 as uuidv4 } from "uuid";
import { LoggedEvent } from "@/app/types";
import { saveLog } from "@/app/actions/logActions"; 

type EventContextValue = {
  loggedEvents: LoggedEvent[];
  logClientEvent: (eventObj: Record<string, any>, eventNameSuffix?: string) => void;
  logServerEvent: (eventObj: Record<string, any>, eventNameSuffix?: string) => void;
  toggleExpand: (id: number | string) => void;
};

const EventContext = createContext<EventContextValue | undefined>(undefined);

export const EventProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);

  function addLoggedEvent(direction: "client" | "server", eventName: string, eventData: Record<string, any>) {
    const id = eventData.event_id || uuidv4();
    setLoggedEvents((prev) => [
      ...prev,
      {
        id,
        direction,
        eventName,
        eventData,
        timestamp: new Date().toLocaleTimeString(),
        expanded: false,
      },
    ]);
  }

  
  const logClientEvent = async (eventObj: any, eventNameSuffix = "") => {
    const logData = {
      timestamp: new Date().toISOString(),
      type: "client",
      event: eventObj,
      suffix: eventNameSuffix,
    };
    await saveLog(logData);
    addLoggedEvent("client", eventNameSuffix, eventObj);
  };

  const logServerEvent = async (eventObj: any, eventNameSuffix = "") => {
    const logData = {
      timestamp: new Date().toISOString(),
      type: "server",
      event: eventObj,
      suffix: eventNameSuffix,
    };
    await saveLog(logData);
    addLoggedEvent("server", eventNameSuffix, eventObj);
  };

  const toggleExpand: EventContextValue["toggleExpand"] = (id) => {
    setLoggedEvents((prev) =>
      prev.map((log) => {
        if (log.id === id) {
          return { ...log, expanded: !log.expanded };
        }
        return log;
      })
    );
  };

  return (
    <EventContext.Provider value={{ loggedEvents, logClientEvent, logServerEvent, toggleExpand }}>
      {children}
    </EventContext.Provider>
  );
};

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
