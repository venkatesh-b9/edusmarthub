import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'super-admin' | 'school-admin' | 'teacher' | 'parent';

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userInfo: {
    name: string;
    email: string;
    avatar: string;
    school?: string;
  };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const roleUserInfo: Record<UserRole, { name: string; email: string; avatar: string; school?: string }> = {
  'super-admin': {
    name: 'Marcus Chen',
    email: 'marcus.chen@edusmarthub.com',
    avatar: 'MC',
  },
  'school-admin': {
    name: 'Sarah Williams',
    email: 'sarah.w@lincoln-high.edu',
    avatar: 'SW',
    school: 'Lincoln High School',
  },
  'teacher': {
    name: 'David Thompson',
    email: 'd.thompson@lincoln-high.edu',
    avatar: 'DT',
    school: 'Lincoln High School',
  },
  'parent': {
    name: 'Jennifer Martinez',
    email: 'jennifer.m@email.com',
    avatar: 'JM',
  },
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('super-admin');

  const userInfo = roleUserInfo[currentRole];

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, userInfo }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
