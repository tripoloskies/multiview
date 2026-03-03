export const config = $state({
  showVideoMultiView: true,
});

export function load(): void {
  config.showVideoMultiView = Boolean(
    Number(
      localStorage.getItem("showVideoMultiView") || config.showVideoMultiView,
    ),
  );
}

export function change(
  configName: string,
  value: string | boolean | number,
): void {
  localStorage.setItem(configName, String(value));
  load();
}

export function clear(): void {
  localStorage.clear();
  load();
}
