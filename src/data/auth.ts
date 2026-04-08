import { employeeStore } from "./employees";
import { roleStore, permissionStore } from "./roles-permissions";
import { getSupervisorByUsername } from "./supervisors";

export interface AuthUser {
  id: string;
  name: string;
  accountId: string;
  roleId: string;
  avatarUrl?: string;
  userType?: "employee" | "supervisor"; // 
  partnerId?: string; // ID
}

class AuthStore {
  private storageKey = "auth-user";
  private listeners: (() => void)[] = [];

  getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  login(accountId: string, password: string): { success: boolean; error?: string; user?: AuthUser } {
    // 
    if (accountId === "demo" && password === "demo") {
      const user: AuthUser = {
        id: "ADMIN001",
        name: "관리자",
        accountId: "demo",
        roleId: "ROLE001",
        userType: "employee",
      };

      localStorage.setItem(this.storageKey, JSON.stringify(user));
      this.notifyListeners();

      return { success: true, user };
    }

    // 
    return { success: false, error: "Account not found" };
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('access_token'); // access_token 
    localStorage.removeItem('refresh_token'); // refresh_token 
    this.notifyListeners();
  }

  hasPermission(module: string, action: string = "view"): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roleId) return false;

    // (roleId role )
    if (user.userType === "supervisor") {
      // 
      const role = roleStore.getById(user.roleId);
      if (!role) return false;
      
      const allPermissions = permissionStore.getAll();
      const targetPermission = allPermissions.find(
        p => p.resource === module && p.action === action
      );
      
      if (!targetPermission) return false;
      return role.permissions.includes(targetPermission.id);
    }

    const role = roleStore.getById(user.roleId);
    if (!role) return false;

    // 
    if (role.type === "ADMIN") return true;

    // - Permission 
    const allPermissions = permissionStore.getAll();
    const targetPermission = allPermissions.find(
      p => p.resource === module && p.action === action
    );
    
    if (!targetPermission) return false;
    return role.permissions.includes(targetPermission.id);
  }

  getAccessibleModules(): string[] {
    const user = this.getCurrentUser();
    if (!user || !user.roleId) return [];

    const role = roleStore.getById(user.roleId);
    if (!role) return [];

    // (ROLE002) field-orders 
    if (user.roleId === "ROLE002" || user.userType === "field-manager" || user.userType === "supervisor") {
      return ["field-orders"];
    }

    // 
    if (role.type === "ADMIN") {
      return [
        "dashboard",
        "permissions",
        "menu-management",
        "products",
        "partners",
        "orders",
        "banners",
        "channels",
        "community",
        "site-info",
      ];
    }

    // view 
    const allPermissions = permissionStore.getAll();
    const modules = new Set<string>();
    
    role.permissions.forEach((permId) => {
      const permission = allPermissions.find(p => p.id === permId);
      if (permission && permission.action === "view") {
        modules.add(permission.resource);
      }
    });

    return Array.from(modules);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const authStore = new AuthStore();