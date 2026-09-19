export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  licenseType: number;
  createdAt: string;
  username: string;
  isActive: boolean;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  licenseType: number;
  username: string;
  password: string;
}

export interface UpdateDriverRequest {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  licenseType: number;
  username: string;
  password?: string;
}