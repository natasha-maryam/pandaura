const demoAccounts = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "user123" },
];

export function authenticateUser(username: string, password: string): boolean {
  return demoAccounts.some(
    (acc) => acc.username === username && acc.password === password
  );
}
