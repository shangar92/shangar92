export const colors = {
  bg: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0F6',
  border: '#E8E8F0',
  text: '#14142B',
  textMuted: '#6E6E87',
  textFaint: '#A8A8BD',
  primary: '#FF2D6F',
  primaryEnd: '#FF7A59',
  primarySoft: '#FFE8EF',
  success: '#12B76A',
  successSoft: '#E6F8EF',
  warning: '#F79009',
  warningSoft: '#FEF3E2',
  danger: '#F04438',
  dangerSoft: '#FEECEB',
};

export const gradients = {
  primary: [colors.primary, colors.primaryEnd] as const,
  hero: ['#FF2D6F', '#FF5A5F', '#FF8A4C'] as const,
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#1B1B3A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  float: {
    shadowColor: '#FF2D6F',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};
