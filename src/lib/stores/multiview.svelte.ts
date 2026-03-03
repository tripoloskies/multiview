import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

export const viewState = $state({
  action: "none",
});

export function setAction(actionName: string): void {
  viewState.action = actionName;
}

export function clearAction() {
  viewState.action = "none";
}

export function selectToAction(pathName: string): string | void {
  const selectedAction = viewState.action;

  clearAction();

  if (selectedAction === "none") {
    return undefined;
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
