export let config = $state({
  showVideoMultiView: true,
});

export function load() {
  config.showVideoMultiView = Boolean(
    Number(
      localStorage.getItem("showVideoMultiView") || config.showVideoMultiView,
    ),
  );
}
/**
 *
 * @param {string} configName
 * @param {string | number | boolean} value
 */
export function change(configName, value) {
  localStorage.setItem(configName, String(value));
  load();
}

export function clear() {
  localStorage.clear();
  load();
}
