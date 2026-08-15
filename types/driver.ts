export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  licenseType: number;
  createdAt: string;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  licenseType: number;
}

export interface UpdateDriverRequest extends CreateDriverRequest {
  id: number;
}
