import { Text as DefaultText, View as DefaultView, TextProps, ViewProps } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useAppTheme>['colors']
) {
  const theme = useAppTheme();
  const color = theme.colors[colorName];

  if (props.light && !theme.dark) {
    return props.light;
  }
  if (props.dark && theme.dark) {
    return props.dark;
  }

  return color;
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextThemedProps = ThemeProps & DefaultText['props'];
export type ViewThemedProps = ThemeProps & DefaultView['props'];

export function Text(props: TextThemedProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewThemedProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
} 