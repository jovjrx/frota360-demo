import { NextApiRequest, NextApiResponse } from 'next';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { SessionData } from '@/lib/session/ironSession';

export type Role = 'admin' | 'ops' | 'driver';

export interface AuthContext {
  user: SessionData;
  role: Role;
}

export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  
  const roleHierarchy: Record<Role, number> = {
    admin: 3,
    ops: 2,
    driver: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function requireRole(requiredRole: Role) {
  return function (handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const session = await getSession(req, res);
        
        if (!session.isLoggedIn || !session.role) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (!hasRole(session.role, requiredRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        const context: AuthContext = {
          user: session,
          role: session.role,
        };
        
        return handler(req, res, context);
      } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

export function withAuth(requiredRole: Role) {
  return function (getServerSideProps: (context: GetServerSidePropsContext & { auth: AuthContext }) => Promise<any>) {
    return async (context: GetServerSidePropsContext) => {
      try {
        const session = await getSession(context.req as any, context.res as any);
        
        if (!session.isLoggedIn || !session.role) {
          return {
            redirect: {
              destination: '/login',
              permanent: false,
            },
          };
        }
        
        if (!hasRole(session.role, requiredRole)) {
          return {
            redirect: {
              destination: '/dashboard',
              permanent: false,
            },
          };
        }
        
        const authContext: AuthContext = {
          user: session,
          role: session.role,
        };
        
        return getServerSideProps({ ...context, auth: authContext });
      } catch (error) {
        console.error('Auth error:', error);
        return {
          redirect: {
            destination: '/login',
            permanent: false,
          },
        };
      }
    };
  };
}

export function withAdmin(getServerSideProps?: (context: GetServerSidePropsContext & { auth: AuthContext }) => Promise<any>) {
  return withAuth('admin')(getServerSideProps || (() => Promise.resolve({ props: {} })));
}

export function withOps(getServerSideProps?: (context: GetServerSidePropsContext & { auth: AuthContext }) => Promise<any>) {
  return withAuth('ops')(getServerSideProps || (() => Promise.resolve({ props: {} })));
}

export function withDriver(getServerSideProps?: (context: GetServerSidePropsContext & { auth: AuthContext }) => Promise<any>) {
  return withAuth('driver')(getServerSideProps || (() => Promise.resolve({ props: {} })));
}

export function requireAdmin(handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>) {
  return requireRole('admin')(handler);
}

export function requireOps(handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>) {
  return requireRole('ops')(handler);
}

export function requireDriver(handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>) {
  return requireRole('driver')(handler);
}

export function canAccessResource(userRole: Role, resourceOwnerId: string, userId: string): boolean {
  if (userRole === 'admin' || userRole === 'ops') {
    return true;
  }
  
  return resourceOwnerId === userId;
}

export function getRolePermissions(role: Role): string[] {
  const permissions: Record<Role, string[]> = {
    admin: [
      'drivers:read',
      'drivers:write',
      'drivers:delete',
      'plans:read',
      'plans:write',
      'plans:delete',
      'subscriptions:read',
      'subscriptions:write',
      'subscriptions:delete',
      'billing:read',
      'billing:write',
      'payouts:read',
      'payouts:write',
      'uber:read',
      'uber:write',
      'audit:read',
      'system:admin',
    ],
    ops: [
      'drivers:read',
      'drivers:write',
      'plans:read',
      'subscriptions:read',
      'billing:read',
      'payouts:read',
      'payouts:write',
      'uber:read',
      'audit:read',
    ],
    driver: [
      'profile:read',
      'profile:write',
      'subscription:read',
      'subscription:write',
      'payouts:read',
      'uber:read',
    ],
  };
  
  return permissions[role] || [];
}

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}
