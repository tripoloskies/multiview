import { goto } from "$app/navigation";
import { resolve } from "$app/paths";


export const enum actions {
  inspect = "inspect",
  delete = "delete",
  restart = "restart",
  none = "none"
}

export const viewState = $state({
  action: actions.none,
});

export function setAction(actionName: actions): void {
  viewState.action = actionName;
}

export function clearAction() {
  viewState.action = actions.none;
}

export function selectToAction(pathName: string): string | void {
  const selectedAction = viewState.action;

  clearAction();

  if (selectedAction === actions.none) {
    return undefined;
  }

  // SvelteKit's resolve does not like a path with template literals inside.
  // So, I hardcoded per action.
  switch (selectedAction) {
    case actions.inspect:
      goto(
        resolve("/(view)/(multiview)/inspect/[...path]", {
          path: pathName,
        }),
      );
    break;
    case actions.delete:
      goto(
        resolve("/(view)/(multiview)/delete/[...path]", {
          path: pathName,
        }),
      );
    break;
    case actions.restart:
      goto(
        resolve("/(view)/(multiview)/restart/[...path]", {
          path: pathName,
        }),
      );  
    break;
    default:
      return;
  }
}
