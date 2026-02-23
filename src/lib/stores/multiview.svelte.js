import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

export let viewState = $state({
  action: "none",
});

/**
 * @param {string} actionName
 */
export function setAction(actionName) {
  viewState.action = actionName;
}

export function clearAction() {
  viewState.action = "none";
}

/**
 *
 * @param {string} pathName
 */
export function selectToAction(pathName) {
  const selectedAction = viewState.action;

  clearAction();

  if (selectedAction === "none") {
    return;
  }

  switch (selectedAction) {
    case "inspect":
      goto(
        resolve("/(view)/(multiview)/inspect/[...path]", {
          path: pathName,
        }),
      );
      break;
    case "delete":
      goto(
        resolve("/(view)/(multiview)/delete/[...path]", {
          path: pathName,
        }),
      );
      break;
    default:
      return;
  }
}
