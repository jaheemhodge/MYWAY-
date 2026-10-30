import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** The user's city for Events. Local state only; never guessed. */
interface LocationState {
  city: string | null;
  setCity: (city: string | null) => void;
  located: boolean;
  setLocated: (v: boolean) => void;
}

const Ctx = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState<string | null>(null);
  const [located, setLocated] = useState(false);
  const value = useMemo(() => ({ city, setCity, located, setLocated }), [city, located]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCity(): LocationState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCity must be used inside LocationProvider");
  return v;
}
