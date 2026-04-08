/**
 * Roles & Permissions Store
 * 역할 및 권한 관리 스토어
 */

// 
export type RoleType = "ADMIN" | "FIELD_MANAGER";

// 
export type ResourceType = "dashboard" | "permissions" | "menu-management" | "products" | "partners" | "orders" | "banners" | "channels" | "community" | "site-info";

// 
export type ActionType = "view" | "create" | "edit" | "delete" | "approve" | "export";

// 
export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  description: string;
}

// 
export interface Role {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  permissions: string[]; // Permission IDs
  isSystem: boolean; // ( )
  color: string; // UI 
}

// localStorage 
const ROLES_STORAGE_KEY = "erp_roles_data";
const PERMISSIONS_STORAGE_KEY = "erp_permissions_data";

// localStorage 
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
  }
};

// 
const defaultPermissionsData: Permission[] = [
  // 
  { id: "PERM001", resource: "dashboard", action: "view", description: "대시보드 조회" },
  
  // 
  { id: "PERM026", resource: "permissions", action: "view", description: "권한 조회" },
  { id: "PERM027", resource: "permissions", action: "edit", description: "권한 수정" },
  
  // 
  { id: "PERM028", resource: "menu-management", action: "view", description: "메뉴 조회" },
  { id: "PERM029", resource: "menu-management", action: "create", description: "메뉴 생성" },
  { id: "PERM030", resource: "menu-management", action: "edit", description: "메뉴 수정" },
  { id: "PERM031", resource: "menu-management", action: "delete", description: "메뉴 삭제" },
  
  // 
  { id: "PERM032", resource: "products", action: "view", description: "상품 조회" },
  { id: "PERM033", resource: "products", action: "create", description: "상품 생성" },
  { id: "PERM034", resource: "products", action: "edit", description: "상품 수정" },
  { id: "PERM035", resource: "products", action: "delete", description: "상품 삭제" },
  
  // 
  { id: "PERM036", resource: "partners", action: "view", description: "파트너 조회" },
  { id: "PERM037", resource: "partners", action: "create", description: "파트너 생성" },
  { id: "PERM038", resource: "partners", action: "edit", description: "파트너 수정" },
  { id: "PERM039", resource: "partners", action: "delete", description: "파트너 삭제" },
  
  // 
  { id: "PERM040", resource: "orders", action: "view", description: "주문 조회" },
  { id: "PERM041", resource: "orders", action: "create", description: "주문 생성" },
  { id: "PERM042", resource: "orders", action: "edit", description: "주문 수정" },
  { id: "PERM043", resource: "orders", action: "delete", description: "주문 삭제" },
  
  // 
  { id: "PERM048", resource: "banners", action: "view", description: "배너 조회" },
  { id: "PERM049", resource: "banners", action: "create", description: "배너 생성" },
  { id: "PERM050", resource: "banners", action: "edit", description: "배너 수정" },
  { id: "PERM051", resource: "banners", action: "delete", description: "배너 삭제" },
  
  // 
  { id: "PERM054", resource: "channels", action: "view", description: "채널 조회" },
  { id: "PERM055", resource: "channels", action: "create", description: "채널 생성" },
  { id: "PERM056", resource: "channels", action: "edit", description: "채널 수정" },
  { id: "PERM057", resource: "channels", action: "delete", description: "채널 삭제" },
  
  // 
  { id: "PERM044", resource: "community", action: "view", description: "커뮤니티 조회" },
  { id: "PERM045", resource: "community", action: "create", description: "커뮤니티 생성" },
  { id: "PERM046", resource: "community", action: "edit", description: "커뮤니티 수정" },
  { id: "PERM047", resource: "community", action: "delete", description: "커뮤니티 삭제" },
  
  // 
  { id: "PERM052", resource: "site-info", action: "view", description: "사이트 정보 조회" },
  { id: "PERM053", resource: "site-info", action: "edit", description: "사이트 정보 수정" },
];

// 
const defaultRolesData: Role[] = [
  {
    id: "ROLE001",
    name: "관리자",
    type: "ADMIN",
    description: "모든 권한을 가진 시스템 관리자",
    permissions: defaultPermissionsData.map(p => p.id), // 
    isSystem: true,
    color: "#0c8ce9",
  },
  {
    id: "ROLE002",
    name: "현장관리자",
    type: "FIELD_MANAGER",
    description: "주문 관리 권한을 가진 현장관리자",
    permissions: [
      "PERM040", // 
      "PERM041", // 
      "PERM042", // 
    ],
    isSystem: true,
    color: "#10b981",
  },
];

// (localStorage )
let permissionsData: Permission[] = loadFromStorage(PERMISSIONS_STORAGE_KEY, defaultPermissionsData);
let rolesData: Role[] = loadFromStorage(ROLES_STORAGE_KEY, defaultRolesData);

// 
type Listener = () => void;
const permissionListeners: Listener[] = [];
const roleListeners: Listener[] = [];

// 
export const permissionStore = {
  getAll: () => [...permissionsData],
  
  getByResource: (resource: ResourceType) => 
    permissionsData.filter(p => p.resource === resource),
  
  add: (permission: Permission) => {
    permissionsData = [permission, ...permissionsData];
    saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
    notifyPermissionListeners();
  },
  
  update: (id: string, updates: Partial<Permission>) => {
    permissionsData = permissionsData.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
    notifyPermissionListeners();
  },
  
  remove: (id: string) => {
    permissionsData = permissionsData.filter(p => p.id !== id);
    saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
    notifyPermissionListeners();
  },
  
  subscribe: (listener: Listener) => {
    permissionListeners.push(listener);
    return () => {
      const index = permissionListeners.indexOf(listener);
      if (index > -1) {
        permissionListeners.splice(index, 1);
      }
    };
  },
};

// 
export const roleStore = {
  getAll: () => [...rolesData],
  
  getById: (id: string) => rolesData.find(r => r.id === id),
  
  add: (role: Role) => {
    rolesData = [role, ...rolesData];
    saveToStorage(ROLES_STORAGE_KEY, rolesData);
    notifyRoleListeners();
  },
  
  update: (id: string, updates: Partial<Role>) => {
    rolesData = rolesData.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    saveToStorage(ROLES_STORAGE_KEY, rolesData);
    notifyRoleListeners();
  },
  
  remove: (id: string) => {
    const role = rolesData.find(r => r.id === id);
    if (role?.isSystem) {
      throw new Error("시스템 기본 역할은 삭제할 수 없습니다.");
    }
    rolesData = rolesData.filter(r => r.id !== id);
    saveToStorage(ROLES_STORAGE_KEY, rolesData);
    notifyRoleListeners();
  },
  
  getNextId: () => {
    if (rolesData.length === 0) {
      return "ROLE001";
    }
    const maxId = Math.max(...rolesData.map(r => parseInt(r.id.replace("ROLE", ""))));
    return `ROLE${String(maxId + 1).padStart(3, "0")}`;
  },
  
  // 
  hasPermission: (roleId: string, resource: ResourceType, action: ActionType): boolean => {
    const role = rolesData.find(r => r.id === roleId);
    if (!role) return false;
    
    const permission = permissionsData.find(
      p => p.resource === resource && p.action === action
    );
    if (!permission) return false;
    
    return role.permissions.includes(permission.id);
  },
  
  subscribe: (listener: Listener) => {
    roleListeners.push(listener);
    return () => {
      const index = roleListeners.indexOf(listener);
      if (index > -1) {
        roleListeners.splice(index, 1);
      }
    };
  },
};

function notifyPermissionListeners() {
  permissionListeners.forEach(listener => listener());
}

function notifyRoleListeners() {
  roleListeners.forEach(listener => listener());
}

// 
export function resetRolesAndPermissions() {
  localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
  localStorage.removeItem(ROLES_STORAGE_KEY);
  permissionsData = [...defaultPermissionsData];
  rolesData = [...defaultRolesData];
  saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
  saveToStorage(ROLES_STORAGE_KEY, rolesData);
  notifyPermissionListeners();
  notifyRoleListeners();
}

// ( )
export function syncAdminPermissions() {
  // 
  permissionsData = loadFromStorage(PERMISSIONS_STORAGE_KEY, defaultPermissionsData);
  rolesData = loadFromStorage(ROLES_STORAGE_KEY, defaultRolesData);
  
  // (id )
  const uniquePermissions = permissionsData.reduce((acc, permission) => {
    if (!acc.find(p => p.id === permission.id)) {
      acc.push(permission);
    }
    return acc;
  }, [] as Permission[]);
  
  // 
  if (uniquePermissions.length !== permissionsData.length) {
    permissionsData = uniquePermissions;
    saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
  }
  
  const adminRole = rolesData.find(r => r.type === "ADMIN");
  if (adminRole) {
    // 
    const allPermissionIds = permissionsData.map(p => p.id);
    if (adminRole.permissions.length !== allPermissionIds.length) {
      roleStore.update(adminRole.id, { permissions: allPermissionIds });
    }
  }
}

// 
(() => {
  // 
  const storedPermissions = loadFromStorage<Permission[]>(PERMISSIONS_STORAGE_KEY, []);
  const hasNewPermissions = defaultPermissionsData.some(
    defaultPerm => !storedPermissions.find(stored => stored.id === defaultPerm.id)
  );

  if (hasNewPermissions) {
    // 
    const mergedPermissions = [...storedPermissions];
    defaultPermissionsData.forEach(defaultPerm => {
      if (!mergedPermissions.find(p => p.id === defaultPerm.id)) {
        mergedPermissions.push(defaultPerm);
      }
    });
    permissionsData = mergedPermissions;
    saveToStorage(PERMISSIONS_STORAGE_KEY, permissionsData);
    
    // 
    syncAdminPermissions();
  }
})();