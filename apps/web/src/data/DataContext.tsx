import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Ammunition,
  CreateAmmunitionInput,
  CreateDogInput,
  CreateLocationInput,
  CreateSessionInput,
  CreateWeaponInput,
  Dog,
  Location,
  Session,
  UserData,
  Weapon,
} from '@huntledger/shared';
import { useAuth } from '../auth/useAuth';
import type { DataAdapter } from './DataAdapter';
import { LocalStorageDataAdapter } from './LocalStorageDataAdapter';
import { buildSeedData } from './seed';

export interface DataContextValue {
  data: UserData;
  isLoading: boolean;
  refresh: () => Promise<void>;
  createWeapon: (input: CreateWeaponInput) => Promise<Weapon>;
  createAmmunition: (input: CreateAmmunitionInput) => Promise<Ammunition>;
  createDog: (input: CreateDogInput) => Promise<Dog>;
  createLocation: (input: CreateLocationInput) => Promise<Location>;
  createSession: (input: CreateSessionInput) => Promise<Session>;
}

const empty: UserData = {
  sessions: [],
  weapons: [],
  ammunition: [],
  dogs: [],
  locations: [],
};

export const DataContext = createContext<DataContextValue | undefined>(undefined);

// F2: swap to ApiDataAdapter when VITE_USE_BACKEND === 'true'.
const adapter: DataAdapter = new LocalStorageDataAdapter();

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>(empty);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(empty);
      return;
    }
    const loaded = await adapter.load(user.id);
    const isEmpty =
      loaded.sessions.length === 0 &&
      loaded.weapons.length === 0 &&
      loaded.ammunition.length === 0 &&
      loaded.dogs.length === 0 &&
      loaded.locations.length === 0;

    if (isEmpty) {
      const seeded = buildSeedData(user.id);
      await adapter.save(user.id, seeded);
      setData(seeded);
    } else {
      setData(loaded);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setData(empty);
      return;
    }
    setIsLoading(true);
    refresh()
      .catch((err) => console.error('Failed to load HuntLedger data', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  const createWeapon = useCallback<DataContextValue['createWeapon']>(
    async (input) => {
      if (!user) throw new Error('not signed in');
      const weapon = await adapter.createWeapon(user.id, input);
      await refresh();
      return weapon;
    },
    [user, refresh],
  );

  const createAmmunition = useCallback<DataContextValue['createAmmunition']>(
    async (input) => {
      if (!user) throw new Error('not signed in');
      const ammo = await adapter.createAmmunition(user.id, input);
      await refresh();
      return ammo;
    },
    [user, refresh],
  );

  const createDog = useCallback<DataContextValue['createDog']>(
    async (input) => {
      if (!user) throw new Error('not signed in');
      const dog = await adapter.createDog(user.id, input);
      await refresh();
      return dog;
    },
    [user, refresh],
  );

  const createLocation = useCallback<DataContextValue['createLocation']>(
    async (input) => {
      if (!user) throw new Error('not signed in');
      const location = await adapter.createLocation(user.id, input);
      await refresh();
      return location;
    },
    [user, refresh],
  );

  const createSession = useCallback<DataContextValue['createSession']>(
    async (input) => {
      if (!user) throw new Error('not signed in');
      const session = await adapter.createSession(user.id, input);
      await refresh();
      return session;
    },
    [user, refresh],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      isLoading,
      refresh,
      createWeapon,
      createAmmunition,
      createDog,
      createLocation,
      createSession,
    }),
    [data, isLoading, refresh, createWeapon, createAmmunition, createDog, createLocation, createSession],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
