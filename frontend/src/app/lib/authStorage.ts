const TOKEN_KEY = "token";
const ROLE_KEY = "userRole";
const IDENTIFIER_KEY = "userIdentifier";

const getStorage = (rememberMe: boolean) => (rememberMe ? localStorage : sessionStorage);

export const setAuthSession = ({
  token,
  role,
  identifier,
  rememberMe,
}: {
  token: string;
  role: string;
  identifier: string;
  rememberMe: boolean;
}) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(IDENTIFIER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(IDENTIFIER_KEY);

  const storage = getStorage(rememberMe);
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(ROLE_KEY, role);
  storage.setItem(IDENTIFIER_KEY, identifier);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
export const getStoredRole = () => localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY);
export const getStoredIdentifier = () => localStorage.getItem(IDENTIFIER_KEY) || sessionStorage.getItem(IDENTIFIER_KEY);

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(IDENTIFIER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(IDENTIFIER_KEY);
};
