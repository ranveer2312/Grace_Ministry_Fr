/* // themes.ts
// Centralized theme definitions

export interface Theme {
  mode: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  // Additional properties can be added as needed
}

// Dark Mode Theme
export const darkTheme: Theme = {
  background: '#000000',
  card: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#999999',
  primary: '#FFD700',
  border: 'rgba(255, 255, 255, 0.1)',
  mode: "dark",
};

// Light Mode Theme
export const lightTheme: Theme = {
  background: '#F0F2F5',
  card: '#FFFFFF',
  text: '#1C1E21',
  textSecondary: '#65676B',
  primary: '#D4AF37',
  border: '#CED0D4',
  mode: "light",
};
 */