/** Shape of GET /api/v1/auth/me. */
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  roles: string[];
  permissions: string[];
};

/** Shape of a row in GET /api/v1/users. */
export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles: string[];
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number | null;
  last_page: number | null;
};
