export type EmployeeStatus = "출근" | "외근" | "휴가" | "휴직" | "반차" | "퇴근" | "퇴사";
export type AccountStatus = "활성화" | "비활성화";

export interface Employee {
  id: string;
  name: string;
  position: string;
  organization: string;
  accountId: string;
  email?: string;
  phone: string;
  joinDate: string;
  status: EmployeeStatus;
  accountStatus: AccountStatus;
  password: string;
  avatarUrl?: string;
  roleId?: string; // ID (ROLE001, ROLE002, )
}

// localStorage 
const EMPLOYEES_STORAGE_KEY = "erp_employees_data";

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

// - 
const defaultEmployeesData: Employee[] = [
  {
    id: "EMP001",
    name: "관리자",
    position: "대표이사",
    organization: "경영진",
    accountId: "admin",
    email: "admin@company.co.kr",
    phone: "010-0000-0001",
    joinDate: "2020-01-01",
    status: "출근",
    accountStatus: "활성화",
    password: "demo",
    roleId: "ROLE001", // 
  },
];

// (localStorage )
let employeesData: Employee[] = loadFromStorage(EMPLOYEES_STORAGE_KEY, defaultEmployeesData);

// 
if (employeesData.length === 0 || !employeesData.some(e => e.accountId === "admin")) {
  employeesData = defaultEmployeesData;
  saveToStorage(EMPLOYEES_STORAGE_KEY, employeesData);
}

// ( )
type Listener = () => void;
const listeners: Listener[] = [];

export const employeeStore = {
  getAll: () => [...employeesData],
  
  add: (emp: Employee) => {
    employeesData = [emp, ...employeesData];
    saveToStorage(EMPLOYEES_STORAGE_KEY, employeesData);
    notifyListeners();
  },
  
  update: (id: string, updates: Partial<Employee>) => {
    employeesData = employeesData.map(emp =>
      emp.id === id ? { ...emp, ...updates } : emp
    );
    saveToStorage(EMPLOYEES_STORAGE_KEY, employeesData);
    notifyListeners();
  },
  
  remove: (id: string) => {
    employeesData = employeesData.filter(emp => emp.id !== id);
    saveToStorage(EMPLOYEES_STORAGE_KEY, employeesData);
    notifyListeners();
  },
  
  getNextId: () => {
    if (employeesData.length === 0) {
      return "EMP001";
    }
    const maxId = Math.max(...employeesData.map(emp => parseInt(emp.id.replace("EMP", ""))));
    return `EMP${String(maxId + 1).padStart(3, "0")}`;
  },
  
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};

function notifyListeners() {
  listeners.forEach(listener => listener());
}
